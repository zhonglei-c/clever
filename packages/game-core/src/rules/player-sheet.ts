import type { DieId, DieValue } from "@clever/shared";
import {
  BLUE_CELLS,
  BLUE_CELL_IDS,
  GREEN_THRESHOLD_TRACK,
  ORANGE_TRACK_LENGTH,
  PURPLE_TRACK_LENGTH,
  SHEET_ZONE_IDS,
  type BlueCellId,
  type SheetZoneId,
  YELLOW_CELLS,
  YELLOW_CELL_IDS,
  type YellowCellId
} from "./score-sheet-spec";

export interface YellowZoneState {
  markedCellIds: YellowCellId[];
  marksByValue: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  claimedRowBonuses: Array<1 | 2 | 3 | 4>;
  claimedDiagonalBonus: boolean;
}

export interface BlueZoneState {
  markedCellIds: BlueCellId[];
  markedSums: number[];
  claimedRowBonuses: Array<1 | 2 | 3 | 4>;
  claimedColumnBonuses: Array<1 | 2 | 3 | 4>;
}

export interface GreenZoneState {
  filledThresholds: number[];
  values?: number[];
}

export interface OrangeZoneState {
  values: number[];
}

export interface PurpleZoneState {
  values: number[];
}

export interface PlayerResources {
  wildMarks: number;
  rerolls: number;
  extraDice: number;
  foxes: number;
}

export interface WildMarkBonus {
  type: "wild-mark";
  source: string;
}

export interface ExtraDieBonus {
  type: "extra-die";
  source: string;
}

export interface FoxBonus {
  type: "fox";
  source: string;
}

export interface RerollBonus {
  type: "reroll";
  source: string;
}

export interface NumberMarkBonus {
  type: "number-mark";
  value: number;
  allowedZones: SheetZoneId[];
  source: string;
}

export interface OrangeNumberBonus {
  type: "orange-number";
  value?: number;
  source: string;
}

export interface PurpleNumberBonus {
  type: "purple-number";
  value?: number;
  source: string;
}

export type PendingSheetBonus =
  | WildMarkBonus
  | ExtraDieBonus
  | FoxBonus
  | RerollBonus
  | NumberMarkBonus
  | OrangeNumberBonus
  | PurpleNumberBonus;

export interface PlayerSheetState {
  yellow: YellowZoneState;
  blue: BlueZoneState;
  green: GreenZoneState;
  orange: OrangeZoneState;
  purple: PurpleZoneState;
  resources: PlayerResources;
  pendingBonuses: PendingSheetBonus[];
}

export type SheetPlacement =
  | {
      zone: "yellow";
      cellId?: YellowCellId;
    }
  | {
      zone: "blue";
      cellId?: BlueCellId;
    }
  | {
      zone: "green";
    }
  | {
      zone: "orange";
    }
  | {
      zone: "purple";
    };

export interface ApplyPlacementContext {
  die: DieValue;
  currentDiceValues: Partial<Record<DieId, number>>;
  placement?: SheetPlacement;
  bonusTargetValue?: number;
}

export interface ApplyPlacementResult {
  sheet: PlayerSheetState;
  usedValue: number;
  triggeredBonuses: PendingSheetBonus[];
}

export type { BlueCellId, SheetZoneId, YellowCellId } from "./score-sheet-spec";
export {
  BLUE_CELL_IDS,
  SHEET_ZONE_IDS,
  YELLOW_CELL_IDS
} from "./score-sheet-spec";

