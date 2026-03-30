import {
  applyGameAction,
  createInitialGameState,
  type GameAction
} from "@clever/game-core";
import type { DieValue } from "@clever/shared";

import type { GameSession } from "./game.session";

export class GameService {
  private readonly sessions = new Map<string, GameSession>();

  create(roomId: string, playerIds: string[]) {
    const state = createInitialGameState({
      roomId,
      playerIds
    });
    const session: GameSession = {
      roomId,
      startedAt: new Date().toISOString(),
      state
    };

    this.sessions.set(roomId, session);

    return session;
  }

  get(roomId: string) {
    return this.sessions.get(roomId) ?? null;
  }

  applyAction(roomId: string, action: GameAction) {
    const session = this.get(roomId);

    if (!session) {
      throw new Error(`Game session for room ${roomId} was not found.`);
    }

    const nextState = applyGameAction(session.state, action);
    const nextSession: GameSession = {
      ...session,
      state: nextState
    };

    this.sessions.set(roomId, nextSession);

    return nextSession;
  }

  roll(roomId: string) {
    const session = this.get(roomId);

    if (!session) {
      throw new Error(`Game session for room ${roomId} was not found.`);
    }

    const availableDiceIds = session.state.turn?.availableDiceIds ?? [];
    const dice: DieValue[] = availableDiceIds.map((dieId) => ({
      id: dieId,
      color: dieId,
      value: Math.floor(Math.random() * 6) + 1
    }));

    return this.applyAction(roomId, {
      type: "active-roll",
      dice
    });
  }
}
