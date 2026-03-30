import { BASE_DICE_IDS, type DieId, type DieValue } from "@clever/shared";

import type {
  BonusResolutionAction,
  CreateInitialGameStateOptions,
  GameStateSnapshot,
  PassivePickSnapshot,
  PlayerSheetSnapshot,
  TurnStateSnapshot
} from "../model/game-state";
import { getTotalRoundsForPlayerCount } from "./endgame-engine";
import { buildFinalStandings, scorePlayers } from "./scoring-engine";
import {
  applyPlacementToSheet,
  createEmptyPlayerSheet,
  enqueueSheetBonuses,
  resolvePendingBonus,
  type PendingSheetBonus,
  type SheetPlacement
} from "../rules/player-sheet";

export const MAX_ACTIVE_SELECTIONS = 3;

export type GameAction =
  | {
      type: "active-roll";
      dice: DieValue[];
    }
  | {
      type: "active-select";
      dieId: DieId;
      placement: SheetPlacement;
    }
  | {
      type: "passive-pick";
      playerId: string;
      dieId: DieId;
      placement: SheetPlacement;
    }
  | {
      type: "passive-skip";
      playerId: string;
    }
  | ({
      type: "resolve-bonus";
    } & BonusResolutionAction)
  | {
      type: "advance-turn";
    };

