import { createBrowserRouter } from "react-router-dom";

import { GamePage } from "../../pages/game/GamePage";
import { HomePage } from "../../pages/home/HomePage";
import { RoomPage } from "../../pages/room/RoomPage";
import { RulesPage } from "../../pages/rules/RulesPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/room/:roomId",
    element: <RoomPage />
  },
  {
    path: "/game/:roomId",
    element: <GamePage />
  },
  {
    path: "/rules",
    element: <RulesPage />
  }
]);
