export interface RoomGatewayContext {
  roomId: string;
}

export function createRoomGatewayContext(roomId: string): RoomGatewayContext {
  return { roomId };
}