export function createInitialGameState(
  options: CreateInitialGameStateOptions,
): GameStateSnapshot {
  const playerIds = ensureUniquePlayerIds(options.playerIds);
  const currentPlayerId = playerIds[0] ?? null;
  const totalRounds =
    options.totalRounds ?? getTotalRoundsForPlayerCount(playerIds.length);
  const turn = currentPlayerId
    ? createTurnState(currentPlayerId, playerIds.slice(1))
    : null;

  return {
    roomId: options.roomId,
    phase: currentPlayerId ? "awaiting_active_roll" : "lobby",
    round: 1,
    totalRounds,
    activePlayerIndex: 0,
    currentPlayerId,
    players: playerIds.map((playerId) => ({
      playerId,
      selectedDiceThisTurn: 0,
      score: 0,
      lastPassiveDie: null,
      sheet: createEmptyPlayerSheet()
    })),
    turn,
    standings: null,
    logs: [
      {
        id: "log-setup",
        message: currentPlayerId
          ? `Game initialized. ${currentPlayerId} will take the first turn.`
          : "Game initialized without players.",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function applyGameAction(
  state: GameStateSnapshot,
  action: GameAction,
): GameStateSnapshot {
  switch (action.type) {
    case "active-roll":
      return rollActiveDice(state, action.dice);
    case "active-select":
      return selectActiveDie(state, action.dieId, action.placement);
    case "passive-pick":
      return pickPassiveDie(state, action.playerId, action.dieId, action.placement);
    case "passive-skip":
      return skipPassiveDie(state, action.playerId);
    case "resolve-bonus":
      return resolvePlayerBonus(state, action);
    case "advance-turn":
      return advanceTurn(state);
    default:
      return state;
  }
}

export function rollActiveDice(
  state: GameStateSnapshot,
  dice: DieValue[],
): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_active_roll");

  validateRoll(turn.availableDiceIds, dice);

  return withLog(
    {
      ...state,
      phase: "awaiting_active_selection",
      turn: {
        ...turn,
        currentDiceValues: {
          ...turn.currentDiceValues,
          ...Object.fromEntries(dice.map((die) => [die.id, die.value]))
        },
        rolledDice: normalizeDiceOrder(turn.availableDiceIds, dice)
      }
    },
    `Active player ${turn.activePlayerId} rolled ${dice.length} dice for pick ${turn.pickNumber}.`,
  );
}

export function selectActiveDie(
  state: GameStateSnapshot,
  dieId: DieId,
  placement: SheetPlacement,
): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_active_selection");
  const selectedDie = turn.rolledDice.find((die) => die.id === dieId);

  invariant(selectedDie, `Die ${dieId} is not available to select.`);

  const activePlayer = requirePlayer(state.players, turn.activePlayerId);
  const placementResult = applyPlacementToSheet(activePlayer.sheet, placement, {
    die: selectedDie,
    currentDiceValues: turn.currentDiceValues
  });
  const playersAfterPlacement = replacePlayer(state.players, {
    ...activePlayer,
    selectedDiceThisTurn: activePlayer.selectedDiceThisTurn + 1,
    sheet: enqueueSheetBonuses(
      placementResult.sheet,
      placementResult.triggeredBonuses,
    )
  });

  const lowerDice = turn.rolledDice.filter((die) => die.value < selectedDie.value);
  const rerollDice = turn.rolledDice.filter(
    (die) => die.id !== selectedDie.id && die.value >= selectedDie.value,
  );
  const activeSelections = [...turn.activeSelections, selectedDie];
  const selectedDiceCount = activeSelections.length;
  const isFinalActivePick =
    selectedDiceCount >= MAX_ACTIVE_SELECTIONS || rerollDice.length === 0;
  const silverPlatter = isFinalActivePick
    ? [...turn.silverPlatter, ...lowerDice, ...rerollDice]
    : [...turn.silverPlatter, ...lowerDice];
  const nextPlayers = replacePlayer(playersAfterPlacement, {
    ...requirePlayer(playersAfterPlacement, turn.activePlayerId),
    selectedDiceThisTurn: selectedDiceCount
  });

  if (!isFinalActivePick) {
    return finalizeAfterPlacement(
      {
        ...state,
        phase: "awaiting_active_roll",
        players: nextPlayers,
        turn: {
          ...turn,
          pickNumber: (selectedDiceCount + 1) as 1 | 2 | 3,
          availableDiceIds: rerollDice.map((die) => die.id),
          rolledDice: [],
          activeSelections,
          silverPlatter
        }
      },
      turn.activePlayerId,
      "awaiting_active_roll",
      `Active player ${turn.activePlayerId} selected ${selectedDie.id}=${selectedDie.value} and filled ${placement.zone}.`,
    );
  }

  const nextPhase = hasPendingPassiveSelections(turn)
    ? "awaiting_passive_picks"
    : "awaiting_turn_end";

  return finalizeAfterPlacement(
    {
      ...state,
      phase: nextPhase,
      players: nextPlayers,
      turn: {
        ...turn,
        availableDiceIds: [],
        rolledDice: [],
        activeSelections,
        silverPlatter
      }
    },
    turn.activePlayerId,
    nextPhase,
    `Active player ${turn.activePlayerId} completed the active portion of the turn via ${placement.zone}.`,
  );
}

export function pickPassiveDie(
  state: GameStateSnapshot,
  playerId: string,
  dieId: DieId,
  placement: SheetPlacement,
): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_passive_picks");
  const passiveSelection = turn.passiveSelections.find(
    (selection) => selection.playerId === playerId,
  );

  invariant(passiveSelection, `Player ${playerId} is not a passive player this turn.`);
  invariant(
    passiveSelection.status === "pending",
    `Passive player ${playerId} has already resolved their pick.`,
  );

  const chosenDie = turn.silverPlatter.find((die) => die.id === dieId);
  invariant(chosenDie, `Die ${dieId} is not available on the silver platter.`);

  const passivePlayer = requirePlayer(state.players, playerId);
  const placementResult = applyPlacementToSheet(passivePlayer.sheet, placement, {
    die: chosenDie,
    currentDiceValues: turn.currentDiceValues
  });
  const passiveSelections: PassivePickSnapshot[] = turn.passiveSelections.map(
    (selection): PassivePickSnapshot =>
      selection.playerId === playerId
        ? {
            ...selection,
            status: "picked",
            chosenDie
          }
        : selection,
  );
  const players = replacePlayer(state.players, {
    ...passivePlayer,
    lastPassiveDie: chosenDie,
    sheet: enqueueSheetBonuses(
      placementResult.sheet,
      placementResult.triggeredBonuses,
    )
  });
  const phase: "awaiting_turn_end" | "awaiting_passive_picks" = passiveSelections.every(
    (selection) => selection.status !== "pending",
  )
    ? "awaiting_turn_end"
    : "awaiting_passive_picks";

  return finalizeAfterPlacement(
    {
      ...state,
      phase,
      players,
      turn: {
        ...turn,
        passiveSelections
      }
    },
    playerId,
    phase,
    `Passive player ${playerId} selected ${chosenDie.id}=${chosenDie.value} and filled ${placement.zone}.`,
  );
}

export function skipPassiveDie(
  state: GameStateSnapshot,
  playerId: string,
): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_passive_picks");
  const passiveSelection = turn.passiveSelections.find(
    (selection) => selection.playerId === playerId,
  );

  invariant(passiveSelection, `Player ${playerId} is not a passive player this turn.`);
  invariant(
    passiveSelection.status === "pending",
    `Passive player ${playerId} has already resolved their pick.`,
  );

  const passiveSelections: PassivePickSnapshot[] = turn.passiveSelections.map(
    (selection): PassivePickSnapshot =>
      selection.playerId === playerId
        ? {
            ...selection,
            status: "skipped",
            chosenDie: null
          }
        : selection,
  );
  const phase = passiveSelections.every((selection) => selection.status !== "pending")
    ? "awaiting_turn_end"
    : state.phase;

  return withLog(
    {
      ...state,
      phase,
      turn: {
        ...turn,
        passiveSelections
      }
    },
    `Passive player ${playerId} skipped their silver-platter pick.`,
  );
}

