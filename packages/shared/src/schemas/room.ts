import { z } from "zod";

import { ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS } from "../constants/room";

export const createRoomSchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  roomName: z.string().trim().min(1).max(40),
  maxPlayers: z.number().int().min(ROOM_MIN_PLAYERS).max(ROOM_MAX_PLAYERS)
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
