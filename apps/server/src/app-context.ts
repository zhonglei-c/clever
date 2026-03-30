import { GameService } from "./modules/game/game.service";
import { RoomService } from "./modules/room/room.service";

export interface AppContext {
  gameService: GameService;
  roomService: RoomService;
}

export function createAppContext(): AppContext {
  const roomService = new RoomService();
  const gameService = new GameService();

  return {
    roomService,
    gameService
  };
}
