import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyPlayerSheet,
  applyPlacementToSheet,
  enqueueSheetBonuses,
  resolvePendingBonus
} from "../rules/player-sheet";
import { scorePlayerSheet } from "../engine/scoring-engine";

test("yellow area allows two copies of each face value", () => {
  const baseSheet = createEmptyPlayerSheet();
  const afterFirst = applyPlacementToSheet(baseSheet, { zone: "yellow" }, {
    die: { id: "yellow", color: "yellow", value: 4 },
    currentDiceValues: { yellow: 4 }
  });
  const afterSecond = applyPlacementToSheet(afterFirst.sheet, { zone: "yellow" }, {
    die: { id: "white", color: "white", value: 4 },
    currentDiceValues: { white: 4 }
  });

  assert.equal(afterSecond.sheet.yellow.marksByValue[4], 2);
  assert.throws(
    () =>
      applyPlacementToSheet(afterSecond.sheet, { zone: "yellow" }, {
        die: { id: "yellow", color: "yellow", value: 4 },
        currentDiceValues: { yellow: 4 }
      }),
    /no remaining empty box/i,
  );
});

test("yellow area tracks row and diagonal bonuses on the explicit board layout", () => {
  let sheet = createEmptyPlayerSheet();

  sheet = applyPlacementToSheet(sheet, { zone: "yellow", cellId: "y-r1c1" }, {
    die: { id: "yellow", color: "yellow", value: 3 },
    currentDiceValues: { yellow: 3 }
  }).sheet;
  sheet = applyPlacementToSheet(sheet, { zone: "yellow", cellId: "y-r1c2" }, {
    die: { id: "white", color: "white", value: 6 },
    currentDiceValues: { white: 6 }
  }).sheet;
  sheet = applyPlacementToSheet(sheet, { zone: "yellow", cellId: "y-r1c3" }, {
    die: { id: "yellow", color: "yellow", value: 5 },
    currentDiceValues: { yellow: 5 }
  }).sheet;
  const rowFinisher = applyPlacementToSheet(sheet, { zone: "yellow", cellId: "y-r1c4" }, {
    die: { id: "yellow", color: "yellow", value: 2 },
    currentDiceValues: { yellow: 2 }
  });

  assert.deepEqual(rowFinisher.sheet.yellow.claimedRowBonuses, [1]);
  assert.deepEqual(rowFinisher.triggeredBonuses, [
    {
      type: "number-mark",
      value: 3,
      allowedZones: ["yellow", "blue", "green"],
      source: "yellow-row-1"
    }
  ]);

  const diagonalStart = rowFinisher.sheet;
  const afterDiagonal2 = applyPlacementToSheet(diagonalStart, { zone: "yellow", cellId: "y-r2c2" }, {
    die: { id: "yellow", color: "yellow", value: 5 },
    currentDiceValues: { yellow: 5 }
  }).sheet;
  const diagonalFinisher = applyPlacementToSheet(afterDiagonal2, { zone: "yellow", cellId: "y-r3c3" }, {
    die: { id: "white", color: "white", value: 4 },
    currentDiceValues: { white: 4 }
  });

  assert.equal(diagonalFinisher.sheet.yellow.claimedDiagonalBonus, true);
  assert.deepEqual(diagonalFinisher.triggeredBonuses, [
    {
      type: "wild-mark",
      source: "yellow-diagonal"
    }
  ]);
});

test("blue area uses the current blue and white die sum", () => {
  const result = applyPlacementToSheet(createEmptyPlayerSheet(), { zone: "blue" }, {
    die: { id: "blue", color: "blue", value: 5 },
    currentDiceValues: {
      blue: 5,
      white: 3
    }
  });

  assert.deepEqual(result.sheet.blue.markedSums, [8]);
  assert.equal(result.usedValue, 8);
});