const YELLOW_ROW_BONUSES: Record<1 | 2 | 3 | 4, PendingSheetBonus> = {
  1: {
    type: "wild-mark",
    source: "yellow-row-1"
  },
  2: {
    type: "number-mark",
    value: 4,
    allowedZones: ["yellow", "blue", "green"],
    source: "yellow-row-2"
  },
  3: {
    type: "wild-mark",
    source: "yellow-row-3"
  },
  4: {
    type: "fox",
    source: "yellow-row-4"
  }
};
const YELLOW_DIAGONAL_BONUS: ExtraDieBonus = {
  type: "extra-die",
  source: "yellow-diagonal"
};
const GREEN_PROGRESS_BONUSES: Partial<Record<number, PendingSheetBonus[]>> = {
  4: [
    {
      type: "extra-die",
      source: "green-step-4"
    }
  ],
  7: [
    {
      type: "wild-mark",
      source: "green-step-7"
    }
  ],
  8: [
    {
      type: "fox",
      source: "green-step-8"
    }
  ],
  10: [
    {
      type: "purple-number",
      value: 6,
      source: "green-step-10"
    }
  ],
  11: [
    {
      type: "reroll",
      source: "green-step-11"
    }
  ]
};
const BLUE_ROW_BONUSES: Record<1 | 2 | 3 | 4, PendingSheetBonus> = {
  1: {
    type: "extra-die",
    source: "blue-row-1"
  },
  2: {
    type: "wild-mark",
    source: "blue-row-2"
  },
  3: {
    type: "number-mark",
    value: 6,
    allowedZones: ["orange", "purple"],
    source: "blue-row-3"
  },
  4: {
    type: "extra-die",
    source: "blue-row-4"
  }
};
const ORANGE_PROGRESS_BONUSES: Partial<Record<number, PendingSheetBonus[]>> = {
  3: [
    {
      type: "reroll",
      source: "orange-step-3"
    }
  ],
  5: [
    {
      type: "wild-mark",
      source: "orange-step-5"
    }
  ],
  6: [
    {
      type: "extra-die",
      source: "orange-step-6"
    }
  ],
  8: [
    {
      type: "fox",
      source: "orange-step-8"
    }
  ],
  10: [
    {
      type: "purple-number",
      value: 6,
      source: "orange-step-10"
    }
  ]
};
const PURPLE_PROGRESS_BONUSES: Partial<Record<number, PendingSheetBonus[]>> = {
  3: [
    {
      type: "reroll",
      source: "purple-step-3"
    }
  ],
  4: [
    {
      type: "wild-mark",
      source: "purple-step-4"
    }
  ],
  5: [
    {
      type: "extra-die",
      source: "purple-step-5"
    }
  ],
  6: [
    {
      type: "wild-mark",
      source: "purple-step-6"
    }
  ],
  7: [
    {
      type: "fox",
      source: "purple-step-7"
    }
  ],
  8: [
    {
      type: "reroll",
      source: "purple-step-8"
    }
  ],
  9: [
    {
      type: "wild-mark",
      source: "purple-step-9"
    }
  ],
  10: [
    {
      type: "orange-number",
      value: 6,
      source: "purple-step-10"
    }
  ],
  11: [
    {
      type: "extra-die",
      source: "purple-step-11"
    }
  ]
};
const BLUE_COLUMN_BONUSES: Record<1 | 2 | 3 | 4, NumberMarkBonus> = {
  1: {
    type: "number-mark",
    value: 3,
    allowedZones: ["yellow", "blue", "green"],
    source: "blue-column-1"
  },
  2: {
    type: "number-mark",
    value: 4,
    allowedZones: ["yellow", "blue", "green"],
    source: "blue-column-2"
  },
  3: {
    type: "number-mark",
    value: 6,
    allowedZones: ["yellow", "blue", "green"],
    source: "blue-column-3"
  },
  4: {
    type: "number-mark",
    value: 9,
    allowedZones: ["yellow", "blue", "green"],
    source: "blue-column-4"
  }
};
export function createEmptyPlayerSheet(): PlayerSheetState {
  return {
    yellow: {
      markedCellIds: [],
      marksByValue: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
      },
      claimedRowBonuses: [],
      claimedDiagonalBonus: false
    },
    blue: {
      markedCellIds: [],
      markedSums: [],
      claimedRowBonuses: [],
      claimedColumnBonuses: []
    },
    green: {
      filledThresholds: [],
      values: []
    },
    orange: {
      values: []
    },
    purple: {
      values: []
    },
    resources: {
      wildMarks: 0,
      rerolls: 0,
      extraDice: 0,
      foxes: 0
    },
    pendingBonuses: []
  };
}

