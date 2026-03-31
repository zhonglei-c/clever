import assert from "node:assert/strict";
import test from "node:test";

import { BASE_DICE_IDS, type DieValue } from "@clever/shared";

import {
  advanceTurn,
  createInitialGameState,
  enqueuePlayerBonuses,
  passExtraDie,
  pickExtraDie,
  pickPassiveDie,
  resolvePlayerBonus,
  rollActiveDice,
  selectActiveDie,
  skipActiveSelection,
  skipPassiveDie,
  useReroll
} from "../engine/game-engine";
import { buildFinalStandings } from "../engine/scoring-engine";
import type { YellowCellId } from "../rules/player-sheet";

test("createInitialGameState seeds the first active turn", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3"]
  });

  assert.equal(state.phase, "awaiting_active_roll");
  assert.equal(state.currentPlayerId, "p1");
  assert.deepEqual(state.turn?.availableDiceIds, BASE_DICE_IDS);
  assert.equal(state.turn?.passiveSelections.length, 2);
  assert.equal(state.players.every((player) => player.sheet.resources.rerolls === 1), true);
});

test("four-player games default to four rounds", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2", "p3", "p4"]
  });

  assert.equal(state.totalRounds, 4);
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
  const turnEnd = pickPassiveDie(
    pickPassiveDie(passiveWindow, "p2", "white", { zone: "yellow" }),
    "p3",
    "white",
    { zone: "yellow" },
  );
  const nextTurn = advanceTurn(turnEnd);

  assert.equal(nextTurn.phase, "awaiting_active_roll");
  assert.equal(nextTurn.currentPlayerId, "p2");
  assert.equal(nextTurn.round, 1);
  assert.deepEqual(nextTurn.turn?.availableDiceIds, BASE_DICE_IDS);
  assert.equal(nextTurn.players.find((player) => player.playerId === "p1")?.selectedDiceThisTurn, 0);
});

test("advancing into round two grants an extra-die action to every player", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const roundBoundary = {
    ...state,
    phase: "awaiting_turn_end" as const,
    round: 1,
    activePlayerIndex: 1,
    currentPlayerId: "p2",
    turn: {
      ...state.turn!,
      activePlayerId: "p2",
      passiveSelections: [{ playerId: "p1", status: "picked" as const, chosenDie: null }]
    }
  };

  const nextRound = advanceTurn(roundBoundary);

  assert.equal(nextRound.round, 2);
  assert.equal(nextRound.phase, "awaiting_active_roll");
  assert.equal(nextRound.players.every((player) => player.sheet.resources.extraDice === 1), true);
});

test("advancing into round four starts the black X / black 6 choice for each player", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const roundBoundary = {
    ...state,
    phase: "awaiting_turn_end" as const,
    round: 3,
    activePlayerIndex: 1,
    currentPlayerId: "p2",
    turn: {
      ...state.turn!,
      activePlayerId: "p2",
      passiveSelections: [{ playerId: "p1", status: "picked" as const, chosenDie: null }]
    }
  };

  const roundFourStart = advanceTurn(roundBoundary);

  assert.equal(roundFourStart.round, 4);
  assert.equal(roundFourStart.phase, "awaiting_bonus_resolution");
  assert.equal(roundFourStart.turn?.pendingBonusResolution?.mode, "choice");
  assert.equal(roundFourStart.turn?.pendingBonusResolution?.playerId, "p1");
  assert.equal(roundFourStart.turn?.pendingBonusResolution?.bonuses.length, 2);
});

