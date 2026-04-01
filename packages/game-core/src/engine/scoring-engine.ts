import type { FinalStanding, PlayerScoreBreakdown, PlayerSheetSnapshot } from "../model/game-state";
import type { PlayerSheetState } from "../rules/player-sheet";
import {
  BLUE_SCORE_TRACK,
  GREEN_SCORE_TRACK,
  YELLOW_COLUMN_SCORES,
  YELLOW_COLUMNS
} from "../rules/score-sheet-spec";

const BLUE_SCORING_TRACK = [0, ...BLUE_SCORE_TRACK] as const;
const GREEN_SCORING_TRACK = [0, ...GREEN_SCORE_TRACK] as const;

export function scorePlayerSheet(sheet: PlayerSheetState): PlayerScoreBreakdown {
  const yellow = scoreYellow(sheet);
  const blue = BLUE_SCORING_TRACK[sheet.blue.markedSums.length] ?? 0;
  const green = GREEN_SCORING_TRACK[sheet.green.filledThresholds.length] ?? 0;
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
