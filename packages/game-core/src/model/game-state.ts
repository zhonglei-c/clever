import type { DieId, DieValue, GamePhase } from "@clever/shared";

import type {
  PendingSheetBonus,
  PlayerSheetState,
  SheetPlacement
} from "../rules/player-sheet";

export interface PlayerSheetSnapshot {
  playerId: string;
  selectedDiceThisTurn: number;
  score: number;
  lastPassiveDie: DieValue | null;
  sheet: PlayerSheetState;
}

export interface GameLogEntry {
  id: string;
  message: string;
  createdAt: string;
}

export interface PassivePickSnapshot {
  playerId: string;
  status: "pending" | "picked" | "skipped";
  chosenDie: DieValue | null;
}

export interface TurnStateSnapshot {
  activePlayerId: string;
  pickNumber: 1 | 2 | 3;
  availableDiceIds: DieId[];
  rolledDice: DieValue[];
  currentDiceValues: Partial<Record<DieId, number>>;
  activeSelections: DieValue[];
  silverPlatter: DieValue[];
  passiveSelections: PassivePickSnapshot[];
  pendingBonusResolution:
    | {
        playerId: string;
        bonuses: PendingSheetBonus[];
        resumePhase: Exclude<GamePhase, "awaiting_bonus_resolution">;
      }
    | null;
}

export interface BonusResolutionAction {
  playerId: string;
  bonusIndex: number;
  placement: SheetPlacement;
}

export interface PlayerScoreBreakdown {
  yellow: number;
  blue: number;
  green: number;
  orange: number;
  purple: number;
  fox: number;
  total: number;
}

export interface FinalStanding {
  playerId: string;
  rank: number;
  totalScore: number;
  breakdown: PlayerScoreBreakdown;
}

export interface GameStateSnapshot {
  roomId: string;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  activePlayerIndex: number;
  currentPlayerId: string | null;
  players: PlayerSheetSnapshot[];
  turn: TurnStateSnapshot | null;
  standings: FinalStanding[] | null;
  logs: GameLogEntry[];
}

export interface CreateInitialGameStateOptions {
  roomId: string;
  playerIds: string[];
  totalRounds?: number;
}