test("round four choice resolution passes to the next player and then returns to active play", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const roundBoundary = {
    ...state,
    phase: "awaiting_turn_end" as const,
    round: 3,
    activePlayerIndex: 1,
    currentPlayerId: "p2",
    turn: {
      ...state.turn!,
      activePlayerId: "p2",
      passiveSelections: [{ playerId: "p1", status: "picked" as const, chosenDie: null }]
    }
  };
  const roundFourStart = advanceTurn(roundBoundary);
  const afterP1Choice = resolvePlayerBonus(roundFourStart, {
    playerId: "p1",
    bonusIndex: 1,
    placement: { zone: "orange" }
  });
  const afterP2Choice = resolvePlayerBonus(afterP1Choice, {
    playerId: "p2",
    bonusIndex: 1,
    placement: { zone: "orange" }
  });

  assert.equal(afterP1Choice.phase, "awaiting_bonus_resolution");
  assert.equal(afterP1Choice.turn?.pendingBonusResolution?.playerId, "p2");
  assert.equal(afterP2Choice.phase, "awaiting_active_roll");
  assert.equal(afterP2Choice.turn?.pendingBonusResolution, null);
  assert.deepEqual(
    afterP2Choice.players.map((player) => player.sheet.orange.values),
    [[6], [6]],
  );
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

test("advanceTurn cannot finish or hand off the turn while an extra-die decision is still pending", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"],
    totalRounds: 1
  });
  const readyToAdvance = {
    ...state,
    phase: "awaiting_turn_end" as const,
    round: 1,
    activePlayerIndex: 1,
    currentPlayerId: "p2",
    players: state.players.map((player) =>
      player.playerId === "p1"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              resources: {
                ...player.sheet.resources,
                extraDice: 1
              }
            }
          }
        : player,
    ),
    turn: {
      ...state.turn!,
      activePlayerId: "p2",
      activeSelections: [{ id: "green", color: "green", value: 6 } satisfies DieValue],
      currentDiceValues: { green: 6 },
      passiveSelections: [{ playerId: "p1", status: "picked" as const, chosenDie: null }]
    }
  };

  assert.throws(() => advanceTurn(readyToAdvance), /extra-die action/i);

  const passed = passExtraDie(readyToAdvance, "p1");
  const finished = advanceTurn(passed);

  assert.equal(passed.turn?.extraDicePassedByPlayer.p1, true);
  assert.equal(finished.phase, "finished");
});

test("remaining rerolls expire when the final round ends", () => {
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
    players: state.players.map((player) => ({
      ...player,
      sheet: {
        ...player.sheet,
        resources: {
          ...player.sheet.resources,
          rerolls: 3
        }
      }
    })),
    turn: {
      ...state.turn!,
      activePlayerId: "p2",
      passiveSelections: [{ playerId: "p1", status: "picked" as const, chosenDie: null }]
    }
  };

  const finished = advanceTurn(readyToFinish);

  assert.equal(finished.players.every((player) => player.sheet.resources.rerolls === 0), true);
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

test("extra-die bonus resolves immediately and returns to the previous phase", () => {
  const initial = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const seeded = enqueuePlayerBonuses(
    {
      ...initial,
      phase: "awaiting_passive_picks"
    },
    "p1",
    [
      {
        type: "extra-die",
        source: "blue-row-1"
      }
    ],
    "awaiting_passive_picks",
  );
  const resolved = resolvePlayerBonus(seeded, {
    playerId: "p1",
    bonusIndex: 0,
    placement: { zone: "green" }
  });

  assert.equal(resolved.phase, "awaiting_passive_picks");
  assert.equal(resolved.turn?.pendingBonusResolution, null);
  assert.equal(
    resolved.players.find((player) => player.playerId === "p1")?.sheet.resources.extraDice,
    1,
  );
});

test("active player can spend a reroll resource before choosing a die", () => {
  const rolled = rollActiveDice(
    createInitialGameState({
      roomId: "room-1",
      playerIds: ["p1", "p2"]
    }),
    [
      { id: "yellow", color: "yellow", value: 2 },
      { id: "blue", color: "blue", value: 5 },
      { id: "green", color: "green", value: 6 },
      { id: "orange", color: "orange", value: 1 },
      { id: "purple", color: "purple", value: 4 },
      { id: "white", color: "white", value: 3 }
    ],
  );
  const seeded = {
    ...rolled,
    players: rolled.players.map((player) =>
      player.playerId === "p1"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              resources: {
                ...player.sheet.resources,
                rerolls: 1
              }
            }
          }
        : player,
    )
  };

  const rerolled = useReroll(seeded, "p1");

  assert.equal(rerolled.phase, "awaiting_active_roll");
  assert.deepEqual(rerolled.turn?.rolledDice, []);
  assert.equal(rerolled.players.find((player) => player.playerId === "p1")?.sheet.resources.rerolls, 0);
});

