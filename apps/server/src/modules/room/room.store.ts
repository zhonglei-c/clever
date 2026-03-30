import type { RoomRecord } from "./room.types";

export class RoomStore {
  private readonly rooms = new Map<string, RoomRecord>();

  list() {
    return [...this.rooms.values()];
  }

  get(roomId: string) {
    return this.rooms.get(roomId) ?? null;
  }

  set(room: RoomRecord) {
    this.rooms.set(room.id, room);
    return room;
  }
}