export function applyPlacementToSheet(
  sheet: PlayerSheetState,
  placement: SheetPlacement,
  context: ApplyPlacementContext,
): ApplyPlacementResult {
  const nextContext: ApplyPlacementContext = {
    ...context,
    placement
  };

  switch (placement.zone) {
    case "yellow":
      return applyYellowPlacement(sheet, nextContext);
    case "blue":
      return applyBluePlacement(sheet, nextContext);
    case "green":
      return applyGreenPlacement(sheet, nextContext);
    case "orange":
      return applyOrangePlacement(sheet, nextContext);
    case "purple":
      return applyPurplePlacement(sheet, nextContext);
    default:
      return assertNever(placement);
  }
}

export function resolvePendingBonus(
  sheet: PlayerSheetState,
  bonusIndex: number,
  placement: SheetPlacement,
): ApplyPlacementResult {
  const bonus = sheet.pendingBonuses[bonusIndex];

  invariant(bonus, `No pending bonus at index ${bonusIndex}.`);

  if (bonus.type === "wild-mark") {
    return applyWildcardBonus(removePendingBonus(sheet, bonusIndex), placement);
  }

  if (bonus.type === "extra-die") {
    return {
      sheet: removePendingBonusWithResource(sheet, bonusIndex, "extraDice"),
      usedValue: 0,
      triggeredBonuses: []
    };
  }

  if (bonus.type === "fox") {
    return {
      sheet: removePendingBonusWithResource(sheet, bonusIndex, "foxes"),
      usedValue: 0,
      triggeredBonuses: []
    };
  }

  if (bonus.type === "reroll") {
    return {
      sheet: removePendingBonusWithResource(sheet, bonusIndex, "rerolls"),
      usedValue: 0,
      triggeredBonuses: []
    };
  }

  if (bonus.type === "number-mark") {
    return applyNumberBonus(removePendingBonus(sheet, bonusIndex), placement, bonus);
  }

  if (bonus.type === "orange-number") {
    invariant(
      placement.zone === "orange",
      "An orange-number bonus must be applied to the orange zone.",
    );

    const seedDie = {
      id: "orange",
      color: "orange",
      value: bonus.value ?? 6
    } satisfies DieValue;

    return applyPlacementToSheet(removePendingBonus(sheet, bonusIndex), placement, {
      die: seedDie,
      currentDiceValues: {
        orange: seedDie.value
      },
      placement
    });
  }

  if (bonus.type === "purple-number") {
    invariant(
      placement.zone === "purple",
      "A purple-number bonus must be applied to the purple zone.",
    );

    const seedDie = {
      id: "purple",
      color: "purple",
      value: bonus.value ?? 6
    } satisfies DieValue;

    return applyPlacementToSheet(removePendingBonus(sheet, bonusIndex), placement, {
      die: seedDie,
      currentDiceValues: {
        purple: seedDie.value
      },
      placement
    });
  }

  return {
    sheet: removePendingBonus(sheet, bonusIndex),
    usedValue: 0,
    triggeredBonuses: []
  };
}

export function enqueueSheetBonuses(
  sheet: PlayerSheetState,
  bonuses: PendingSheetBonus[],
): PlayerSheetState {
  if (bonuses.length === 0) {
    return sheet;
  }

  return {
    ...sheet,
    pendingBonuses: [...sheet.pendingBonuses, ...bonuses]
  };
}

function applyYellowPlacement(
  sheet: PlayerSheetState,
  context: ApplyPlacementContext,
): ApplyPlacementResult {
  invariant(
    context.die.color === "yellow" || context.die.color === "white",
    "Yellow area can only use yellow or white dice.",
  );

  const value = asFaceValue(context.die.value);
  const targetCell = resolveYellowCell(sheet.yellow, context, value);

  const markedCellIds = [...sheet.yellow.markedCellIds, targetCell.id];
  const nextYellow = recalculateYellowZone({
    ...sheet.yellow,
    markedCellIds
  });
  const triggeredBonuses = collectYellowBonuses(sheet.yellow, nextYellow);

  return {
    sheet: {
      ...sheet,
      yellow: nextYellow
    },
    usedValue: value,
    triggeredBonuses
  };
}

