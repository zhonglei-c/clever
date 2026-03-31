import type { DieId, DieValue, GamePhase } from "./game";
import type { PlayerSummary } from "./player";
import type { RoomSummary } from "./room";

export type PlacementPayload =
  | {
      zone: "yellow";
      cellId?: string;
    }
  | {
      zone: "blue";
      cellId?: string;
    }
  | {
      zone: "green";
    }
  | {
      zone: "orange";
    }
  | {
      zone: "purple";
    };

export interface RoomCreateEvent {
  nickname: string;
  roomName: string;
  maxPlayers: number;
}

export interface RoomJoinEvent {
  roomId: string;
  nickname: string;
  playerId?: string;
}

export interface RoomReadyEvent {
  roomId: string;
  ready: boolean;
}

export interface RoomStartEvent {
  roomId: string;
}

export interface PassivePickEvent {
  roomId: string;
  playerId: string;
  dieId: DieId;
}

export interface PassiveSkipEvent {
  roomId: string;
  playerId: string;
}

export interface SyncStateEvent {
  room: RoomSummary;
  gameState: unknown;
}

export interface GameStateSyncEvent {
  roomId: string;
  phase: GamePhase;
}

export interface GameRollEvent {
  roomId: string;
}

export interface GameActiveSkipEvent {
  roomId: string;
}

export interface GameSelectDieEvent {
  roomId: string;
  dieId: DieId;
  placement: PlacementPayload;
}

export interface GamePassivePickEvent {
  roomId: string;
  dieId: DieId;
  placement: PlacementPayload;
}

export interface GamePassiveSkipEvent {
  roomId: string;
}

export interface GameUseRerollEvent {
  roomId: string;
}

export interface GameUseExtraDieEvent {
  roomId: string;
  dieId: DieId;
  placement: PlacementPayload;
}

export interface GamePassExtraDieEvent {
  roomId: string;
}

export interface GameResolveBonusEvent {
  roomId: string;
  bonusIndex: number;
  placement: PlacementPayload;
}

export interface GameAdvanceTurnEvent {
  roomId: string;
}

export interface RoomJoinedEvent {
  room: RoomSummary;
  player: PlayerSummary;
  gameState: unknown;
}

export interface RoomErrorEvent {
  code: string;
  message: string;
}
