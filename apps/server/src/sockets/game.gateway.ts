export interface GameGatewayContext {
  roomId: string;
  sessionId: string;
}

export function createGameGatewayContext(
  roomId: string,
  sessionId: string,
): GameGatewayContext {
  return {
    roomId,
    sessionId
  };
}