function applyBluePlacement(
  sheet: PlayerSheetState,
  context: ApplyPlacementContext,
): ApplyPlacementResult {
  invariant(
    context.die.color === "blue" || context.die.color === "white",
    "Blue area can only use blue or white dice.",
  );

  const blueValue = context.currentDiceValues.blue;
  const whiteValue = context.currentDiceValues.white;
  const total =
    typeof context.bonusTargetValue === "number"
      ? context.bonusTargetValue
      : (() => {
          invariant(
            typeof blueValue === "number" && typeof whiteValue === "number",
            "Blue area requires both the blue and white die values to be known.",
          );
          return blueValue + whiteValue;
        })();

  const targetCell = resolveBlueCell(sheet.blue, context, total);
  const markedCellIds = [...sheet.blue.markedCellIds, targetCell.id];
  const nextBlue = recalculateBlueZone({
    ...sheet.blue,
    markedCellIds
  });
  const triggeredBonuses = collectBlueBonuses(sheet.blue, nextBlue);

  return {
    sheet: {
      ...sheet,
      blue: nextBlue
    },
    usedValue: total,
    triggeredBonuses
  };
}

function applyGreenPlacement(
  sheet: PlayerSheetState,
  context: ApplyPlacementContext,
): ApplyPlacementResult {
  invariant(
    context.die.color === "green" || context.die.color === "white",
    "Green area can only use green or white dice.",
  );

  const nextIndex = sheet.green.filledThresholds.length;
  invariant(nextIndex < GREEN_THRESHOLD_TRACK.length, "Green area is already full.");

  const threshold = GREEN_THRESHOLD_TRACK[nextIndex];
  invariant(
    context.die.value >= threshold,
    `Green area requires a value of at least ${threshold}.`,
  );

  return {
    sheet: {
      ...sheet,
      green: {
        filledThresholds: [...sheet.green.filledThresholds, threshold],
        values: [...(sheet.green.values ?? []), context.die.value]
      }
    },
    usedValue: context.die.value,
    triggeredBonuses: getLinearTrackBonuses(GREEN_PROGRESS_BONUSES, nextIndex + 1)
  };
}

function applyOrangePlacement(
  sheet: PlayerSheetState,
  context: ApplyPlacementContext,
): ApplyPlacementResult {
  invariant(
    context.die.color === "orange" || context.die.color === "white",
    "Orange area can only use orange or white dice.",
  );
  invariant(sheet.orange.values.length < ORANGE_TRACK_LENGTH, "Orange area is already full.");

  return {
    sheet: {
      ...sheet,
      orange: {
        values: [...sheet.orange.values, context.die.value]
      }
    },
    usedValue: context.die.value,
    triggeredBonuses: getLinearTrackBonuses(ORANGE_PROGRESS_BONUSES, sheet.orange.values.length + 1)
  };
}

function applyPurplePlacement(
  sheet: PlayerSheetState,
  context: ApplyPlacementContext,
): ApplyPlacementResult {
  invariant(
    context.die.color === "purple" || context.die.color === "white",
    "Purple area can only use purple or white dice.",
  );
  invariant(sheet.purple.values.length < PURPLE_TRACK_LENGTH, "Purple area is already full.");

  const previousValue = sheet.purple.values.at(-1);

  if (typeof previousValue === "number" && previousValue !== 6) {
    invariant(
      context.die.value > previousValue,
      `Purple area requires a value greater than ${previousValue}.`,
    );
  }

  return {
    sheet: {
      ...sheet,
      purple: {
        values: [...sheet.purple.values, context.die.value]
      }
    },
    usedValue: context.die.value,
    triggeredBonuses: getLinearTrackBonuses(PURPLE_PROGRESS_BONUSES, sheet.purple.values.length + 1)
  };
}

