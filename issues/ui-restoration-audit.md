# UI Restoration Audit

Last updated: `2026-03-31`

Scope:
- Current playable web UI in `apps/web`
- Shared score-sheet constants currently duplicated across `apps/web` and `packages/game-core`
- Reference target is the original score sheet layout and icon language from `prettyclever_w_scoring_black.pdf`

## Summary

The current web UI is no longer just a placeholder, but it still has two different classes of problems:

1. Visual direction problems:
   - the page reads like a modern card dashboard rather than a faithful digital score sheet
   - typography, iconography, and reward markers are too generic
   - some strings are visibly mojibake

2. Structural restoration problems:
   - at least part of the score-sheet model is still wrong
   - yellow and blue fill interactions did not match the printed-board behavior
   - score-sheet constants are duplicated in both the UI and the rules layer, which makes restoration drift likely

## Findings

### P0: Yellow and blue fill interactions did not match the printed-board behavior

Reference image:
- Yellow and blue keep their printed numbers visible after selection.
- A player mark is drawn as an overlaid handwritten-style `X`.
- Green, orange, and purple do not use that overlay treatment; they show the entered number in the target slot.

Current implementation:
- Yellow and blue were rendered as if the printed number disappears once marked.
- Green stored threshold progress, but not the actual entered values needed for an authentic write-in presentation.

Impact:
- This is a first-order authenticity problem.
- Even if the layout outline looks roughly correct, the interaction feedback still feels unlike the original score sheet.

Code locations:
- `apps/web/src/pages/game/GamePage.tsx`
- `packages/game-core/src/rules/player-sheet.ts`
- `packages/game-core/src/rules/score-sheet-spec.ts`

### P1: The score sheet is rendered as five separate cards instead of one continuous sheet

Reference image:
- The original board is one continuous printed sheet with strong adjacency between top dice strip, yellow/blue mid-panels, green/orange/purple tracks, and bottom bonus strip.

Current implementation:
- `GamePage` renders a two-column `score-sheet-layout`.
- Each zone sits inside a separate `sheet-card`.
- Zone framing and spacing are optimized for modular cards, not for original print continuity.

Impact:
- Even if the local details improve, the overall page will still not feel "原汁原味".
- Cross-zone relationships such as arrows, reward rails, and bottom bonus strip lose their original visual meaning.

Code locations:
- `apps/web/src/pages/game/GamePage.tsx`
- `apps/web/src/styles/global.css`

### P1: Text encoding is broken in several user-facing strings and docs

Current implementation:
- Multiple UI labels, hints, and docs show mojibake.
- The issue is visible in `GamePage.tsx`, `ui-wireframes.md`, and `PROJECT_BOARD.md`.

Impact:
- This is a direct UX defect.
- It also makes UI review harder, because some strings that should be helping verify the layout are themselves unreadable.

Code locations:
- `apps/web/src/pages/game/GamePage.tsx`
- `docs/ui-wireframes.md`
- `PROJECT_BOARD.md`

### P1: Score-sheet constants are duplicated between UI and game-core

Current implementation:
- The rules layer defines `YELLOW_CELLS`, blue cells, progress bonuses, and related sheet logic.
- The UI separately defines `yellowValues`, `yellowDisplayGrid`, `blueSums`, `blueDisplayGrid`, and reward marker arrays.

Impact:
- Restoration fixes can easily land in one layer and not the other.
- A board that "looks right" can still behave wrong, or a rules fix can silently break the rendered layout.

Code locations:
- `packages/game-core/src/rules/player-sheet.ts`
- `apps/web/src/pages/game/GamePage.tsx`

### P2: Reward markers and symbols are represented as generic pills instead of board-native graphics

Reference image:
- Rewards are distinct printed glyphs, circles, arrows, box cutouts, and icon marks with strong physical-board character.

Current implementation:
- Yellow and blue rewards are rendered as rounded pills and text labels.
- Several icons are represented as text such as `FOX`, `X`, `R`, `+1`.

Impact:
- The UI reads as an approximation rather than a faithful digital board.
- It also increases ambiguity for future OCR validation and screenshot review.

Code locations:
- `apps/web/src/styles/global.css`
- `apps/web/src/pages/game/GamePage.tsx`

### P2: The typography and chrome still lean toward a web app instead of a board-game sheet

Current implementation:
- Global styling uses a general-purpose UI stack and soft card shadows.
- The panel system is visually attractive, but it does not resemble the dense print-first language of the original score sheet.

Impact:
- The game page currently feels like a dashboard around a sheet emulator instead of the sheet itself.

Code locations:
- `apps/web/src/styles/global.css`

## Recommended Reconstruction Plan

### Phase 1: Freeze a single source of truth for the score sheet

Create one explicit sheet spec and stop hand-maintaining parallel constants.

Recommended deliverable:
- `packages/game-core/src/rules/score-sheet-spec.ts`

This spec should contain:
- exact printable box ids for yellow, blue, green, orange, purple
- exact visible ordering
- exact reward positions
- exact printed values and score labels
- exact icon tokens such as `fox`, `reroll`, `extra-die`, `wild`, `number-6`

Rules:
- `game-core` reads legality and bonuses from this spec
- `apps/web` reads rendering geometry and labels from this spec
- `GamePage.tsx` should not define board constants inline anymore

### Phase 2: Replace the card layout with one continuous score-sheet renderer

Build a dedicated component, for example:
- `apps/web/src/features/score-sheet/ScoreSheetSvg.tsx`

Implementation direction:
- use one SVG root for the printable board
- use DOM only for floating UI outside the sheet
- split rendering into layers:
  - base print layer
  - state layer
  - interactive hotspot layer
  - hover / selectable highlight layer

The game page should then place:
- the score sheet as the primary center surface
- dice pool and action rail as secondary companions
- other player summaries as compact side content

### Phase 3: Rebuild iconography instead of using generic pills

Create a tiny board-native icon set:
- `fox`
- `reroll`
- `extra-die`
- `wild-mark`
- `number-bonus`
- directional arrows / connectors

Implementation direction:
- prefer SVG symbols over text placeholders
- preserve the strong black-outline print style of the reference
- only use text when the original sheet also uses text or numerals

### Phase 4: Fix encoding before any polish pass

Before visual polish, normalize all source files to UTF-8 and repair broken strings in:
- `apps/web`
- `docs`
- root markdown files that are already showing mojibake

If this is not done first, UI review will keep mixing visual issues with text corruption.

### Phase 5: Add screenshot-based restoration QA

Create a repeatable review checklist and compare the browser output against the source sheet by zone.

Recommended checklist buckets:
- top dice / reward strip
- yellow block count and arrow logic
- blue formula tile, 2..12 layout, and reward rails
- green thresholds, reward nodes, and bottom score progression
- orange slot count, multiplier placement, and reward spacing
- purple slot count, glyph progression, and reward positions
- bottom bonus strip and total box

Recommended artifact:
- `issues/ui-restoration-checklist.md`

## Execution Order

1. Fix encoding.
2. Extract a canonical sheet spec.
3. Lock yellow and blue overlay-mark behavior.
4. Move rendering to a single-sheet SVG component.
5. Replace placeholder icon pills with board-native SVG icons.
6. Run screenshot review zone by zone.

## What To Tackle First

If only one focused UI pass is possible right now, do this:

1. Yellow and blue overlay-mark behavior
2. Single-sheet layout skeleton
3. Encoding repair

That combination will remove the biggest authenticity gap fastest.
