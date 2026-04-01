export type SheetZoneId = "yellow" | "blue" | "green" | "orange" | "purple";

export type YellowCellId =
  | "y-r1c1"
  | "y-r1c2"
  | "y-r1c3"
  | "y-r1c4"
  | "y-r2c1"
  | "y-r2c2"
  | "y-r2c3"
  | "y-r2c4"
  | "y-r3c1"
  | "y-r3c2"
  | "y-r3c3"
  | "y-r3c4";

export type BlueCellId =
  | "b-r1c1"
  | "b-r1c2"
  | "b-r2c1"
  | "b-r2c3"
  | "b-r2c4"
  | "b-r3c2"
  | "b-r3c3"
  | "b-r3c4"
  | "b-r4c2"
  | "b-r4c3"
  | "b-r4c4";

export interface YellowCellDefinition {
  id: YellowCellId;
  row: 1 | 2 | 3;
  column: 1 | 2 | 3 | 4;
  value: 1 | 2 | 3 | 4 | 5 | 6;
  onDiagonal: boolean;
}

export interface BlueCellDefinition {
  id: BlueCellId;
  row: 1 | 2 | 3 | 4;
  column: 1 | 2 | 3 | 4;
  sum: number;
}

export type YellowDisplayCell =
  | {
      kind: "fillable";
      cellId: YellowCellId;
    }
  | {
      kind: "blocked";
      id: string;
    };

export type BlueDisplayCell =
  | {
      kind: "formula";
      id: string;
    }
  | {
      kind: "fillable";
      cellId: BlueCellId;
    };

export interface IndexedMarkerSpec {
  index: number;
  label: string;
  tone: string;
}

export interface RowRewardSpec {
  row: 1 | 2 | 3 | 4;
  label: string;
  tone: string;
}

export interface ColumnRewardSpec {
  column: 1 | 2 | 3 | 4;
  label: string;
  tone: string;
}

export interface CornerRewardSpec {
  label: string;
  tone: string;
}

export const SHEET_ZONE_IDS: SheetZoneId[] = [
  "yellow",
  "blue",
  "green",
  "orange",
  "purple"
];

export const GREEN_THRESHOLD_TRACK = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6] as const;
export const GREEN_SCORE_TRACK = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66] as const;
export const ORANGE_TRACK_LENGTH = 11;
export const PURPLE_TRACK_LENGTH = 11;

export const YELLOW_COLUMN_SCORES = [10, 14, 16, 20] as const;
export const YELLOW_CELLS: YellowCellDefinition[] = [
  { id: "y-r1c1", row: 1, column: 1, value: 3, onDiagonal: true },
  { id: "y-r1c2", row: 1, column: 2, value: 6, onDiagonal: false },
  { id: "y-r1c3", row: 1, column: 3, value: 5, onDiagonal: false },
  { id: "y-r1c4", row: 1, column: 4, value: 2, onDiagonal: false },
  { id: "y-r2c1", row: 2, column: 1, value: 1, onDiagonal: false },
  { id: "y-r2c2", row: 2, column: 2, value: 5, onDiagonal: true },
  { id: "y-r2c3", row: 2, column: 3, value: 1, onDiagonal: false },
  { id: "y-r2c4", row: 2, column: 4, value: 2, onDiagonal: false },
  { id: "y-r3c1", row: 3, column: 1, value: 4, onDiagonal: false },
  { id: "y-r3c2", row: 3, column: 2, value: 3, onDiagonal: false },
  { id: "y-r3c3", row: 3, column: 3, value: 4, onDiagonal: true },
  { id: "y-r3c4", row: 3, column: 4, value: 6, onDiagonal: false }
];
export const YELLOW_CELL_IDS = YELLOW_CELLS.map((cell) => cell.id);
export const YELLOW_COLUMNS = [
  ["y-r1c1", "y-r2c1", "y-r3c1"],
  ["y-r1c2", "y-r2c2", "y-r3c2"],
  ["y-r1c3", "y-r2c3", "y-r3c3"],
  ["y-r1c4", "y-r2c4", "y-r3c4"]
] as const;
export const YELLOW_VALUE_BY_CELL = Object.fromEntries(
  YELLOW_CELLS.map((cell) => [cell.id, cell.value]),
) as Record<YellowCellId, number>;
export const YELLOW_ROW_REWARD_DISPLAY = [
  { row: 1, label: "X", tone: "yellow-reward-blue" },
  { row: 2, label: "4", tone: "yellow-reward-orange" },
  { row: 3, label: "X", tone: "yellow-reward-green" },
  { row: 4, label: "FOX", tone: "yellow-reward-red" }
] as const satisfies readonly Omit<RowRewardSpec, "row">[] | readonly RowRewardSpec[];
export const YELLOW_CORNER_REWARD_DISPLAY = {
  label: "+1",
  tone: "yellow-bonus-dark"
} as const satisfies CornerRewardSpec;
export const YELLOW_DISPLAY_GRID: YellowDisplayCell[][] = [
  [
    { kind: "fillable", cellId: "y-r1c1" },
    { kind: "fillable", cellId: "y-r1c2" },
    { kind: "fillable", cellId: "y-r1c3" },
    { kind: "blocked", id: "y-block-1" }
  ],
  [
    { kind: "fillable", cellId: "y-r1c4" },
    { kind: "fillable", cellId: "y-r2c1" },
    { kind: "blocked", id: "y-block-2" },
    { kind: "fillable", cellId: "y-r2c2" }
  ],
  [
    { kind: "fillable", cellId: "y-r2c3" },
    { kind: "blocked", id: "y-block-3" },
    { kind: "fillable", cellId: "y-r2c4" },
    { kind: "fillable", cellId: "y-r3c1" }
  ],
  [
    { kind: "blocked", id: "y-block-4" },
    { kind: "fillable", cellId: "y-r3c2" },
    { kind: "fillable", cellId: "y-r3c3" },
    { kind: "fillable", cellId: "y-r3c4" }
  ]
];

