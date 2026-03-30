import { io, type Socket } from "socket.io-client";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";

let socket: Socket | null = null;

export function getRealtimeSocket() {
  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: false
    });
  }

  return socket;
}

export function ensureRealtimeConnection() {
  const instance = getRealtimeSocket();
  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}
