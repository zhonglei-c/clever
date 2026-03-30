import Fastify from "fastify";

import { createAppContext } from "./app-context";
import { registerHealthRoutes } from "./routes/health";
import { registerRoomRoutes } from "./routes/room";
import { registerRealtime } from "./sockets/register-realtime";

export function buildApp() {
  const app = Fastify({
    logger: true
  });
  const context = createAppContext();

  registerHealthRoutes(app);
  registerRoomRoutes(app, context);
  registerRealtime(app.server, context, app.log);

  return app;
}
