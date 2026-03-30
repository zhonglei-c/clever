---
name: clever-project
description: Continue development in the Clever browser game repository with the project's established workflow, architecture, and documentation conventions. Use when Codex is asked to build features, fix bugs, review code, update rules logic, wire realtime events, refine the game UI, resume work after handoff, or handle requests such as "继续做这个项目", "接着做联机", "修房间逻辑", "补 socket 事件", "完善计分纸", or "同步更新项目文档" in this specific repo.
---

# Clever Project

## Overview

Use this skill to work inside the Clever browser game repository without re-discovering the repo structure or collaboration rules each time. Start from the project documents, keep changes aligned with the current MVP scope, and update the maintenance docs whenever the work changes project state or direction.

## Quick Start

1. Read `README.md` for the repo entry point.
2. Read `PROJECT_BOARD.md` to understand current priorities and completion status.
3. Read `PROJECT_BLUEPRINT.md` for product scope, architecture, and boundaries.
4. Read `HANDOFF.md` for latest progress, risks, and recommended next steps.
5. Read the local module or docs needed for the requested task before editing.

If the task is rules-heavy, also read `docs/game-rules.md`, `docs/state-machine.md`, and the relevant engine/tests under `packages/game-core/src/`.

## Working Rules

- Treat the server as authoritative. Do not move rules decisions into the client for convenience.
- Keep game rules in `packages/game-core` so they stay independent from UI and transport.
- Put shared contracts in `packages/shared` instead of duplicating web/server types.
- Favor small, testable changes, especially in the rules engine and scoring flow.
- Preserve the score-sheet visual language in the web app, but avoid copying copyrighted assets directly.
- Prefer desktop and tablet ergonomics over phone-first compromises.

## Trigger Phrases

This skill is a good match when the request is clearly about this repository and sounds like one of these intents:

- Continue existing work: "继续做这个项目", "接着上次做", "按 handoff 继续", "推进下一步"
- Realtime or room work: "做联机", "修 socket", "补房间事件", "加重连", "同步状态"
- Rules or scoring work: "修规则", "补计分", "改奖励链", "处理黄蓝区域", "核对狐狸加分"
- UI work tied to the game flow: "完善计分纸", "做房间页", "优化对局页", "接上骰池和银盘"
- Repo maintenance: "更新项目文档", "同步 board", "补 handoff", "做代码评审"

If the request names this repo or targets files under `apps/web`, `apps/server`, `packages/game-core`, or `packages/shared`, prefer using this skill.

## Repo Map

- `apps/web`: React + Vite frontend pages, routing, socket client, and score-sheet UI.
- `apps/server`: Fastify + Socket.IO backend, room lifecycle, realtime sync, and server-side orchestration.
- `packages/game-core`: rules engine, state model, scoring, turn flow, legality checks, and tests.
- `packages/shared`: shared event types, room schemas, and cross-app contracts.
- `docs/`: rule notes, API/event conventions, UI wireframes, and state-machine writeups.
- `infra/`: deployment and local infrastructure notes.

Read [project-map.md](./references/project-map.md) when you need the detailed file-level guide.

## Task Playbooks

### Rules or scoring changes

Read the relevant rule notes and existing tests first. Update or add tests in `packages/game-core/src/tests/` for any behavior change. Keep state transitions explicit and avoid silent behavior changes in serializer or transport layers.

Use the rules-engine checklist in [rules-engine-checklist.md](./references/rules-engine-checklist.md) before finalizing changes in `packages/game-core`.

### Room or realtime work

Inspect both the socket gateways in `apps/server/src/sockets/` and the shared event types in `packages/shared/src/types/`. Keep room state and game state responsibilities separate.

Use the multiplayer checklist in [multiplayer-checklist.md](./references/multiplayer-checklist.md) before finalizing changes that affect rooms, sockets, reconnect, or game-state sync.

### UI work

Preserve the tabletop score-sheet feel. Keep layout decisions grounded in the existing game flow and room flow rather than introducing generic dashboard patterns.

### Resume after handoff

Start from the latest note in `HANDOFF.md`, then verify that `PROJECT_BOARD.md` still matches the code before starting new work.

## Documentation Maintenance

- Update `PROJECT_BOARD.md` after completing a feature or meaningful milestone.
- Update `PROJECT_BLUEPRINT.md` when product scope, architecture, or technical direction changes.
- Update `HANDOFF.md` when progress, risks, recommended next steps, or onboarding guidance changes.
- When rules are clarified from the PDFs, record the digital interpretation in the repo docs so future contributors do not need to infer it again.

Use the documentation-sync checklist in [documentation-sync-checklist.md](./references/documentation-sync-checklist.md) before closing out work that changes project status, direction, or handoff guidance.

## Validation

- Use `npm run typecheck` after code changes when practical.
- Use `npm run test` or targeted package tests for rules-engine updates.
- Use `npm run build` before closing out larger changes that touch app boundaries.
- If a rule remains uncertain, state the assumption and point back to the source document that still needs manual verification.

## Resources

- Read [project-map.md](./references/project-map.md) for the project layout and suggested reading paths.
- Read [workflow.md](./references/workflow.md) for the ongoing collaboration conventions summarized from the repo docs.
- Read [multiplayer-checklist.md](./references/multiplayer-checklist.md) when changing room lifecycle, socket payloads, reconnect, or state-sync behavior.
- Read [rules-engine-checklist.md](./references/rules-engine-checklist.md) when changing turn flow, legality checks, scoring, endgame, or bonus handling in `packages/game-core`.
- Read [documentation-sync-checklist.md](./references/documentation-sync-checklist.md) when deciding whether `PROJECT_BOARD.md`, `PROJECT_BLUEPRINT.md`, `HANDOFF.md`, or repo docs need updates.
- Run `./scripts/link-into-codex-home.sh` from this skill directory to symlink the project skill into `${CODEX_HOME:-$HOME/.codex}/skills` on a machine where you want Codex to auto-discover it.
