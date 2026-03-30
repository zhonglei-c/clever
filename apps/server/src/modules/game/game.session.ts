import type { GameStateSnapshot } from "@clever/game-core";

export interface GameSession {
  roomId: string;
  startedAt: string;
  state: GameStateSnapshot;
}
