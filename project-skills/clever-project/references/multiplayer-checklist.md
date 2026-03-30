# Multiplayer Checklist

Use this checklist when working on room flow, Socket.IO events, reconnect, or server-authoritative game actions.

## Before editing

- Read `docs/api-events.md` for the current event draft.
- Check `packages/shared/src/types/events.ts` and nearby shared types before adding new payload shapes.
- Inspect both `apps/server/src/sockets/` gateways and the matching modules in `apps/server/src/modules/`.
- Confirm whether the change also affects the web pages under `apps/web/src/pages/room/` or `apps/web/src/pages/game/`.

## Design checks

- Keep every room or game action tied to a `roomId`.
- Prefer intention-based events such as `game:select-die` over UI-click-shaped events.
- Make sure server handlers can reject illegal actions with a clear reason.
- Avoid letting the client compute authoritative rule outcomes.
- Decide whether the event is `client -> server`, `server -> client`, or both, and keep that contract explicit.

## State-sync checks

- Confirm what the source of truth is after each action.
- Check whether serializers need updates so reconnect and spectators receive the same shape.
- Think through late join, disconnect, reconnect, and duplicate event delivery.
- Keep room state, presence state, and game session state separate unless there is a clear reason to merge them.

## Web and server coordination

- Update shared event/types first when payload contracts change.
- Update server handlers next.
- Update web socket usage and page state last.
- Verify that optimistic UI does not contradict server-authoritative outcomes.

## Validation

- Run targeted type checks for `apps/server`, `apps/web`, and `packages/shared` when contracts change.
- If the change touches gameplay flow, also run `packages/game-core` tests or the root test command when practical.
- Manually sanity-check create room, join room, start game, one game action, and reconnect flow if the local environment is available.