function removePendingBonus(sheet: PlayerSheetState, bonusIndex: number): PlayerSheetState {
  return {
    ...sheet,
    pendingBonuses: sheet.pendingBonuses.filter((_, index) => index !== bonusIndex)
  };
}

function removePendingBonusWithResource(
  sheet: PlayerSheetState,
  bonusIndex: number,
  resourceKey: keyof PlayerResources,
): PlayerSheetState {
  const nextSheet = removePendingBonus(sheet, bonusIndex);

  return {
    ...nextSheet,
    resources: {
      ...nextSheet.resources,
      [resourceKey]: nextSheet.resources[resourceKey] + 1
    }
  };
}

function asFaceValue(value: number): 1 | 2 | 3 | 4 | 5 | 6 {
  invariant(value >= 1 && value <= 6, `Invalid die face value ${value}.`);
  return value as 1 | 2 | 3 | 4 | 5 | 6;
}

function applyWildcardBonus(
  sheet: PlayerSheetState,
  placement: SheetPlacement,
): ApplyPlacementResult {
  invariant(
    placement.zone === "yellow" || placement.zone === "blue" || placement.zone === "green",
    "Wild-mark bonuses can only be applied in yellow, blue, or green.",
  );

  if (placement.zone === "green") {
    return applyGreenPlacement(sheet, {
      die: {
        id: "white",
        color: "white",
        value: 6
      },
      currentDiceValues: {
        white: 6
      },
      placement
    });
  }

  return applyNumberBonus(sheet, placement, {
    type: "number-mark",
    value: 6,
    allowedZones: ["yellow", "blue", "green"],
    source: "wild-mark-fallback"
  });
}

function applyNumberBonus(
  sheet: PlayerSheetState,
  placement: SheetPlacement,
  bonus: NumberMarkBonus,
): ApplyPlacementResult {
  invariant(typeof bonus.value === "number", "Number bonus requires a numeric value.");
  invariant(
    bonus.allowedZones?.includes(placement.zone),
    `Number bonus ${bonus.value} cannot be applied to ${placement.zone}.`,
  );

  if (placement.zone === "yellow") {
    return applyYellowPlacement(sheet, {
      die: {
        id: "white",
        color: "white",
        value: bonus.value
      },
      currentDiceValues: {
        white: bonus.value
      },
      placement
    });
  }

  if (placement.zone === "blue") {
    return applyBluePlacement(sheet, {
      die: {
        id: "white",
        color: "white",
        value: bonus.value
      },
      currentDiceValues: {
        white: bonus.value
      },
      placement,
      bonusTargetValue: bonus.value
    });
  }

  if (placement.zone === "green") {
    return applyGreenPlacement(sheet, {
      die: {
        id: "white",
        color: "white",
        value: bonus.value
      },
      currentDiceValues: {
        white: bonus.value
      }
    });
  }

  if (placement.zone === "orange") {
    return applyOrangePlacement(sheet, {
      die: {
        id: "orange",
        color: "orange",
        value: bonus.value
      },
      currentDiceValues: {
        orange: bonus.value
      }
    });
  }

  if (placement.zone === "purple") {
    return applyPurplePlacement(sheet, {
      die: {
        id: "purple",
        color: "purple",
        value: bonus.value
      },
      currentDiceValues: {
        purple: bonus.value
      }
    });
  }

  return assertNever(placement);
}

function resolveYellowCell(
  yellow: YellowZoneState,
  context: ApplyPlacementContext,
  value: 1 | 2 | 3 | 4 | 5 | 6,
) {
  const placement = context.placement?.zone === "yellow" ? context.placement : null;
  const availableCells = YELLOW_CELLS.filter(
    (cell) => cell.value === value && !yellow.markedCellIds.includes(cell.id),
  );

  invariant(availableCells.length > 0, `Yellow value ${value} has no remaining empty box.`);

  if (placement?.cellId) {
    const targetCell = availableCells.find((cell) => cell.id === placement.cellId);
    invariant(targetCell, `Yellow cell ${placement.cellId} is not a valid target for value ${value}.`);
    return targetCell;
  }

  return availableCells[0];
}

