# Workflow

## Current product shape

- Build a browser-based multiplayer implementation of Ganz Schon Clever.
- Keep the MVP focused on private rooms for `1-6` players.
- Prioritize rules correctness, stable realtime flow, and a score-sheet-like UI.

## Technical shape

- Frontend: React, TypeScript, Vite
- Backend: Node.js, TypeScript, Fastify, Socket.IO
- Shared contracts: `packages/shared`
- Rules engine: `packages/game-core`
- Deployment direction: small VPS with Docker Compose

## Collaboration conventions

- Finish code, then update `PROJECT_BOARD.md` when a feature meaningfully moves forward.
- Update `PROJECT_BLUEPRINT.md` when the architecture or scope changes.
- Update `HANDOFF.md` when handoff guidance, current focus, or risks change.
- Treat uncertain rule details as explicit assumptions until verified against the PDFs.

## Quality bar

- Add or update tests for rules-engine behavior changes.
- Avoid coupling UI state too tightly to transport payload shape.
- Prefer explicit state transitions and readable serializers over clever abstractions.
