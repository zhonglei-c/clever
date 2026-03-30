import type { GameStateSnapshot } from "@clever/game-core";

export function serializeGameState(state: GameStateSnapshot) {
  return JSON.stringify(state);
}
