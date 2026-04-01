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
  gainPlayerResource,
  resolvePendingBonus,
  spendTrackedPlayerResource,
  type PendingSheetBonus,
  type SheetPlacement
} from "../rules/player-sheet";

export const MAX_ACTIVE_SELECTIONS = 3;

const ROUND_START_AUTO_BONUSES: Partial<Record<number, Array<"reroll" | "extra-die">>> = {
  1: ["reroll"],
  2: ["extra-die"],
  3: ["reroll"]
};
const ROUND_FOUR_CHOICE_BONUSES: PendingSheetBonus[] = [
  {
    type: "wild-mark",
    source: "round-4-black-x"
  },
  {
    type: "number-mark",
    value: 6,
    allowedZones: ["orange", "purple"],
    source: "round-4-black-6"
  }
];

export type GameAction =
  | {
      type: "active-roll";
      dice: DieValue[];
    }
  | {
      type: "active-skip";
      playerId: string;
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
      type: "use-reroll";
      playerId: string;
    }
  | {
      type: "extra-die-pick";
      playerId: string;
      dieId: DieId;
      placement: SheetPlacement;
    }
  | {
      type: "pass-extra-die";
      playerId: string;
    }
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

  const baseState: GameStateSnapshot = {
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

  return currentPlayerId ? applyRoundStartEffects(baseState) : baseState;
}

