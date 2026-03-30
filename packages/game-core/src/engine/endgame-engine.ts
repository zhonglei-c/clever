export function getTotalRoundsForPlayerCount(playerCount: number) {
  if (playerCount <= 0) {
    return 0;
  }

  if (playerCount <= 2) {
    return 6;
  }

  if (playerCount <= 4) {
    return 5;
  }

  return 4;
}
