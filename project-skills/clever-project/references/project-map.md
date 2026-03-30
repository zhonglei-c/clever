# Project Map

## Primary entry files

- `README.md`: top-level entry point and basic commands
- `PROJECT_BOARD.md`: roadmap and completion tracking
- `PROJECT_BLUEPRINT.md`: product scope, architecture, and technical direction
- `HANDOFF.md`: latest progress, risks, and next steps

## App boundaries

- `apps/web/src/pages/`: route-level pages such as home, room, game, and rules
- `apps/web/src/app/router/`: frontend routing
- `apps/server/src/routes/`: health and HTTP endpoints
- `apps/server/src/sockets/`: realtime registration and room/game gateways
- `apps/server/src/modules/`: room, presence, and game orchestration
- `packages/game-core/src/model/`: game-state types and structural models
- `packages/game-core/src/engine/`: turn flow, scoring, and endgame logic
- `packages/game-core/src/rules/`: score-sheet and rules helpers
- `packages/game-core/src/tests/`: engine and rule coverage
- `packages/shared/src/types/`: events and shared type contracts
- `packages/shared/src/schemas/`: cross-app schema validation

## Suggested reading by task

### Rules engine work

Read `docs/game-rules.md`, `docs/state-machine.md`, and the targeted files under `packages/game-core/src/`.

### Room or socket work

Read `docs/api-events.md`, `packages/shared/src/types/events.ts`, and the gateways/modules in `apps/server/src/`.

### Frontend workflow

Read `docs/ui-wireframes.md`, the relevant page under `apps/web/src/pages/`, and shared types consumed by that screen.

### End-to-end multiplayer flow

Trace `packages/shared` contracts first, then `apps/server`, then `apps/web`.
