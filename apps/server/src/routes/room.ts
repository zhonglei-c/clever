import type { FastifyInstance } from "fastify";

import type { AppContext } from "../app-context";

export function registerRoomRoutes(app: FastifyInstance, context: AppContext) {
  app.get("/rooms/:roomId", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const room = context.roomService.getRoom(roomId);

    if (!room) {
      return reply.code(404).send({
        message: `Room ${roomId} was not found.`
      });
    }

    return {
      room,
      gameState: context.gameService.get(roomId)?.state ?? null
    };
  });
}
