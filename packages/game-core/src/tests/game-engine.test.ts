import assert from "node:assert/strict";
import test from "node:test";

import { BASE_DICE_IDS, type DieValue } from "@clever/shared";

import {
  advanceTurn,
  createInitialGameState,
  enqueuePlayerBonuses,
  pickPassiveDie,
  resolvePlayerBonus,
  rollActiveDice,
  selectActiveDie,
  skipPassiveDie
} from "../engine/game-engine";

test("createInitialGameState seeds the first active turn", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3"]
  });

  assert.equal(state.phase, "awaiting_active_roll");
  assert.equal(state.currentPlayerId, "p1");
  assert.deepEqual(state.turn?.availableDiceIds, BASE_DICE_IDS);
  assert.equal(state.turn?.passiveSelections.length, 2);
});

test("active player can complete the full three-pick sequence", () => {
  const openingRoll: DieValue[] = [
    { id: "yellow", color: "yellow", value: 2 },
    { id: "blue", color: "blue", value: 5 },
    { id: "green", color: "green", value: 6 },
    { id: "orange", color: "orange", value: 1 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 3 }
  ];
  const secondRoll: DieValue[] = [
    { id: "blue", color: "blue", value: 2 },
    { id: "green", color: "green", value: 5 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 1 }
  ];
  const thirdRoll: DieValue[] = [
    { id: "green", color: "green", value: 6 },
    { id: "purple", color: "purple", value: 2 }
  ];

  const initial = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3"]
  });
  const afterRoll = rollActiveDice(initial, openingRoll);
  const afterFirstPick = selectActiveDie(afterRoll, "yellow", { zone: "yellow" });

  assert.equal(afterFirstPick.phase, "awaiting_active_roll");
  assert.deepEqual(afterFirstPick.turn?.silverPlatter.map((die) => die.id), ["orange"]);
  assert.deepEqual(afterFirstPick.turn?.availableDiceIds, ["blue", "green", "purple", "white"]);
  assert.equal(afterFirstPick.players.find((player) => player.playerId === "p1")?.sheet.yellow.marksByValue[2], 1);

  const afterSecondRoll = rollActiveDice(afterFirstPick, secondRoll);
  const afterSecondPick = selectActiveDie(afterSecondRoll, "blue", { zone: "blue" });

  assert.equal(afterSecondPick.phase, "awaiting_active_roll");
  assert.deepEqual(afterSecondPick.turn?.silverPlatter.map((die) => die.id), [
    "orange",
    "white"
  ]);
  assert.deepEqual(afterSecondPick.turn?.availableDiceIds, ["green", "purple"]);
  assert.deepEqual(
    afterSecondPick.players.find((player) => player.playerId === "p1")?.sheet.blue.markedSums,
    [3],
  );

  const afterThirdRoll = rollActiveDice(afterSecondPick, thirdRoll);
  const afterThirdPick = selectActiveDie(afterThirdRoll, "purple", { zone: "purple" });

  assert.equal(afterThirdPick.phase, "awaiting_passive_picks");
  assert.deepEqual(afterThirdPick.turn?.activeSelections.map((die) => die.id), [
    "yellow",
    "blue",
    "purple"
  ]);
  assert.deepEqual(afterThirdPick.turn?.silverPlatter.map((die) => die.id), [
    "orange",
    "white",
    "green"
  ]);
});

test("active turn can end early if no dice remain for another reroll", () => {
  const openingRoll: DieValue[] = [
    { id: "yellow", color: "yellow", value: 2 },
    { id: "blue", color: "blue", value: 5 },
    { id: "green", color: "green", value: 6 },
    { id: "orange", color: "orange", value: 1 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 3 }
  ];
  const secondRoll: DieValue[] = [
    { id: "blue", color: "blue", value: 1 },
    { id: "green", color: "green", value: 2 }
  ];

  const initial = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3"]
  });
  const passiveWindow = selectActiveDie(
    rollActiveDice(
      selectActiveDie(rollActiveDice(initial, openingRoll), "purple", { zone: "purple" }),
      secondRoll,
    ),
    "green",
    { zone: "green" },
  );

  assert.equal(passiveWindow.phase, "awaiting_passive_picks");
  assert.deepEqual(passiveWindow.turn?.activeSelections.map((die) => die.id), [
    "purple",
    "green"
  ]);
  assert.deepEqual(passiveWindow.turn?.silverPlatter.map((die) => die.id), [
    "yellow",
    "orange",
    "white",
    "blue"
  ]);
});