export function advanceTurn(state: GameStateSnapshot): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_turn_end");
  const nextActivePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  const nextActivePlayerId = state.players[nextActivePlayerIndex]?.playerId ?? null;

  invariant(nextActivePlayerId, "Cannot advance turn without at least one player.");

  if (nextActivePlayerIndex === 0 && state.round >= state.totalRounds) {
    const scoredPlayers = scorePlayers(resetPlayerTurnState(state.players));

    return withLog(
      {
        ...state,
        phase: "finished",
        currentPlayerId: null,
        players: scoredPlayers,
        turn: null,
        standings: buildFinalStandings(scoredPlayers)
      },
      `Game finished after round ${state.totalRounds}. Final standings were generated.`,
    );
  }

  const nextRound = nextActivePlayerIndex === 0 ? state.round + 1 : state.round;
  const passivePlayerIds = state.players
    .map((player) => player.playerId)
    .filter((playerId) => playerId !== nextActivePlayerId);

  return withLog(
    {
      ...state,
      phase: "awaiting_active_roll",
      round: nextRound,
      activePlayerIndex: nextActivePlayerIndex,
      currentPlayerId: nextActivePlayerId,
      players: resetPlayerTurnState(state.players),
      turn: createTurnState(nextActivePlayerId, passivePlayerIds)
    },
    `Turn advanced. ${turn.activePlayerId} passed the dice to ${nextActivePlayerId}.`,
  );
}

export const sampleGameState = createInitialGameState({
  roomId: "demo-room",
  playerIds: ["player-1", "player-2", "player-3"]
});

export function enqueuePlayerBonuses(
  state: GameStateSnapshot,
  playerId: string,
  bonuses: PendingSheetBonus[],
  resumePhase: Exclude<GameStateSnapshot["phase"], "awaiting_bonus_resolution">,
): GameStateSnapshot {
  const player = requirePlayer(state.players, playerId);
  const updatedPlayer = {
    ...player,
    sheet: enqueueSheetBonuses(player.sheet, bonuses)
  };

  return {
    ...state,
    phase: "awaiting_bonus_resolution",
    players: replacePlayer(state.players, updatedPlayer),
    turn: state.turn
      ? {
          ...state.turn,
          pendingBonusResolution: {
            playerId,
            bonuses: updatedPlayer.sheet.pendingBonuses,
            resumePhase
          }
        }
      : null
  };
}

export function resolvePlayerBonus(
  state: GameStateSnapshot,
  action: BonusResolutionAction,
): GameStateSnapshot {
  const turn = requireTurnAndBonusResolution(state, action.playerId);
  const player = requirePlayer(state.players, action.playerId);
  const resolution = resolvePendingBonus(player.sheet, action.bonusIndex, action.placement);
  const updatedPlayer = {
    ...player,
    sheet: enqueueSheetBonuses(resolution.sheet, resolution.triggeredBonuses)
  };
  const players = replacePlayer(state.players, updatedPlayer);

  if (updatedPlayer.sheet.pendingBonuses.length > 0) {
    return withLog(
      {
        ...state,
        players,
        turn: {
          ...turn,
          pendingBonusResolution: {
            ...turn.pendingBonusResolution!,
            bonuses: updatedPlayer.sheet.pendingBonuses
          }
        }
      },
      `Player ${action.playerId} resolved one bonus and still has pending bonus steps.`,
    );
  }

  return withLog(
    {
      ...state,
      phase: turn.pendingBonusResolution!.resumePhase,
      players,
      turn: {
        ...turn,
        pendingBonusResolution: null
      }
    },
    `Player ${action.playerId} resolved their pending bonus chain.`,
  );
}