test("blue area triggers row and column bonuses from the explicit board layout", () => {
  let sheet = createEmptyPlayerSheet();

  sheet = applyPlacementToSheet(sheet, { zone: "blue", cellId: "b-r1c1" }, {
    die: { id: "white", color: "white", value: 2 },
    currentDiceValues: { white: 2 },
    bonusTargetValue: 2
  }).sheet;
  const rowFinisher = applyPlacementToSheet(sheet, { zone: "blue", cellId: "b-r1c2" }, {
    die: { id: "white", color: "white", value: 3 },
    currentDiceValues: { white: 3 },
    bonusTargetValue: 3
  });

  assert.deepEqual(rowFinisher.sheet.blue.claimedRowBonuses, [1]);
  assert.deepEqual(rowFinisher.triggeredBonuses, [
    {
      type: "extra-die",
      source: "blue-row-1"
    }
  ]);

  const firstColumnFinisher = applyPlacementToSheet(rowFinisher.sheet, { zone: "blue", cellId: "b-r2c1" }, {
    die: { id: "white", color: "white", value: 4 },
    currentDiceValues: { white: 4 },
    bonusTargetValue: 4
  });

  assert.deepEqual(firstColumnFinisher.sheet.blue.claimedColumnBonuses.sort(), [1]);
  assert.deepEqual(firstColumnFinisher.triggeredBonuses, [
    {
      type: "number-mark",
      value: 3,
      allowedZones: ["yellow", "blue", "green"],
      source: "blue-column-1"
    }
  ]);

  const columnFinisher = applyPlacementToSheet(firstColumnFinisher.sheet, { zone: "blue", cellId: "b-r3c2" }, {
    die: { id: "white", color: "white", value: 7 },
    currentDiceValues: { white: 7 },
    bonusTargetValue: 7
  });

  assert.deepEqual(columnFinisher.sheet.blue.claimedColumnBonuses.sort(), [1]);
  assert.deepEqual(columnFinisher.triggeredBonuses, []);

  const secondColumnFinisher = applyPlacementToSheet(
    columnFinisher.sheet,
    { zone: "blue", cellId: "b-r4c2" },
    {
      die: { id: "white", color: "white", value: 10 },
      currentDiceValues: { white: 10 },
      bonusTargetValue: 10
    },
  );

  assert.deepEqual(secondColumnFinisher.sheet.blue.claimedColumnBonuses.sort(), [1, 2]);
  assert.deepEqual(secondColumnFinisher.triggeredBonuses, [
    {
      type: "number-mark",
      value: 4,
      allowedZones: ["yellow", "blue", "green"],
      source: "blue-column-2"
    }
  ]);
});

test("green area allows values equal to the printed threshold", () => {
  const first = applyPlacementToSheet(createEmptyPlayerSheet(), { zone: "green" }, {
    die: { id: "green", color: "green", value: 1 },
    currentDiceValues: { green: 1 }
  });
  const second = applyPlacementToSheet(first.sheet, { zone: "green" }, {
    die: { id: "white", color: "white", value: 2 },
    currentDiceValues: { white: 2 }
  });

  assert.deepEqual(second.sheet.green.filledThresholds, [1, 2]);
  assert.throws(
    () =>
      applyPlacementToSheet(second.sheet, { zone: "green" }, {
        die: { id: "green", color: "green", value: 2 },
        currentDiceValues: { green: 2 }
      }),
    /at least 3/i,
  );
});

test("green area emits configured milestone bonuses", () => {
  const sheet = createEmptyPlayerSheet();
  sheet.green.filledThresholds = [1, 2, 3];

  const fourth = applyPlacementToSheet(sheet, { zone: "green" }, {
    die: { id: "green", color: "green", value: 6 },
    currentDiceValues: { green: 6 }
  });

  assert.deepEqual(fourth.triggeredBonuses, [
    {
      type: "extra-die",
      source: "green-step-4"
    }
  ]);

  const lateSheet = createEmptyPlayerSheet();
  lateSheet.green.filledThresholds = [1, 2, 3, 4, 5, 1, 2, 3, 4];
  const tenth = applyPlacementToSheet(lateSheet, { zone: "green" }, {
    die: { id: "white", color: "white", value: 6 },
    currentDiceValues: { white: 6 }
  });

  assert.deepEqual(tenth.triggeredBonuses, [
    {
      type: "purple-number",
      value: 6,
      source: "green-step-10"
    }
  ]);
});

