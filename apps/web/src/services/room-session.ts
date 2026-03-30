const storageKey = "clever-room-sessions";

export interface StoredRoomSession {
  roomId: string;
  playerId: string;
  nickname: string;
}

function readStorage() {
  if (typeof window === "undefined") {
    return {} as Record<string, StoredRoomSession>;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {} as Record<string, StoredRoomSession>;
  }

  try {
    return JSON.parse(raw) as Record<string, StoredRoomSession>;
  } catch {
    return {} as Record<string, StoredRoomSession>;
  }
}

function writeStorage(value: Record<string, StoredRoomSession>) {
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

export function getStoredRoomSession(roomId: string) {
  return readStorage()[roomId] ?? null;
}

export function saveRoomSession(session: StoredRoomSession) {
  const next = readStorage();
  next[session.roomId] = session;
  writeStorage(next);
}

export function clearRoomSession(roomId: string) {
  const next = readStorage();
  delete next[roomId];
  writeStorage(next);
}

export function getLastNickname() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem("clever-last-nickname") ?? "";
}

export function setLastNickname(nickname: string) {
  window.localStorage.setItem("clever-last-nickname", nickname);
}