test("passive players can choose the same silver-platter die", () => {
  const openingRoll: DieValue[] = [
    { id: "yellow", color: "yellow", value: 2 },
    { id: "blue", color: "blue", value: 5 },
    { id: "green", color: "green", value: 6 },
    { id: "orange", color: "orange", value: 1 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 3 }
  ];
  const secondRoll: DieValue[] = [
    { id: "blue", color: "blue", value: 2 },
    { id: "green", color: "green", value: 5 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 1 }
  ];
  const thirdRoll: DieValue[] = [
    { id: "green", color: "green", value: 6 },
    { id: "purple", color: "purple", value: 2 }
  ];

  const initial = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3"]
  });
  const passiveWindow = selectActiveDie(
    rollActiveDice(
      selectActiveDie(
        rollActiveDice(
          selectActiveDie(rollActiveDice(initial, openingRoll), "yellow", { zone: "yellow" }),
          secondRoll,
        ),
        "blue",
        { zone: "blue" },
      ),
      thirdRoll,
    ),
    "purple",
    { zone: "purple" },
  );
  const afterP2 = pickPassiveDie(passiveWindow, "p2", "green", { zone: "green" });
  const afterP3 = pickPassiveDie(afterP2, "p3", "green", { zone: "green" });

  assert.equal(afterP3.phase, "awaiting_turn_end");
  assert.equal(afterP3.turn?.silverPlatter.find((die) => die.id === "green")?.value, 6);
  assert.equal(afterP3.players.find((player) => player.playerId === "p2")?.lastPassiveDie?.id, "green");
  assert.equal(afterP3.players.find((player) => player.playerId === "p3")?.lastPassiveDie?.id, "green");
  assert.deepEqual(
    afterP3.players.find((player) => player.playerId === "p2")?.sheet.green.filledThresholds,
    [1],
  );
});

test("turn advances to the next active player and resets per-turn player markers", () => {
  const openingRoll: DieValue[] = [
    { id: "yellow", color: "yellow", value: 2 },
    { id: "blue", color: "blue", value: 5 },
    { id: "green", color: "green", value: 6 },
    { id: "orange", color: "orange", value: 1 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 3 }
  ];
  const secondRoll: DieValue[] = [
    { id: "blue", color: "blue", value: 2 },
    { id: "green", color: "green", value: 5 },
    { id: "purple", color: "purple", value: 4 },
    { id: "white", color: "white", value: 1 }
  ];
  const thirdRoll: DieValue[] = [
    { id: "green", color: "green", value: 6 },
    { id: "purple", color: "purple", value: 2 }
  ];

  const initial = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3"]
  });
  const passiveWindow = selectActiveDie(
    rollActiveDice(
      selectActiveDie(
        rollActiveDice(
          selectActiveDie(rollActiveDice(initial, openingRoll), "yellow", { zone: "yellow" }),
          secondRoll,
        ),
        "blue",
        { zone: "blue" },
      ),
      thirdRoll,
    ),
    "purple",
    { zone: "purple" },
  );
  const turnEnd = skipPassiveDie(skipPassiveDie(passiveWindow, "p2"), "p3");
  const nextTurn = advanceTurn(turnEnd);

  assert.equal(nextTurn.phase, "awaiting_active_roll");
  assert.equal(nextTurn.currentPlayerId, "p2");
  assert.equal(nextTurn.round, 1);
  assert.deepEqual(nextTurn.turn?.availableDiceIds, BASE_DICE_IDS);
  assert.equal(nextTurn.players.find((player) => player.playerId === "p1")?.selectedDiceThisTurn, 0);
});

test("advanceTurn finishes the game after the configured final round", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"],
    totalRounds: 1
  });
  const readyToFinish = {
    ...state,
    phase: "awaiting_turn_end" as const,
    round: 1,
    activePlayerIndex: 1,
    currentPlayerId: "p2",
    players: state.players.map((player, index) => ({
      ...player,
      sheet: {
        ...player.sheet,
        orange: {
          values: index === 0 ? [6, 6] : [3]
        }
      }
    }))
  };
  const finished = advanceTurn(readyToFinish);

  assert.equal(finished.phase, "finished");
  assert.equal(finished.turn, null);
  assert.equal(finished.currentPlayerId, null);
  assert.ok(finished.standings);
  assert.equal(finished.standings?.[0]?.playerId, "p1");
  assert.equal(finished.players.find((player) => player.playerId === "p1")?.score, 12);
});

test("bonus resolution returns the turn to its previous phase once resolved", () => {
  const initial = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const seeded = enqueuePlayerBonuses(
    {
      ...initial,
      phase: "awaiting_turn_end"
    },
    "p1",
    [
      {
        type: "wild-mark",
        source: "test"
      }
    ],
    "awaiting_turn_end",
  );
  const resolved = resolvePlayerBonus(seeded, {
    playerId: "p1",
    bonusIndex: 0,
    placement: { zone: "green" }
  });

  assert.equal(resolved.phase, "awaiting_turn_end");
  assert.equal(resolved.turn?.pendingBonusResolution, null);
  assert.deepEqual(
    resolved.players.find((player) => player.playerId === "p1")?.sheet.green.filledThresholds,
    [1],
  );
});
