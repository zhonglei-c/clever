import type { FastifyBaseLogger } from "fastify";
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";

import type {
  GameStateSnapshot,
  SheetPlacement
} from "@clever/game-core";
import {
    createRoomSchema,
    type CreateRoomInput,
    type GameActiveSkipEvent,
    type GameAdvanceTurnEvent,
    type GamePassExtraDieEvent,
    type GamePassivePickEvent,
    type GamePassiveSkipEvent,
    type GameResolveBonusEvent,
    type GameRollEvent,
    type GameSelectDieEvent,
    type GameUseExtraDieEvent,
    type GameUseRerollEvent,
  type RoomCreateEvent,
  type RoomErrorEvent,
  type RoomJoinEvent,
  type RoomJoinedEvent,
  type RoomReadyEvent,
  type RoomStartEvent,
  type SyncStateEvent
} from "@clever/shared";

import type { AppContext } from "../app-context";

export function registerRealtime(
  server: HttpServer,
  context: AppContext,
  logger: FastifyBaseLogger,
) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:create", (payload: RoomCreateEvent) => {
      try {
        const parsed = createRoomSchema.parse(payload) as CreateRoomInput;
        const membership = context.roomService.create({
          roomName: parsed.roomName,
          maxPlayers: parsed.maxPlayers,
          nickname: parsed.nickname,
          socketId: socket.id
        });

        socket.join(membership.room.id);
        socket.emit("room:joined", createRoomJoinedPayload(context, membership.room.id, membership.player.id));
        emitRoomState(io, context, membership.room.id);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("room:join", (payload: RoomJoinEvent) => {
      try {
        const membership = context.roomService.join({
          roomId: payload.roomId,
          nickname: payload.nickname,
          socketId: socket.id,
          playerId: payload.playerId
        });

        socket.join(membership.room.id);
        socket.emit("room:joined", createRoomJoinedPayload(context, membership.room.id, membership.player.id));
        emitRoomState(io, context, membership.room.id);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("room:ready", (payload: RoomReadyEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        context.roomService.setReady(payload.roomId, membership.player.id, payload.ready);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:start", (payload: RoomStartEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const room = context.roomService.markStarted(payload.roomId, membership.player.id);
        context.gameService.create(room.id, room.players.map((player) => player.id));
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:roll", (payload: GameRollEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const session = requireSession(context, payload.roomId);
        if (session.state.currentPlayerId !== membership.player.id) {
          throw new Error("Only the active player can roll the dice.");
        }

        const next = context.gameService.roll(payload.roomId);
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:select-die", (payload: GameSelectDieEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const session = requireSession(context, payload.roomId);
        if (session.state.currentPlayerId !== membership.player.id) {
          throw new Error("Only the active player can select a die.");
        }

        const next = context.gameService.applyAction(payload.roomId, {
          type: "active-select",
          dieId: payload.dieId,
          placement: payload.placement as SheetPlacement
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:active-skip", (payload: GameActiveSkipEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "active-skip",
          playerId: membership.player.id
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:passive-pick", (payload: GamePassivePickEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "passive-pick",
          playerId: membership.player.id,
          dieId: payload.dieId,
          placement: payload.placement as SheetPlacement
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:passive-skip", (payload: GamePassiveSkipEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "passive-skip",
          playerId: membership.player.id
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:resolve-bonus", (payload: GameResolveBonusEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "resolve-bonus",
          playerId: membership.player.id,
          bonusIndex: payload.bonusIndex,
          placement: payload.placement as SheetPlacement
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:advance-turn", (payload: GameAdvanceTurnEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const session = requireSession(context, payload.roomId);
        if (session.state.currentPlayerId && session.state.currentPlayerId !== membership.player.id) {
          throw new Error("Only the active player can advance the turn.");
        }

        const next = context.gameService.applyAction(payload.roomId, {
          type: "advance-turn"
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:use-reroll", (payload: GameUseRerollEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "use-reroll",
          playerId: membership.player.id
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:use-extra-die", (payload: GameUseExtraDieEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "extra-die-pick",
          playerId: membership.player.id,
          dieId: payload.dieId,
          placement: payload.placement as SheetPlacement
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("game:pass-extra-die", (payload: GamePassExtraDieEvent) => {
      try {
        const membership = requireMembership(context, payload.roomId, socket);
        const next = context.gameService.applyAction(payload.roomId, {
          type: "pass-extra-die",
          playerId: membership.player.id
        });
        syncFinishedStateIfNeeded(context, next.state);
        emitRoomState(io, context, payload.roomId);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on("disconnect", () => {
      const changedRooms = context.roomService.markDisconnected(socket.id);
      for (const roomId of changedRooms) {
        emitRoomState(io, context, roomId);
      }
      logger.info({ socketId: socket.id }, "socket disconnected");
    });
  });
}

function emitRoomState(
  io: SocketIOServer,
  context: AppContext,
  roomId: string,
) {
  const room = context.roomService.getRoom(roomId);
  if (!room) {
    return;
  }

  const payload: SyncStateEvent = {
    room,
    gameState: context.gameService.get(roomId)?.state ?? null
  };

  io.to(roomId).emit("state:sync", payload);
}

function createRoomJoinedPayload(
  context: AppContext,
  roomId: string,
  playerId: string,
): RoomJoinedEvent {
  const room = context.roomService.getRecord(roomId);
  if (!room) {
    throw new Error(`Room ${roomId} was not found.`);
  }

  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} was not found in room ${roomId}.`);
  }

  return {
    room: context.roomService.toSummary(room),
    player: {
      id: player.id,
      nickname: player.nickname,
      seatIndex: player.seatIndex,
      connected: player.connected,
      ready: player.ready
    },
    gameState: context.gameService.get(roomId)?.state ?? null
  };
}

function requireMembership(
  context: AppContext,
  roomId: string,
  socket: Socket,
) {
  const membership = context.roomService.findMembershipBySocket(roomId, socket.id);
  if (!membership) {
    throw new Error("Socket is not joined to the requested room.");
  }
  return membership;
}

function requireSession(context: AppContext, roomId: string) {
  const session = context.gameService.get(roomId);
  if (!session) {
    throw new Error(`Game session for room ${roomId} was not found.`);
  }
  return session;
}

function emitSocketError(socket: Socket, error: unknown) {
  const payload: RoomErrorEvent = {
    code: "ROOM_ERROR",
    message: error instanceof Error ? error.message : "Unknown room error."
  };

  socket.emit("room:error", payload);
}

function syncFinishedStateIfNeeded(context: AppContext, state: GameStateSnapshot) {
  if (state.phase === "finished") {
    context.roomService.markFinished(state.roomId);
  }
}
