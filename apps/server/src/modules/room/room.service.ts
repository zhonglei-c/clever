import { randomUUID } from "node:crypto";

import {
  ROOM_CODE_LENGTH,
  ROOM_MAX_PLAYERS,
  type RoomSummary
} from "@clever/shared";

import { RoomStore } from "./room.store";
import type {
  CreateRoomParams,
  JoinRoomParams,
  RoomMembership,
  RoomPlayerRecord,
  RoomRecord
} from "./room.types";

export class RoomService {
  constructor(private readonly store = new RoomStore()) {}

  create(params: CreateRoomParams): RoomMembership {
    const now = new Date().toISOString();
    const owner: RoomPlayerRecord = {
      id: randomUUID(),
      nickname: params.nickname,
      seatIndex: 0,
      connected: true,
      ready: params.maxPlayers === 1,
      socketId: params.socketId
    };
    const room: RoomRecord = {
      id: this.generateRoomId(),
      name: params.roomName,
      maxPlayers: params.maxPlayers,
      status: "lobby",
      ownerPlayerId: owner.id,
      players: [owner],
      createdAt: now,
      updatedAt: now
    };

    this.store.set(room);

    return {
      room,
      player: owner
    };
  }

  join(params: JoinRoomParams): RoomMembership {
    const room = this.requireRoom(params.roomId);
    const reconnectingPlayer =
      params.playerId
        ? room.players.find((player) => player.id === params.playerId) ?? null
        : null;

    if (reconnectingPlayer) {
      const updatedPlayer: RoomPlayerRecord = {
        ...reconnectingPlayer,
        nickname: params.nickname,
        connected: true,
        socketId: params.socketId
      };
      const updatedRoom = this.replacePlayer(room, updatedPlayer);

      return {
        room: updatedRoom,
        player: updatedPlayer
      };
    }

    if (room.status !== "lobby") {
      throw new Error("Cannot join a room after the game has started.");
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("The room is already full.");
    }

    const nextPlayer: RoomPlayerRecord = {
      id: randomUUID(),
      nickname: params.nickname,
      seatIndex: room.players.length,
      connected: true,
      ready: false,
      socketId: params.socketId
    };
    const updatedRoom: RoomRecord = {
      ...room,
      players: [...room.players, nextPlayer],
      updatedAt: new Date().toISOString()
    };

    this.store.set(updatedRoom);

    return {
      room: updatedRoom,
      player: nextPlayer
    };
  }

  setReady(roomId: string, playerId: string, ready: boolean) {
    const room = this.requireRoom(roomId);
    const player = this.requirePlayer(room, playerId);
    const updatedRoom = this.replacePlayer(room, {
      ...player,
      ready
    });

    return updatedRoom;
  }

  markStarted(roomId: string, playerId: string) {
    const room = this.requireRoom(roomId);
    const owner = this.requirePlayer(room, playerId);

    if (room.ownerPlayerId !== owner.id) {
      throw new Error("Only the room owner can start the game.");
    }

    if (room.players.length === 0 || room.players.length > ROOM_MAX_PLAYERS) {
      throw new Error("The room player count is invalid.");
    }

    if (!room.players.every((player) => player.ready)) {
      throw new Error("All players must be ready before starting.");
    }

    const startedRoom: RoomRecord = {
      ...room,
      status: "in_game",
      updatedAt: new Date().toISOString()
    };

    this.store.set(startedRoom);

    return startedRoom;
  }

  markFinished(roomId: string) {
    const room = this.requireRoom(roomId);
    const finishedRoom: RoomRecord = {
      ...room,
      status: "finished",
      updatedAt: new Date().toISOString()
    };

    this.store.set(finishedRoom);

    return finishedRoom;
  }

  getRoom(roomId: string): RoomSummary | null {
    const room = this.store.get(roomId);
    return room ? this.toSummary(room) : null;
  }

  getRecord(roomId: string) {
    return this.store.get(roomId);
  }

  findMembershipBySocket(roomId: string, socketId: string): RoomMembership | null {
    const room = this.store.get(roomId);

    if (!room) {
      return null;
    }

    const player = room.players.find((entry) => entry.socketId === socketId) ?? null;
    if (!player) {
      return null;
    }

    return {
      room,
      player
    };
  }

  markDisconnected(socketId: string) {
    const changedRoomIds: string[] = [];

    for (const room of this.store.list()) {
      const player = room.players.find((entry) => entry.socketId === socketId);
      if (!player) {
        continue;
      }

      this.replacePlayer(room, {
        ...player,
        connected: false,
        socketId: null
      });
      changedRoomIds.push(room.id);
    }

    return changedRoomIds;
  }

  toSummary(room: RoomRecord): RoomSummary {
    return {
      id: room.id,
      name: room.name,
      maxPlayers: room.maxPlayers,
      status: room.status,
      ownerPlayerId: room.ownerPlayerId,
      players: room.players.map(({ socketId: _, ...player }) => player)
    };
  }

  private requireRoom(roomId: string) {
    const room = this.store.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} was not found.`);
    }
    return room;
  }

  private requirePlayer(room: RoomRecord, playerId: string) {
    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} was not found in room ${room.id}.`);
    }
    return player;
  }

  private replacePlayer(room: RoomRecord, player: RoomPlayerRecord) {
    const updatedRoom: RoomRecord = {
      ...room,
      players: room.players.map((entry) => (entry.id === player.id ? player : entry)),
      updatedAt: new Date().toISOString()
    };

    this.store.set(updatedRoom);

    return updatedRoom;
  }

  private generateRoomId() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomId = "";

    do {
      roomId = Array.from({ length: ROOM_CODE_LENGTH }, () =>
        alphabet[Math.floor(Math.random() * alphabet.length)],
      ).join("");
    } while (this.store.get(roomId));

    return roomId;
  }
}