test("an illegal active roll can be spent without ending the turn if rolls remain", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const blockedSelection = {
    ...state,
    phase: "awaiting_active_selection" as const,
    players: state.players.map((player) =>
      player.playerId === "p1"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              green: {
                filledThresholds: [1]
              }
            }
          }
        : player,
    ),
    turn: {
      ...state.turn!,
      availableDiceIds: ["green" as const],
      rolledDice: [{ id: "green", color: "green", value: 1 } satisfies DieValue],
      currentDiceValues: { green: 1 }
    }
  };

  const skipped = skipActiveSelection(blockedSelection, "p1");

  assert.equal(skipped.phase, "awaiting_active_roll");
  assert.equal(skipped.turn?.pickNumber, 2);
  assert.deepEqual(skipped.turn?.silverPlatter, []);
  assert.deepEqual(skipped.turn?.availableDiceIds, ["green"]);
  assert.deepEqual(skipped.turn?.rolledDice, []);
});

test("the final illegal active roll ends the regular turn and moves dice to the silver platter", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const blockedFinalRoll = {
    ...state,
    phase: "awaiting_active_selection" as const,
    players: state.players.map((player) =>
      player.playerId === "p1"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              green: {
                filledThresholds: [1]
              }
            }
          }
        : player,
    ),
    turn: {
      ...state.turn!,
      pickNumber: 3 as const,
      availableDiceIds: ["green" as const],
      rolledDice: [{ id: "green", color: "green", value: 1 } satisfies DieValue],
      currentDiceValues: { green: 1 }
    }
  };

  const skipped = skipActiveSelection(blockedFinalRoll, "p1");

  assert.equal(skipped.phase, "awaiting_passive_picks");
  assert.deepEqual(skipped.turn?.silverPlatter, [{ id: "green", color: "green", value: 1 }]);
  assert.deepEqual(skipped.turn?.rolledDice, []);
});

test("a passive player can fall back to the active player's die fields when every silver die is unusable", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const fallbackWindow = {
    ...state,
    phase: "awaiting_passive_picks" as const,
    players: state.players.map((player) =>
      player.playerId === "p2"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              yellow: {
                ...player.sheet.yellow,
                markedCellIds: ["y-r2c1", "y-r2c3"] as YellowCellId[],
                marksByValue: {
                  ...player.sheet.yellow.marksByValue,
                  1: 2
                }
              }
            }
          }
        : player,
    ),
    turn: {
      ...state.turn!,
      activeSelections: [{ id: "green", color: "green", value: 6 } satisfies DieValue],
      silverPlatter: [{ id: "yellow", color: "yellow", value: 1 } satisfies DieValue],
      currentDiceValues: { green: 6, yellow: 1 }
    }
  };

  const picked = pickPassiveDie(fallbackWindow, "p2", "green", { zone: "green" });

  assert.equal(picked.players.find((player) => player.playerId === "p2")?.sheet.green.filledThresholds.length, 1);
  assert.equal(picked.turn?.passiveSelections.find((selection) => selection.playerId === "p2")?.chosenDie?.id, "green");
});

