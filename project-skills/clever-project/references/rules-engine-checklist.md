# Rules Engine Checklist

Use this checklist when editing files under `packages/game-core`, especially `engine/`, `model/`, `rules/`, or related tests.

## Before editing

- Read `docs/game-rules.md` and `docs/state-machine.md` for the currently documented behavior.
- Read the targeted files in `packages/game-core/src/` before changing adjacent logic.
- Check existing tests in `packages/game-core/src/tests/` to see what behavior is already locked in.
- If the change affects payloads or serialized state, inspect `packages/shared` and the server serializers that depend on game-core output.

## Source-of-truth checks

- Confirm whether the change is based on a verified rule, a score-sheet reference, or a temporary digital interpretation.
- If the underlying board layout or PDF detail is still uncertain, keep that uncertainty explicit in code comments or docs instead of presenting it as settled fact.
- Prefer putting the rule in one authoritative place rather than duplicating the same condition across engine layers.

## State-machine checks

- Verify the expected current phase before applying a game action.
- Keep phase transitions explicit and readable.
- Make sure each action either fully succeeds or clearly fails without leaving partial state behind.
- Check whether the change affects `awaiting_active_roll`, `awaiting_active_selection`, `awaiting_passive_picks`, `awaiting_bonus_resolution`, `awaiting_turn_end`, or `finished`.
- Think through early turn end, last-player turn end, and endgame transition.

## Legality and mutation checks

- Keep action validation separate from data mutation when practical.
- Confirm whether the change affects active picks, passive picks, silver platter handling, or zone placement legality.
- Preserve server-authoritative semantics: callers submit intent, the engine decides legality and resulting state.
- Watch for hidden regressions in repeated bonuses, chained rewards, or once-per-turn style assumptions.

## Scoring and rewards checks

- Confirm whether the change affects immediate rewards, chained rewards, fox production, or endgame scoring.
- Check whether reward production and reward consumption both need updates.
- Make sure score changes still line up with the player-sheet model and endgame standings.
- If adjusting yellow or blue constants, treat them as board-accuracy work and re-check against the score-sheet reference.

## Model and serialization checks

- Keep `model/game-state.ts` aligned with any new engine behavior.
- Avoid introducing engine state that cannot be serialized or restored.
- If new transient state is required, define clearly when it is created and when it is cleared.
- Think through reconnect and replay implications for any new field.

## Test checklist

- Add or update targeted tests in `packages/game-core/src/tests/`.
- Cover both the happy path and at least one illegal-action or edge-case path.
- Prefer tests that describe externally visible behavior rather than mirroring implementation details.
- If the change affects scoring or rewards, add an assertion that would fail on double-application or missing-application bugs.

## Close-out

- Run `npm run test --workspace @clever/game-core` when practical.
- Run `npm run typecheck --workspace @clever/game-core` if types or exports changed.
- If the change materially shifts the implemented rules, update `docs/game-rules.md`, `docs/state-machine.md`, and the project tracking docs as needed.