test("purple area must strictly increase unless the previous value was six", () => {
  const first = applyPlacementToSheet(createEmptyPlayerSheet(), { zone: "purple" }, {
    die: { id: "purple", color: "purple", value: 3 },
    currentDiceValues: { purple: 3 }
  });

  assert.throws(
    () =>
      applyPlacementToSheet(first.sheet, { zone: "purple" }, {
        die: { id: "purple", color: "purple", value: 2 },
        currentDiceValues: { purple: 2 }
      }),
    /greater than 3/i,
  );

  const second = applyPlacementToSheet(first.sheet, { zone: "purple" }, {
    die: { id: "purple", color: "purple", value: 6 },
    currentDiceValues: { purple: 6 }
  });
  const third = applyPlacementToSheet(second.sheet, { zone: "purple" }, {
    die: { id: "white", color: "white", value: 1 },
    currentDiceValues: { white: 1 }
  });

  assert.deepEqual(third.sheet.purple.values, [3, 6, 1]);
});

test("orange and purple tracks emit milestone bonuses", () => {
  const orangeSheet = createEmptyPlayerSheet();
  orangeSheet.orange.values = [1, 2, 3, 4, 5, 6, 1];
  const orangeFox = applyPlacementToSheet(orangeSheet, { zone: "orange" }, {
    die: { id: "orange", color: "orange", value: 2 },
    currentDiceValues: { orange: 2 }
  });

  assert.deepEqual(orangeFox.triggeredBonuses, [
    {
      type: "fox",
      source: "orange-step-8"
    }
  ]);

  const purpleSheet = createEmptyPlayerSheet();
  purpleSheet.purple.values = [6, 1, 2, 3, 4, 5, 6, 1, 2];
  const purpleOrange = applyPlacementToSheet(purpleSheet, { zone: "purple" }, {
    die: { id: "purple", color: "purple", value: 3 },
    currentDiceValues: { purple: 3 }
  });

  assert.deepEqual(purpleOrange.triggeredBonuses, [
    {
      type: "orange-number",
      value: 6,
      source: "purple-step-10"
    }
  ]);
});

test("pending wild-mark bonuses can be resolved into a legal follow-up placement", () => {
  const seeded = enqueueSheetBonuses(createEmptyPlayerSheet(), [
    {
      type: "wild-mark",
      source: "test"
    }
  ]);
  const result = resolvePendingBonus(seeded, 0, { zone: "green" });

  assert.equal(result.sheet.pendingBonuses.length, 0);
  assert.deepEqual(result.sheet.green.filledThresholds, [1]);
});

test("instant fox and reroll bonuses are stored as resources when resolved", () => {
  const foxSeeded = enqueueSheetBonuses(createEmptyPlayerSheet(), [
    {
      type: "fox",
      source: "test-fox"
    }
  ]);
  const foxResolved = resolvePendingBonus(foxSeeded, 0, { zone: "green" });

  assert.equal(foxResolved.sheet.pendingBonuses.length, 0);
  assert.equal(foxResolved.sheet.resources.foxes, 1);

  const rerollSeeded = enqueueSheetBonuses(createEmptyPlayerSheet(), [
    {
      type: "reroll",
      source: "test-reroll"
    }
  ]);
  const rerollResolved = resolvePendingBonus(rerollSeeded, 0, { zone: "green" });

  assert.equal(rerollResolved.sheet.pendingBonuses.length, 0);
  assert.equal(rerollResolved.sheet.resources.rerolls, 1);
});

test("scorePlayerSheet combines zone scores and fox bonus", () => {
  const sheet = createEmptyPlayerSheet();

  sheet.yellow.markedCellIds = [
    "y-r1c1",
    "y-r2c1",
    "y-r3c1",
    "y-r1c2",
    "y-r2c2",
    "y-r3c2"
  ];
  sheet.yellow.marksByValue = {
    1: 1,
    2: 2,
    3: 0,
    4: 0,
    5: 1,
    6: 2
  };
  sheet.blue.markedCellIds = ["b-r1c1", "b-r1c2", "b-r2c1", "b-r2c3"];
  sheet.blue.markedSums = [2, 3, 4, 5];
  sheet.green.filledThresholds = [1, 2, 3];
  sheet.orange.values = [2, 5, 6];
  sheet.purple.values = [3, 6, 1];
  sheet.resources.foxes = 2;

  const score = scorePlayerSheet(sheet);

  assert.deepEqual(score, {
    yellow: 24,
    blue: 7,
    green: 6,
    orange: 13,
    purple: 10,
    fox: 12,
    total: 72
  });
});
