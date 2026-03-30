import type { PlayerConnection } from "../player/player.types";

export class PresenceService {
  private readonly players = new Map<string, PlayerConnection>();

  upsert(player: PlayerConnection) {
    this.players.set(player.playerId, player);
    return player;
  }
}
