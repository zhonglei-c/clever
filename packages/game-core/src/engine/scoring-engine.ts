import type { FinalStanding, PlayerScoreBreakdown, PlayerSheetSnapshot } from "../model/game-state";
import type { PlayerSheetState } from "../rules/player-sheet";

const BLUE_SCORE_TRACK = [0, 1, 2, 4, 7, 11, 16, 22, 29, 37, 46, 56] as const;
const GREEN_SCORE_TRACK = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66] as const;
const YELLOW_COLUMN_SCORES = [10, 14, 16, 20] as const;
const YELLOW_COLUMNS = [
  ["y-r1c1", "y-r2c1", "y-r3c1"],
  ["y-r1c2", "y-r2c2", "y-r3c2"],
  ["y-r1c3", "y-r2c3", "y-r3c3"],
  ["y-r1c4", "y-r2c4", "y-r3c4"]
] as const;

export function scorePlayerSheet(sheet: PlayerSheetState): PlayerScoreBreakdown {
  const yellow = scoreYellow(sheet);
  const blue = BLUE_SCORE_TRACK[sheet.blue.markedSums.length] ?? 0;
  const green = GREEN_SCORE_TRACK[sheet.green.filledThresholds.length] ?? 0;
  const orange = sheet.orange.values.reduce((sum, value) => sum + value, 0);
  const purple = sheet.purple.values.reduce((sum, value) => sum + value, 0);
  const coloredScores = [yellow, blue, green, orange, purple];
  const fox = sheet.resources.foxes * Math.min(...coloredScores);
  const total = yellow + blue + green + orange + purple + fox;

  return {
    yellow,
    blue,
    green,
    orange,
    purple,
    fox,
    total
  };
}

export function scorePlayers(players: PlayerSheetSnapshot[]): PlayerSheetSnapshot[] {
  return players.map((player) => {
    const breakdown = scorePlayerSheet(player.sheet);

    return {
      ...player,
      score: breakdown.total
    };
  });
}

export function buildFinalStandings(players: PlayerSheetSnapshot[]): FinalStanding[] {
  const scored = players.map((player) => ({
    playerId: player.playerId,
    breakdown: scorePlayerSheet(player.sheet)
  }));
  const sorted = [...scored].sort(compareStandingEntries);

  return sorted.reduce<FinalStanding[]>((standings, entry, index) => {
    const previousEntry = sorted[index - 1];
    const previousStanding = standings[index - 1];
    const rank =
      previousEntry && previousStanding && compareStandingEntries(previousEntry, entry) === 0
        ? previousStanding.rank
        : index + 1;

    standings.push({
      playerId: entry.playerId,
      rank,
      totalScore: entry.breakdown.total,
      breakdown: entry.breakdown
    });
    return standings;
  }, []);
}

function scoreYellow(sheet: PlayerSheetState) {
  return YELLOW_COLUMNS.reduce((sum, column, index) => {
    const completed = column.every((cellId) => sheet.yellow.markedCellIds.includes(cellId));
    return completed ? sum + YELLOW_COLUMN_SCORES[index] : sum;
  }, 0);
}

function compareStandingEntries(
  left: { breakdown: PlayerScoreBreakdown },
  right: { breakdown: PlayerScoreBreakdown },
) {
  const totalDiff = right.breakdown.total - left.breakdown.total;
  if (totalDiff !== 0) {
    return totalDiff;
  }

  const singleAreaDiff = getHighestColoredAreaScore(right.breakdown) - getHighestColoredAreaScore(left.breakdown);
  if (singleAreaDiff !== 0) {
    return singleAreaDiff;
  }

  return 0;
}

function getHighestColoredAreaScore(breakdown: PlayerScoreBreakdown) {
  return Math.max(
    breakdown.yellow,
    breakdown.blue,
    breakdown.green,
    breakdown.orange,
    breakdown.purple,
  );
}