export const BLUE_CELLS: BlueCellDefinition[] = [
  { id: "b-r1c1", row: 1, column: 1, sum: 2 },
  { id: "b-r1c2", row: 1, column: 2, sum: 3 },
  { id: "b-r2c1", row: 2, column: 1, sum: 4 },
  { id: "b-r2c3", row: 2, column: 3, sum: 5 },
  { id: "b-r2c4", row: 2, column: 4, sum: 6 },
  { id: "b-r3c2", row: 3, column: 2, sum: 7 },
  { id: "b-r3c3", row: 3, column: 3, sum: 8 },
  { id: "b-r3c4", row: 3, column: 4, sum: 9 },
  { id: "b-r4c2", row: 4, column: 2, sum: 10 },
  { id: "b-r4c3", row: 4, column: 3, sum: 11 },
  { id: "b-r4c4", row: 4, column: 4, sum: 12 }
];
export const BLUE_CELL_IDS = BLUE_CELLS.map((cell) => cell.id);
export const BLUE_SUM_BY_CELL = Object.fromEntries(
  BLUE_CELLS.map((cell) => [cell.id, cell.sum]),
) as Record<BlueCellId, number>;
export const BLUE_SCORE_TRACK = [1, 2, 4, 7, 11, 16, 22, 29, 37, 46, 56] as const;
export const BLUE_COUNT_TRACK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export const BLUE_ROW_REWARD_DISPLAY = [
  { row: 1, label: "5", tone: "blue-reward-orange" },
  { row: 2, label: "X", tone: "blue-reward-yellow" },
  { row: 3, label: "FOX", tone: "blue-reward-fox" }
] as const satisfies readonly RowRewardSpec[];
export const BLUE_COLUMN_REWARD_DISPLAY = [
  { column: 1, label: "R", tone: "blue-bonus-dark" },
  { column: 2, label: "X", tone: "blue-bonus-green" },
  { column: 3, label: "6", tone: "blue-bonus-purple" },
  { column: 4, label: "+1", tone: "blue-bonus-dark" }
] as const satisfies readonly ColumnRewardSpec[];
export const BLUE_DISPLAY_GRID: BlueDisplayCell[][] = [
  [
    { kind: "formula", id: "blue-formula" },
    { kind: "fillable", cellId: "b-r1c1" },
    { kind: "fillable", cellId: "b-r1c2" },
    { kind: "fillable", cellId: "b-r2c1" }
  ],
  [
    { kind: "fillable", cellId: "b-r2c3" },
    { kind: "fillable", cellId: "b-r2c4" },
    { kind: "fillable", cellId: "b-r3c2" },
    { kind: "fillable", cellId: "b-r3c3" }
  ],
  [
    { kind: "fillable", cellId: "b-r3c4" },
    { kind: "fillable", cellId: "b-r4c2" },
    { kind: "fillable", cellId: "b-r4c3" },
    { kind: "fillable", cellId: "b-r4c4" }
  ]
];

export const GREEN_REWARD_MARKERS = [
  { index: 5, label: "+1", tone: "green-marker-dark" },
  { index: 6, label: "X", tone: "green-marker-blue" },
  { index: 7, label: "FOX", tone: "green-marker-red" },
  { index: 9, label: "6", tone: "green-marker-purple" },
  { index: 10, label: "R", tone: "green-marker-dark" }
] as const satisfies readonly IndexedMarkerSpec[];

export const ORANGE_MULTIPLIER_MARKERS = [
  { index: 4, label: "x2", tone: "orange-multiplier" },
  { index: 7, label: "x2", tone: "orange-multiplier" },
  { index: 9, label: "x2", tone: "orange-multiplier" },
  { index: 11, label: "x3", tone: "orange-multiplier" }
] as const satisfies readonly IndexedMarkerSpec[];

export const ORANGE_REWARD_MARKERS = [
  { index: 2, label: "R", tone: "orange-marker-dark" },
  { index: 4, label: "X", tone: "orange-marker-yellow" },
  { index: 5, label: "+1", tone: "orange-marker-dark" },
  { index: 7, label: "FOX", tone: "orange-marker-red" },
  { index: 9, label: "6", tone: "orange-marker-purple" }
] as const satisfies readonly IndexedMarkerSpec[];

export const PURPLE_REWARD_MARKERS = [
  { index: 2, label: "R", tone: "purple-marker-dark" },
  { index: 3, label: "X", tone: "purple-marker-blue" },
  { index: 4, label: "+1", tone: "purple-marker-dark" },
  { index: 5, label: "X", tone: "purple-marker-yellow" },
  { index: 6, label: "FOX", tone: "purple-marker-red" },
  { index: 7, label: "R", tone: "purple-marker-dark" },
  { index: 8, label: "X", tone: "purple-marker-green" },
  { index: 10, label: "6", tone: "purple-marker-orange" },
  { index: 11, label: "+1", tone: "purple-marker-dark" }
] as const satisfies readonly IndexedMarkerSpec[];
