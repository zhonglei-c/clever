export const BASE_DICE_IDS = [
  "yellow",
  "blue",
  "green",
  "orange",
  "purple",
  "white"
] as const;

export type DieId = (typeof BASE_DICE_IDS)[number];
export type DieColor = DieId;

export type GamePhase =
  | "lobby"
  | "awaiting_active_roll"
  | "awaiting_active_selection"
  | "awaiting_passive_picks"
  | "awaiting_bonus_resolution"
  | "awaiting_turn_end"
  | "finished";

export interface DieValue {
  id: DieId;
  color: DieColor;
  value: number;
}