test("a passive player can skip only when neither the silver platter nor active die fields are usable", () => {
  const state = createInitialGameState({
    roomId: "room-1",
    playerIds: ["p1", "p2"]
  });
  const blockedPassiveWindow = {
    ...state,
    phase: "awaiting_passive_picks" as const,
    players: state.players.map((player) =>
      player.playerId === "p2"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              yellow: {
                ...player.sheet.yellow,
                markedCellIds: ["y-r2c1", "y-r2c3"] as YellowCellId[],
                marksByValue: {
                  ...player.sheet.yellow.marksByValue,
                  1: 2
                }
              },
              green: {
                filledThresholds: [1]
              }
            }
          }
        : player,
    ),
    turn: {
      ...state.turn!,
      activeSelections: [{ id: "green", color: "green", value: 1 } satisfies DieValue],
      silverPlatter: [{ id: "yellow", color: "yellow", value: 1 } satisfies DieValue],
      currentDiceValues: { green: 1, yellow: 1 }
    }
  };

  const skipped = skipPassiveDie(blockedPassiveWindow, "p2");

  assert.equal(skipped.phase, "awaiting_turn_end");
  assert.equal(skipped.turn?.passiveSelections.find((selection) => selection.playerId === "p2")?.status, "skipped");
});

test("an extra-die action can reuse a regular die once at the end of the turn", () => {
  const passiveWindow = selectActiveDie(
    rollActiveDice(
      createInitialGameState({
        roomId: "room-1",
        playerIds: ["p1", "p2"]
      }),
      [
        { id: "yellow", color: "yellow", value: 2 },
        { id: "blue", color: "blue", value: 5 },
        { id: "green", color: "green", value: 6 },
        { id: "orange", color: "orange", value: 1 },
        { id: "purple", color: "purple", value: 4 },
        { id: "white", color: "white", value: 3 }
      ],
    ),
    "green",
    { zone: "green" },
  );
  const seeded = {
    ...passiveWindow,
    players: passiveWindow.players.map((player) =>
      player.playerId === "p1"
        ? {
            ...player,
            sheet: {
              ...player.sheet,
              resources: {
                ...player.sheet.resources,
                extraDice: 1
              }
            }
          }
        : player,
    )
  };

  const extraPicked = pickExtraDie(seeded, "p1", "green", { zone: "green" });

  assert.equal(extraPicked.players.find((player) => player.playerId === "p1")?.sheet.resources.extraDice, 0);
  assert.equal(extraPicked.players.find((player) => player.playerId === "p1")?.sheet.green.filledThresholds.length, 2);
  assert.deepEqual(extraPicked.turn?.extraDiceUsedByPlayer.p1, ["green"]);
});

test("final standings break score ties by the highest single colored area", () => {
  const standings = buildFinalStandings([
    {
      playerId: "p1",
      selectedDiceThisTurn: 0,
      score: 0,
      lastPassiveDie: null,
      sheet: {
        ...createInitialGameState({ roomId: "seed", playerIds: ["seed"] }).players[0]!.sheet,
        orange: { values: [10] }
      }
    },
    {
      playerId: "p2",
      selectedDiceThisTurn: 0,
      score: 0,
      lastPassiveDie: null,
      sheet: {
        ...createInitialGameState({ roomId: "seed", playerIds: ["seed"] }).players[0]!.sheet,
        orange: { values: [6] },
        purple: { values: [4] }
      }
    }
  ]);

  assert.equal(standings[0]?.playerId, "p1");
  assert.equal(standings[0]?.rank, 1);
  assert.equal(standings[1]?.rank, 2);
});

test("final standings share the rank when both total score and highest single area tie", () => {
  const standings = buildFinalStandings([
    {
      playerId: "p1",
      selectedDiceThisTurn: 0,
      score: 0,
      lastPassiveDie: null,
      sheet: {
        ...createInitialGameState({ roomId: "seed", playerIds: ["seed"] }).players[0]!.sheet,
        orange: { values: [6] },
        purple: { values: [4] }
      }
    },
    {
      playerId: "p2",
      selectedDiceThisTurn: 0,
      score: 0,
      lastPassiveDie: null,
      sheet: {
        ...createInitialGameState({ roomId: "seed", playerIds: ["seed"] }).players[0]!.sheet,
        orange: { values: [6] },
        purple: { values: [4] }
      }
    }
  ]);

  assert.equal(standings[0]?.rank, 1);
  assert.equal(standings[1]?.rank, 1);
});
