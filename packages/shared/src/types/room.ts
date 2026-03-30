import type { PlayerSummary } from "./player";

export interface RoomSummary {
  id: string;
  name: string;
  maxPlayers: number;
  status: "lobby" | "in_game" | "finished";
  ownerPlayerId: string | null;
  players: PlayerSummary[];
}

export interface RoomSnapshot {
  room: RoomSummary;
  gameState: unknown;
}