function resolveBlueCell(
  blue: BlueZoneState,
  context: ApplyPlacementContext,
  total: number,
) {
  const placement = context.placement?.zone === "blue" ? context.placement : null;
  const availableCells = BLUE_CELLS.filter(
    (cell) => cell.sum === total && !blue.markedCellIds.includes(cell.id),
  );

  invariant(availableCells.length > 0, `Blue total ${total} is already marked or unavailable.`);

  if (placement?.cellId) {
    const targetCell = availableCells.find((cell) => cell.id === placement.cellId);
    invariant(targetCell, `Blue cell ${placement.cellId} is not valid for total ${total}.`);
    return targetCell;
  }

  return availableCells[0];
}

function recalculateYellowZone(yellow: YellowZoneState): YellowZoneState {
  const marksByValue = countYellowValues(yellow.markedCellIds);
  const claimedRowBonuses = ([1, 2, 3, 4] as const).filter((row) =>
    YELLOW_CELLS.filter((cell) => cell.row === row).every((cell) => yellow.markedCellIds.includes(cell.id)),
  );
  const claimedDiagonalBonus = YELLOW_CELLS.filter((cell) => cell.onDiagonal).every((cell) =>
    yellow.markedCellIds.includes(cell.id),
  );

  return {
    ...yellow,
    marksByValue,
    claimedRowBonuses,
    claimedDiagonalBonus
  };
}

function recalculateBlueZone(blue: BlueZoneState): BlueZoneState {
  const markedSums = BLUE_CELLS.filter((cell) => blue.markedCellIds.includes(cell.id))
    .map((cell) => cell.sum)
    .sort((left, right) => left - right);
  const claimedRowBonuses = ([1, 2, 3, 4] as const).filter((row) =>
    BLUE_CELLS.filter((cell) => cell.row === row).every((cell) => blue.markedCellIds.includes(cell.id)),
  );
  const claimedColumnBonuses = ([1, 2, 3, 4] as const).filter((column) => {
    const columnCells = BLUE_CELLS.filter((cell) => cell.column === column);
    return columnCells.length > 0 && columnCells.every((cell) => blue.markedCellIds.includes(cell.id));
  });

  return {
    ...blue,
    markedSums,
    claimedRowBonuses,
    claimedColumnBonuses
  };
}

function collectYellowBonuses(
  previous: YellowZoneState,
  next: YellowZoneState,
): PendingSheetBonus[] {
  const rowBonuses = next.claimedRowBonuses
    .filter((row) => !previous.claimedRowBonuses.includes(row))
    .map((row) => YELLOW_ROW_BONUSES[row]);
  const diagonalBonus =
    next.claimedDiagonalBonus && !previous.claimedDiagonalBonus
      ? [YELLOW_DIAGONAL_BONUS]
      : [];

  return [...rowBonuses, ...diagonalBonus];
}

function collectBlueBonuses(
  previous: BlueZoneState,
  next: BlueZoneState,
): PendingSheetBonus[] {
  const rowBonuses = next.claimedRowBonuses
    .filter((row) => !previous.claimedRowBonuses.includes(row))
    .map((row) => BLUE_ROW_BONUSES[row]);
  const columnBonuses = next.claimedColumnBonuses
    .filter((column) => !previous.claimedColumnBonuses.includes(column))
    .map((column) => BLUE_COLUMN_BONUSES[column]);

  return [...rowBonuses, ...columnBonuses];
}

function countYellowValues(markedCellIds: YellowCellId[]) {
  const counts: Record<1 | 2 | 3 | 4 | 5 | 6, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0
  };

  for (const cell of YELLOW_CELLS) {
    if (markedCellIds.includes(cell.id)) {
      counts[cell.value] += 1;
    }
  }

  return counts;
}

function getLinearTrackBonuses(
  rewardMap: Partial<Record<number, PendingSheetBonus[]>>,
  progress: number,
) {
  return rewardMap[progress] ?? [];
}

function assertNever(_: never): never {
  throw new Error("Unhandled placement variant.");
}

function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