function createTurnState(
  activePlayerId: string,
  passivePlayerIds: string[],
): TurnStateSnapshot {
  return {
    activePlayerId,
    pickNumber: 1,
    availableDiceIds: [...BASE_DICE_IDS],
    rolledDice: [],
    currentDiceValues: {},
    activeSelections: [],
    silverPlatter: [],
    passiveSelections: passivePlayerIds.map<PassivePickSnapshot>((playerId) => ({
      playerId,
      status: "pending",
      chosenDie: null
    })),
    pendingBonusResolution: null
  };
}

function ensureUniquePlayerIds(playerIds: string[]) {
  const uniqueIds = [...new Set(playerIds)];
  invariant(uniqueIds.length === playerIds.length, "Player ids must be unique.");
  return uniqueIds;
}

function requireTurnPhase(
  state: GameStateSnapshot,
  expectedPhase: GameStateSnapshot["phase"],
) {
  invariant(
    state.phase === expectedPhase,
    `Expected phase ${expectedPhase} but received ${state.phase}.`,
  );
  invariant(state.turn, "Expected an active turn state.");
  return state.turn;
}

function requireTurnAndBonusResolution(
  state: GameStateSnapshot,
  playerId: string,
) {
  const turn = requireTurnPhase(state, "awaiting_bonus_resolution");

  invariant(turn.pendingBonusResolution, "Expected a pending bonus resolution context.");
  invariant(
    turn.pendingBonusResolution.playerId === playerId,
    `Expected bonus resolution for ${turn.pendingBonusResolution.playerId}, received ${playerId}.`,
  );

  return turn;
}

function validateRoll(expectedIds: DieId[], dice: DieValue[]) {
  invariant(
    dice.length === expectedIds.length,
    `Expected ${expectedIds.length} rolled dice but received ${dice.length}.`,
  );

  const actualIds = [...dice.map((die) => die.id)].sort();
  const sortedExpectedIds = [...expectedIds].sort();

  invariant(
    actualIds.every((dieId, index) => dieId === sortedExpectedIds[index]),
    "Rolled dice ids do not match the currently available dice.",
  );

  for (const die of dice) {
    invariant(
      die.value >= 1 && die.value <= 6,
      `Die ${die.id} has invalid value ${die.value}.`,
    );
  }
}

function normalizeDiceOrder(expectedIds: DieId[], dice: DieValue[]) {
  return expectedIds
    .map((dieId) => dice.find((die) => die.id === dieId))
    .filter((die): die is DieValue => Boolean(die));
}

function resetPlayerTurnState(players: PlayerSheetSnapshot[]) {
  return players.map((player) => ({
    ...player,
    selectedDiceThisTurn: 0,
    lastPassiveDie: null
  }));
}

function hasPendingPassiveSelections(turn: TurnStateSnapshot) {
  return turn.passiveSelections.length > 0;
}

function finalizeAfterPlacement(
  state: GameStateSnapshot,
  playerId: string,
  resumePhase: Exclude<GameStateSnapshot["phase"], "awaiting_bonus_resolution">,
  message: string,
) {
  const player = requirePlayer(state.players, playerId);

  if (player.sheet.pendingBonuses.length > 0) {
    return withLog(
      {
        ...state,
        phase: "awaiting_bonus_resolution",
        turn: state.turn
          ? {
              ...state.turn,
              pendingBonusResolution: {
                playerId,
                bonuses: player.sheet.pendingBonuses,
                resumePhase
              }
            }
          : null
      },
      `${message} Bonus resolution is now required.`,
    );
  }

  return withLog(state, message);
}

function requirePlayer(players: PlayerSheetSnapshot[], playerId: string) {
  const player = players.find((entry) => entry.playerId === playerId);
  invariant(player, `Player ${playerId} was not found in the current state.`);
  return player;
}

function replacePlayer(
  players: PlayerSheetSnapshot[],
  nextPlayer: PlayerSheetSnapshot,
) {
  return players.map((player) =>
    player.playerId === nextPlayer.playerId ? nextPlayer : player,
  );
}

function withLog(state: GameStateSnapshot, message: string): GameStateSnapshot {
  return {
    ...state,
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        message,
        createdAt: new Date().toISOString()
      }
    ]
  };
}

function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
