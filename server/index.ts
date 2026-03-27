import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { CleverRoom } from "./rooms/CleverRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// 注册游戏房间
gameServer.define("clever", CleverRoom);

gameServer.listen(port);
console.log(`[Clever Server] Listening on ws://localhost:${port}`);