export function applyGameAction(
  state: GameStateSnapshot,
  action: GameAction,
): GameStateSnapshot {
  switch (action.type) {
    case "active-roll":
      return rollActiveDice(state, action.dice);
    case "active-skip":
      return skipActiveSelection(state, action.playerId);
    case "active-select":
      return selectActiveDie(state, action.dieId, action.placement);
    case "passive-pick":
      return pickPassiveDie(state, action.playerId, action.dieId, action.placement);
    case "passive-skip":
      return skipPassiveDie(state, action.playerId);
    case "resolve-bonus":
      return resolvePlayerBonus(state, action);
    case "use-reroll":
      return useReroll(state, action.playerId);
    case "extra-die-pick":
      return pickExtraDie(state, action.playerId, action.dieId, action.placement);
    case "pass-extra-die":
      return passExtraDie(state, action.playerId);
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
  const placementResult = applyPlacementToSheet(
    activePlayer.sheet,
    placement,
    {
      die: selectedDie,
      currentDiceValues: turn.currentDiceValues
    },
  );
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

export function skipActiveSelection(
  state: GameStateSnapshot,
  playerId: string,
): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_active_selection");

  invariant(turn.activePlayerId === playerId, "Only the active player can skip an active pick.");

  const activePlayer = requirePlayer(state.players, playerId);
  invariant(
    !hasAnyLegalPlacementForRolledDice(turn, activePlayer),
    "Active roll can only be passed when every rolled die is currently illegal.",
  );

  const isFinalRoll = turn.pickNumber >= MAX_ACTIVE_SELECTIONS;

  if (!isFinalRoll) {
    return withLog(
      {
        ...state,
        phase: "awaiting_active_roll",
        turn: {
          ...turn,
          pickNumber: (turn.pickNumber + 1) as 1 | 2 | 3,
          rolledDice: []
        }
      },
      `Active player ${playerId} could not mark any die from roll ${turn.pickNumber}, so that roll was spent without a placement.`,
    );
  }

  const nextPhase = hasPendingPassiveSelections(turn)
    ? "awaiting_passive_picks"
    : "awaiting_turn_end";

  return withLog(
    {
      ...state,
      phase: nextPhase,
      turn: {
        ...turn,
        availableDiceIds: [],
        rolledDice: [],
        silverPlatter: [...turn.silverPlatter, ...turn.rolledDice]
      }
    },
    `Active player ${playerId} could not mark any die on the final roll, so the turn ended without a placement from that roll.`,
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

  const passivePlayer = requirePlayer(state.players, playerId);
  const candidateDice = getPassiveRegularDicePool(turn, passivePlayer);
  const chosenDie = candidateDice.find((die) => die.id === dieId);
  invariant(
    chosenDie,
    candidateDice === turn.silverPlatter
      ? `Die ${dieId} is not available on the silver platter.`
      : `Die ${dieId} is not available on the active player's die fields.`,
  );
  const placementResult = applyPlacementToSheet(
    passivePlayer.sheet,
    placement,
    {
      die: chosenDie,
      currentDiceValues: turn.currentDiceValues
    },
  );
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
    `Passive player ${playerId} selected ${chosenDie.id}=${chosenDie.value} from ${
      candidateDice === turn.silverPlatter ? "the silver platter" : "the active player's die fields"
    } and filled ${placement.zone}.`,
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
  const passivePlayer = requirePlayer(state.players, playerId);
  invariant(
    !hasAnyLegalPlacementForDice(turn.silverPlatter, passivePlayer) &&
      !hasAnyLegalPlacementForDice(turn.activeSelections, passivePlayer),
    "Passive pick can only be skipped when neither the silver platter nor the active player's die fields contain a legal die.",
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

export function useReroll(
  state: GameStateSnapshot,
  playerId: string,
): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_active_selection");

  invariant(turn.activePlayerId === playerId, "Only the active player can use a reroll resource.");

  const activePlayer = requirePlayer(state.players, playerId);
  const updatedPlayer = {
    ...activePlayer,
    sheet: maybeConsumePlayerResource(activePlayer.sheet, "rerolls", true)
  };

  return withLog(
    {
      ...state,
      phase: "awaiting_active_roll",
      players: replacePlayer(state.players, updatedPlayer),
      turn: {
        ...turn,
        rolledDice: []
      }
    },
    `Active player ${playerId} spent one reroll resource and may reroll the current dice set.`,
  );
}

export function pickExtraDie(
  state: GameStateSnapshot,
  playerId: string,
  dieId: DieId,
  placement: SheetPlacement,
): GameStateSnapshot {
  invariant(
    state.phase === "awaiting_passive_picks" || state.phase === "awaiting_turn_end",
    `Expected an end-of-turn phase for extra-die usage, received ${state.phase}.`,
  );
  invariant(state.turn, "Expected an active turn state.");
  const turn = state.turn;

  invariant(
    canPlayerUseExtraDieAction(state, playerId),
    "This player cannot use an extra-die action right now.",
  );

  const player = requirePlayer(state.players, playerId);
  const chosenDie = getAllTurnDice(turn).find((die) => die.id === dieId);
  invariant(chosenDie, `Die ${dieId} is not available this turn for an extra-die action.`);

  const usedDieIds = turn.extraDiceUsedByPlayer[playerId] ?? [];
  invariant(
    !usedDieIds.includes(dieId),
    `Die ${dieId} has already been chosen with an extra-die action this turn.`,
  );

  const placementResult = applyPlacementToSheet(
    maybeConsumePlayerResource(player.sheet, "extraDice", true),
    placement,
    {
      die: chosenDie,
      currentDiceValues: turn.currentDiceValues
    },
  );
  const players = replacePlayer(state.players, {
    ...player,
    sheet: enqueueSheetBonuses(
      placementResult.sheet,
      placementResult.triggeredBonuses,
    )
  });

  return finalizeAfterPlacement(
    {
      ...state,
      players,
      turn: {
        ...turn,
        extraDicePassedByPlayer: {
          ...turn.extraDicePassedByPlayer,
          [playerId]: false
        },
        extraDiceUsedByPlayer: {
          ...turn.extraDiceUsedByPlayer,
          [playerId]: [...usedDieIds, dieId]
        }
      }
    },
    playerId,
    state.phase,
    `Player ${playerId} spent one extra-die action on ${chosenDie.id}=${chosenDie.value} and filled ${placement.zone}.`,
  );
}

export function passExtraDie(
  state: GameStateSnapshot,
  playerId: string,
): GameStateSnapshot {
  invariant(
    hasAvailableExtraDieAction(state, playerId),
    "This player has no available extra-die action to pass.",
  );
  invariant(state.turn, "Expected an active turn state.");

  return withLog(
    {
      ...state,
      turn: {
        ...state.turn,
        extraDicePassedByPlayer: {
          ...state.turn.extraDicePassedByPlayer,
          [playerId]: true
        }
      }
    },
    `Player ${playerId} declined to use any more extra-die actions this turn.`,
  );
}

export function advanceTurn(state: GameStateSnapshot): GameStateSnapshot {
  const turn = requireTurnPhase(state, "awaiting_turn_end");
  invariant(
    areAllPlayersDoneWithTurnEndActions(state),
    "Turn cannot advance while a player can still use or pass an extra-die action.",
  );
  const nextActivePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  const nextActivePlayerId = state.players[nextActivePlayerIndex]?.playerId ?? null;

  invariant(nextActivePlayerId, "Cannot advance turn without at least one player.");

  if (nextActivePlayerIndex === 0 && state.round >= state.totalRounds) {
    const expiredPlayers = expireEndgameActions(resetPlayerTurnState(state.players));
    const scoredPlayers = scorePlayers(expiredPlayers);

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
    applyRoundStartEffects({
      ...state,
      phase: "awaiting_active_roll",
      round: nextRound,
      activePlayerIndex: nextActivePlayerIndex,
      currentPlayerId: nextActivePlayerId,
      players: resetPlayerTurnState(state.players),
      turn: createTurnState(nextActivePlayerId, passivePlayerIds)
    }),
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
  const pendingResolution = turn.pendingBonusResolution!;
  const player = requirePlayer(state.players, action.playerId);
  const resolution = resolvePendingBonus(player.sheet, action.bonusIndex, action.placement);
  const sheetAfterCurrentBonus =
    pendingResolution.mode === "choice"
      ? {
          ...resolution.sheet,
          pendingBonuses: []
        }
      : resolution.sheet;
  const updatedPlayer = {
    ...player,
    sheet: enqueueSheetBonuses(sheetAfterCurrentBonus, resolution.triggeredBonuses)
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
            ...pendingResolution,
            bonuses: updatedPlayer.sheet.pendingBonuses
          }
        }
      },
      `Player ${action.playerId} resolved one bonus and still has pending bonus steps.`,
    );
  }

  if (pendingResolution.roundStartChoiceState?.remainingPlayerIds.length) {
    const nextChoiceState = {
      ...state,
      players
    };

    return withLog(
      startRoundFourChoiceResolution(
        nextChoiceState,
        pendingResolution.roundStartChoiceState.remainingPlayerIds,
        pendingResolution.resumePhase,
        pendingResolution.roundStartChoiceState.choiceBonuses,
      ),
      `Player ${action.playerId} resolved their round-start bonus. The next player must now choose a round-start bonus.`,
    );
  }

  return withLog(
    {
      ...state,
      phase: pendingResolution.resumePhase,
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
  const playerIds = [activePlayerId, ...passivePlayerIds];

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
    extraDiceUsedByPlayer: Object.fromEntries(playerIds.map((playerId) => [playerId, []])),
    extraDicePassedByPlayer: Object.fromEntries(playerIds.map((playerId) => [playerId, false])),
    pendingBonusResolution: null
  };
}

function applyRoundStartEffects(state: GameStateSnapshot): GameStateSnapshot {
  const autoBonuses = ROUND_START_AUTO_BONUSES[state.round] ?? [];
  let players = state.players;

  for (const bonus of autoBonuses) {
    players = players.map((player) => grantRoundStartAction(player, bonus));
  }

  if (state.round === 4 && state.turn) {
    return startRoundFourChoiceResolution(
      {
        ...state,
        players
      },
      state.players.map((player) => player.playerId),
      "awaiting_active_roll",
    );
  }

  return {
    ...state,
    players
  };
}

function startRoundFourChoiceResolution(
  state: GameStateSnapshot,
  playerIds: string[],
  resumePhase: Exclude<GameStateSnapshot["phase"], "awaiting_bonus_resolution">,
  choiceBonuses: PendingSheetBonus[] = ROUND_FOUR_CHOICE_BONUSES,
): GameStateSnapshot {
  const [nextPlayerId, ...remainingPlayerIds] = playerIds;

  invariant(nextPlayerId, "Expected at least one player for round-start bonus resolution.");
  invariant(state.turn, "Expected an active turn while resolving round-start bonuses.");

  const player = requirePlayer(state.players, nextPlayerId);
  const updatedPlayer = {
    ...player,
    sheet: enqueueSheetBonuses(
      {
        ...player.sheet,
        pendingBonuses: []
      },
      choiceBonuses,
    )
  };

  return {
    ...state,
    phase: "awaiting_bonus_resolution",
    players: replacePlayer(state.players, updatedPlayer),
    turn: {
      ...state.turn,
      pendingBonusResolution: {
        playerId: nextPlayerId,
        bonuses: updatedPlayer.sheet.pendingBonuses,
        resumePhase,
        mode: "choice",
        roundStartChoiceState: {
          remainingPlayerIds,
          choiceBonuses
        }
      }
    }
  };
}

function grantRoundStartAction(
  player: PlayerSheetSnapshot,
  bonus: "reroll" | "extra-die",
): PlayerSheetSnapshot {
  return {
    ...player,
    sheet: gainPlayerResource(
      player.sheet,
      bonus === "reroll" ? "rerolls" : "extraDice",
    )
  };
}

function expireEndgameActions(players: PlayerSheetSnapshot[]) {
  return players.map((player) => ({
    ...player,
    sheet:
      player.sheet.resources.rerolls > 0
        ? spendTrackedPlayerResource(player.sheet, "rerolls", player.sheet.resources.rerolls)
        : player.sheet
  }));
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

function maybeConsumePlayerResource(
  sheet: PlayerSheetSnapshot["sheet"],
  resourceKey: "extraDice" | "rerolls",
  shouldConsume: boolean,
) {
  if (!shouldConsume) {
    return sheet;
  }

  return spendTrackedPlayerResource(sheet, resourceKey);
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

function hasAnyLegalPlacementForRolledDice(
  turn: TurnStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  return hasAnyLegalPlacementForDice(turn.rolledDice, player, turn.currentDiceValues);
}

function hasAnyLegalPlacementForDice(
  dice: DieValue[],
  player: PlayerSheetSnapshot,
  currentDiceValues: TurnStateSnapshot["currentDiceValues"] = {},
) {
  return dice.some((die) => hasAnyLegalPlacementForDie(die, player, currentDiceValues));
}

function hasAnyLegalPlacementForDie(
  die: DieValue,
  player: PlayerSheetSnapshot,
  currentDiceValues: TurnStateSnapshot["currentDiceValues"],
) {
  const placements =
    die.id === "white"
      ? ([
          { zone: "yellow" },
          { zone: "blue" },
          { zone: "green" },
          { zone: "orange" },
          { zone: "purple" }
        ] satisfies SheetPlacement[])
      : ([{ zone: die.id }] satisfies SheetPlacement[]);

  return placements.some((placement) => {
    try {
      applyPlacementToSheet(player.sheet, placement, {
        die,
        currentDiceValues
      });
      return true;
    } catch {
      return false;
    }
  });
}

function getPassiveRegularDicePool(
  turn: TurnStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  return hasAnyLegalPlacementForDice(turn.silverPlatter, player, turn.currentDiceValues)
    ? turn.silverPlatter
    : turn.activeSelections;
}

function getAllTurnDice(turn: TurnStateSnapshot) {
  return [...turn.activeSelections, ...turn.silverPlatter];
}

function hasAvailableExtraDieAction(
  state: GameStateSnapshot,
  playerId: string,
) {
  if (!(state.phase === "awaiting_passive_picks" || state.phase === "awaiting_turn_end")) {
    return false;
  }

  const turn = state.turn;
  if (!turn) {
    return false;
  }

  const player = state.players.find((entry) => entry.playerId === playerId);
  if (!player || player.sheet.resources.extraDice <= 0) {
    return false;
  }

  if (playerId !== turn.activePlayerId) {
    const passiveSelection = turn.passiveSelections.find((selection) => selection.playerId === playerId);
    if (!passiveSelection || passiveSelection.status === "pending") {
      return false;
    }
  }

  const usedDieIds = turn.extraDiceUsedByPlayer[playerId] ?? [];
  return getAllTurnDice(turn).some(
    (die) =>
      !usedDieIds.includes(die.id) &&
      hasAnyLegalPlacementForDie(die, player, turn.currentDiceValues),
  );
}

function canPlayerUseExtraDieAction(
  state: GameStateSnapshot,
  playerId: string,
) {
  const turn = state.turn;
  if (!turn) {
    return false;
  }

  return !turn.extraDicePassedByPlayer[playerId] && hasAvailableExtraDieAction(state, playerId);
}

function isPlayerDoneWithTurnEndActions(
  state: GameStateSnapshot,
  playerId: string,
) {
  return !hasAvailableExtraDieAction(state, playerId) || Boolean(state.turn?.extraDicePassedByPlayer[playerId]);
}

function areAllPlayersDoneWithTurnEndActions(state: GameStateSnapshot) {
  return state.players.every((player) => isPlayerDoneWithTurnEndActions(state, player.playerId));
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
