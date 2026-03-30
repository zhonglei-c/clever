import type { PlayerSummary, RoomSummary } from "@clever/shared";

export interface RoomPlayerRecord extends PlayerSummary {
  socketId: string | null;
}

export interface RoomRecord extends Omit<RoomSummary, "players"> {
  players: RoomPlayerRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomParams {
  roomName: string;
  maxPlayers: number;
  nickname: string;
  socketId: string;
}

export interface JoinRoomParams {
  roomId: string;
  nickname: string;
  socketId: string;
  playerId?: string;
}

export interface RoomMembership {
  room: RoomRecord;
  player: RoomPlayerRecord;
}
