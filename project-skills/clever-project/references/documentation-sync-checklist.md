# Documentation Sync Checklist

Use this checklist before closing out work in this repository, especially after a feature lands, a milestone shifts, or a new handoff point is created.

## Start with the question

Ask these four questions:

- Did the completion status of any tracked work item change
- Did the technical or product direction change
- Did the current focus, risks, or recommended next step change
- Did I clarify a rule or repo convention that future contributors would otherwise need to rediscover

If the answer to any of them is yes, at least one document should usually be updated.

## When to update `PROJECT_BOARD.md`

Update `PROJECT_BOARD.md` when:

- A tracked item moved from `[ ]` to `[~]` or `[x]`
- A meaningful subtask should be added under an existing item
- The "next batch priorities" should change
- A feature milestone materially advanced, even if it is not fully done yet

Do not use it for long narrative explanations. Keep it focused on status and checklist structure.

## When to update `PROJECT_BLUEPRINT.md`

Update `PROJECT_BLUEPRINT.md` when:

- The MVP scope changes
- The architecture boundary between `apps/web`, `apps/server`, `packages/game-core`, or `packages/shared` changes
- The recommended stack, deployment direction, or event model changes
- A page, flow, or major product principle changes

Do not use it for day-to-day progress notes. Keep it as the durable project direction document.

## When to update `HANDOFF.md`

Update `HANDOFF.md` when:

- A work session ends at a meaningful checkpoint
- The active focus or current phase changes
- New risks, blockers, assumptions, or caveats appear
- The recommended next step changes
- A future collaborator would benefit from a new handoff note

Prefer appending a new handoff note rather than rewriting history, unless the top-level orientation sections are outdated.

## When to update repo docs under `docs/`

Update `docs/` when:

- A rule interpretation becomes clearer
- An event contract or state-machine behavior changes
- A UI flow, wireframe, or system note becomes stale
- The code now follows a digital interpretation that is not obvious from the original PDFs

Use repo docs for durable domain knowledge, not just progress tracking.

## Recommended close-out order

1. Update code and tests first.
2. Update `PROJECT_BOARD.md` if status changed.
3. Update `PROJECT_BLUEPRINT.md` if direction changed.
4. Update `docs/` if durable implementation knowledge changed.
5. Append to `HANDOFF.md` if the current checkpoint would help the next collaborator.

## Quick examples

- Finished a room feature: update `PROJECT_BOARD.md`, then add a `HANDOFF.md` note if it changes the next suggested task.
- Changed socket event shape: update `docs/api-events.md`, likely `PROJECT_BOARD.md`, and `HANDOFF.md` if it affects current guidance.
- Clarified a yellow/blue rule from the score sheet: update `docs/game-rules.md`; update `HANDOFF.md` if it changes risk or next steps.
- Switched architecture direction or storage choice: update `PROJECT_BLUEPRINT.md`, then `HANDOFF.md`.
