import type { GameStateSnapshot, PlayerSheetSnapshot } from "@clever/game-core";
import type { SelectedIntent } from "../scoreSheetSelection";
import { buildSheetSelection, hasAnyLegalTarget } from "../scoreSheetSelection";

export function isDieChoicePlayable(
  intent: SelectedIntent,
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  return hasAnyLegalTarget(buildSheetSelection(intent, gameState, player));
}

export function getPassiveRegularSource(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  const silverPlatter = gameState.turn?.silverPlatter ?? [];
  return silverPlatter.some((die) => isDieChoicePlayable({ kind: "passive", die }, gameState, player))
    ? "silver"
    : "active-fields";
}

export function getPassiveRegularDice(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  return getPassiveRegularSource(gameState, player) === "silver"
    ? (gameState.turn?.silverPlatter ?? [])
    : (gameState.turn?.activeSelections ?? []);
}

export function canUseExtraDieAction(
  gameState: GameStateSnapshot,
  currentPlayerId: string | null,
  player: PlayerSheetSnapshot,
  passiveStatus: "pending" | "picked" | "skipped" | null,
) {
  if (!currentPlayerId || player.sheet.resources.extraDice <= 0) {
    return false;
  }

  if (!(gameState.phase === "awaiting_passive_picks" || gameState.phase === "awaiting_turn_end")) {
    return false;
  }

  if (gameState.currentPlayerId !== currentPlayerId && passiveStatus === "pending") {
    return false;
  }

  if (gameState.turn?.extraDicePassedByPlayer[currentPlayerId]) {
    return false;
  }

  return getExtraDieCandidates(gameState, player, currentPlayerId).length > 0;
}

export function getExtraDieCandidates(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
  currentPlayerId: string,
) {
  const turn = gameState.turn;
  if (!turn) {
    return [];
  }

  const usedDieIds = new Set(turn.extraDiceUsedByPlayer[currentPlayerId] ?? []);
  return [...turn.activeSelections, ...turn.silverPlatter].filter(
    (die) =>
      !usedDieIds.has(die.id) &&
      isDieChoicePlayable({ kind: "extra", die, playerRole: "active" }, gameState, player),
  );
}

export function areTurnEndActionsComplete(gameState: GameStateSnapshot) {
  if (!gameState.turn) {
    return true;
  }

  return gameState.players.every((player) => !hasAvailableExtraDieOption(gameState, player));
}

export function hasAvailableExtraDieOption(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  const turn = gameState.turn;
  if (!turn || player.sheet.resources.extraDice <= 0) {
    return false;
  }

  if (!(gameState.phase === "awaiting_passive_picks" || gameState.phase === "awaiting_turn_end")) {
    return false;
  }

  if (turn.extraDicePassedByPlayer[player.playerId]) {
    return false;
  }

  if (player.playerId !== turn.activePlayerId) {
    const passiveSelection = turn.passiveSelections.find((selection) => selection.playerId === player.playerId);
    if (!passiveSelection || passiveSelection.status === "pending") {
      return false;
    }
  }

  return getExtraDieCandidates(gameState, player, player.playerId).length > 0;
}
