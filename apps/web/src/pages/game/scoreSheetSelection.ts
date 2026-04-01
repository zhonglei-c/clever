import {
  BLUE_CELL_IDS,
  BLUE_SUM_BY_CELL,
  GREEN_THRESHOLD_TRACK,
  YELLOW_CELL_IDS,
  YELLOW_VALUE_BY_CELL,
  type GameStateSnapshot,
  type PendingSheetBonus,
  type PlayerSheetSnapshot,
  type SheetPlacement
} from "@clever/game-core";
import type { DieValue } from "@clever/shared";

export type SelectedIntent =
  | {
      kind: "active";
      die: DieValue;
    }
  | {
      kind: "passive";
      die: DieValue;
    }
  | {
      kind: "extra";
      die: DieValue;
      playerRole: "active" | "passive";
    }
  | {
      kind: "bonus";
      bonus: PendingSheetBonus;
      bonusIndex: number;
    };

export interface SheetSelectionState {
  activeZoneIds: Set<SheetPlacement["zone"]>;
  activeYellowCellIds: Set<(typeof YELLOW_CELL_IDS)[number]>;
  activeBlueCellIds: Set<(typeof BLUE_CELL_IDS)[number]>;
  activeGreen: boolean;
  activeOrange: boolean;
  activePurple: boolean;
}

export function emptySheetSelection(): SheetSelectionState {
  return {
    activeZoneIds: new Set(),
    activeYellowCellIds: new Set(),
    activeBlueCellIds: new Set(),
    activeGreen: false,
    activeOrange: false,
    activePurple: false
  };
}

export function hasAnyLegalTarget(selection: SheetSelectionState) {
  return (
    selection.activeYellowCellIds.size > 0 ||
    selection.activeBlueCellIds.size > 0 ||
    selection.activeGreen ||
    selection.activeOrange ||
    selection.activePurple
  );
}

export function describeLegalTargets(selection: SheetSelectionState) {
  const parts: string[] = [];

  if (selection.activeYellowCellIds.size > 0) {
    parts.push(`黄色 ${selection.activeYellowCellIds.size} 格`);
  }

  if (selection.activeBlueCellIds.size > 0) {
    parts.push(`蓝色 ${selection.activeBlueCellIds.size} 格`);
  }

  if (selection.activeGreen) {
    parts.push("绿色下一阈值");
  }

  if (selection.activeOrange) {
    parts.push("橙色下一格");
  }

  if (selection.activePurple) {
    parts.push("紫色下一格");
  }

  return parts.join(" / ");
}

export function buildSheetSelection(
  intent: SelectedIntent | null,
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
): SheetSelectionState {
  if (!intent) {
    return emptySheetSelection();
  }

  const placements = getPlacementsForIntent(intent);
  const zoneIds = new Set(placements.map((placement) => placement.zone));
  const yellowValue = getYellowValueForIntent(intent);
  const blueTotal = getBlueTotalForIntent(intent, gameState);
  const nextGreenThreshold = GREEN_THRESHOLD_TRACK[player.sheet.green.filledThresholds.length] ?? null;
  const greenValue = getGreenValueForIntent(intent);

  return {
    activeZoneIds: zoneIds,
    activeYellowCellIds: new Set(
      zoneIds.has("yellow") && yellowValue
        ? YELLOW_CELL_IDS.filter(
            (cellId) =>
              YELLOW_VALUE_BY_CELL[cellId] === yellowValue &&
              !player.sheet.yellow.markedCellIds.includes(cellId),
          )
        : [],
    ),
    activeBlueCellIds: new Set(
      zoneIds.has("blue") && typeof blueTotal === "number"
        ? BLUE_CELL_IDS.filter(
            (cellId) =>
              BLUE_SUM_BY_CELL[cellId] === blueTotal &&
              !player.sheet.blue.markedCellIds.includes(cellId),
          )
        : [],
    ),
    activeGreen:
      zoneIds.has("green") &&
      typeof greenValue === "number" &&
      typeof nextGreenThreshold === "number" &&
      greenValue >= nextGreenThreshold,
    activeOrange: zoneIds.has("orange"),
    activePurple: zoneIds.has("purple")
  };
}

export function getTrackPreviewValue(
  zone: "orange" | "purple",
  intent: SelectedIntent | null,
) {
  if (!intent) {
    return null;
  }

  if (intent.kind === "bonus") {
    if (zone === "orange" && intent.bonus.type === "orange-number") {
      return intent.bonus.value ?? 6;
    }

    if (zone === "purple" && intent.bonus.type === "purple-number") {
      return intent.bonus.value ?? 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes(zone)) {
      return intent.bonus.value;
    }

    return null;
  }

  const die = getIntentDie(intent);

  if (zone === "orange") {
    return die.id === "orange" || die.id === "white" ? die.value : null;
  }

  return die.id === "purple" || die.id === "white" ? die.value : null;
}

export function getBonusPlacements(bonus: PendingSheetBonus): SheetPlacement[] {
  switch (bonus.type) {
    case "wild-mark":
      return [
        { zone: "yellow" },
        { zone: "blue" },
        { zone: "green" }
      ];
    case "fox":
    case "reroll":
    case "extra-die":
      return [];
    case "number-mark":
      return bonus.allowedZones.map((zone) => ({ zone }));
    case "orange-number":
      return [{ zone: "orange" }];
    case "purple-number":
      return [{ zone: "purple" }];
    default:
      return [];
  }
}

export function getIntentDie(intent: Exclude<SelectedIntent, { kind: "bonus" }>) {
  return intent.die;
}

function getPlacementsForIntent(intent: SelectedIntent): SheetPlacement[] {
  if (intent.kind === "bonus") {
    return getBonusPlacements(intent.bonus);
  }

  const die = getIntentDie(intent);

  return die.id === "white"
    ? [
        { zone: "yellow" },
        { zone: "blue" },
        { zone: "green" },
        { zone: "orange" },
        { zone: "purple" }
      ]
    : [{ zone: die.id }];
}

function getYellowValueForIntent(intent: SelectedIntent) {
  if (intent.kind === "bonus") {
    if (intent.bonus.type === "wild-mark") {
      return 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes("yellow")) {
      return intent.bonus.value;
    }

    return null;
  }

  const die = getIntentDie(intent);
  return die.id === "yellow" || die.id === "white" ? die.value : null;
}

function getBlueTotalForIntent(intent: SelectedIntent, gameState: GameStateSnapshot) {
  if (intent.kind === "bonus") {
    if (intent.bonus.type === "wild-mark") {
      return 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes("blue")) {
      return intent.bonus.value;
    }

    return null;
  }

  const die = getIntentDie(intent);

  if (!(die.id === "blue" || die.id === "white")) {
    return null;
  }

  const blueValue = die.id === "blue" ? die.value : gameState.turn?.currentDiceValues.blue;
  const whiteValue = die.id === "white" ? die.value : gameState.turn?.currentDiceValues.white;
  return typeof blueValue === "number" && typeof whiteValue === "number"
    ? blueValue + whiteValue
    : null;
}

function getGreenValueForIntent(intent: SelectedIntent) {
  if (intent.kind === "bonus") {
    if (intent.bonus.type === "wild-mark") {
      return 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes("green")) {
      return intent.bonus.value;
    }

    return null;
  }

  const die = getIntentDie(intent);
  return die.id === "green" || die.id === "white" ? die.value : null;
}
