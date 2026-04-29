import {
  YELLOW_COLUMN_SCORES,
  YELLOW_CORNER_REWARD_DISPLAY,
  YELLOW_DISPLAY_GRID,
  YELLOW_ROW_REWARD_DISPLAY,
  YELLOW_VALUE_BY_CELL,
  type PlayerSheetSnapshot,
  type SheetPlacement,
} from "@clever/game-core";
import type { SheetSelectionState } from "../../../scoreSheetSelection";
import { RewardGlyph } from "../glyphs/RewardGlyph";
import { ZoneHeader } from "../ZoneHeader";

interface YellowZoneProps {
  player: PlayerSheetSnapshot;
  selection: SheetSelectionState;
  previewPlacement: SheetPlacement | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function YellowZone({ player, selection, previewPlacement, onSelect }: YellowZoneProps) {
  const marked = new Set(player.sheet.yellow.markedCellIds);
  const completedRows = new Set(player.sheet.yellow.claimedRowBonuses);

  return (
    <section
      className={`score-sheet-zone score-sheet-zone-yellow ${
        selection.activeZoneIds.has("yellow") ? "score-sheet-zone-active" : ""
      }`}
    >
      <ZoneHeader label="Yellow" count={`${player.sheet.yellow.markedCellIds.length}/12`} tone="yellow" />
      <div className="yellow-sheet-frame">
        <div className="yellow-diagonal-connector" aria-hidden="true" />
        <div className="yellow-sheet-visual">
          <div className="yellow-grid-shell">
            <div className="yellow-row-connector yellow-row-connector-1" aria-hidden="true" />
            <div className="yellow-row-connector yellow-row-connector-2" aria-hidden="true" />
            <div className="yellow-row-connector yellow-row-connector-3" aria-hidden="true" />
            <div className="yellow-row-connector yellow-row-connector-4" aria-hidden="true" />
            <div className="yellow-column-connector yellow-column-connector-1" aria-hidden="true" />
            <div className="yellow-column-connector yellow-column-connector-2" aria-hidden="true" />
            <div className="yellow-column-connector yellow-column-connector-3" aria-hidden="true" />
            <div className="yellow-column-connector yellow-column-connector-4" aria-hidden="true" />
            <div className="sheet-grid yellow-grid">
              {YELLOW_DISPLAY_GRID.flatMap((row) =>
                row.map((entry) => {
                  if (entry.kind === "blocked") {
                    return (
                      <div key={entry.id} className="yellow-slot yellow-slot-diagonal">
                        <div className="yellow-cell-face yellow-cell-printed" title="Printed X space">
                          <span className="yellow-cell-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" className="yellow-cell-cross-svg">
                              <path d="M6 6 18 18" />
                              <path d="M18 6 6 18" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const isMarked = marked.has(entry.cellId);
                  const isActionable = selection.activeYellowCellIds.has(entry.cellId);
                  const isPreviewed =
                    previewPlacement?.zone === "yellow" &&
                    "cellId" in previewPlacement &&
                    previewPlacement.cellId === entry.cellId;
                  const printedValue = YELLOW_VALUE_BY_CELL[entry.cellId];

                  return (
                    <div key={entry.cellId} className="yellow-slot">
                      <button
                        className={`sheet-cell yellow-cell-face ${isMarked ? "yellow-cell-filled" : ""} ${
                          isActionable ? "sheet-cell-actionable" : ""
                        } ${isPreviewed ? "sheet-cell-previewed yellow-cell-previewed" : ""}`}
                        title={
                          isMarked
                            ? `Yellow ${printedValue} already crossed off`
                            : isActionable
                              ? `Cross off yellow ${printedValue}`
                              : `Yellow ${printedValue} is not available right now`
                        }
                        onClick={() => onSelect({ zone: "yellow", cellId: entry.cellId })}
                        disabled={!isActionable}
                      >
                        {isMarked ? (
                          <>
                            <span className="yellow-cell-number yellow-cell-number-crossed">{printedValue}</span>
                            <span className="yellow-cell-cross" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="yellow-cell-cross-svg">
                                <path d="M6 6 18 18" />
                                <path d="M18 6 6 18" />
                              </svg>
                            </span>
                          </>
                        ) : isPreviewed ? (
                          <>
                            <span className="yellow-cell-number yellow-cell-number-crossed">{printedValue}</span>
                            <span className="yellow-cell-cross yellow-cell-cross-preview" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="yellow-cell-cross-svg">
                                <path d="M6 6 18 18" />
                                <path d="M18 6 6 18" />
                              </svg>
                            </span>
                          </>
                        ) : (
                          <span className="yellow-cell-number">{printedValue}</span>
                        )}
                      </button>
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          <div className="yellow-reward-rail">
            {YELLOW_ROW_REWARD_DISPLAY.map((reward) => (
              <div
                key={reward.row}
                className={`yellow-reward-pill ${reward.tone} ${
                  completedRows.has(reward.row) ? "yellow-reward-pill-claimed" : ""
                }`}
                title={`Yellow row ${reward.row} reward`}
              >
                <span className="yellow-reward-pill-label">
                  <RewardGlyph token={reward.label} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="yellow-bottom-row">
          <div className="yellow-score-strip">
            {YELLOW_COLUMN_SCORES.map((score, index) => (
              <div
                key={score}
                className="yellow-score-chip yellow-score-chip-connected"
                title={`Yellow column ${index + 1} scores ${score}`}
              >
                <span className="yellow-score-chip-value">{score}</span>
              </div>
            ))}
          </div>
          <div
            className={`yellow-corner-bonus ${YELLOW_CORNER_REWARD_DISPLAY.tone} ${
              player.sheet.yellow.claimedDiagonalBonus ? "yellow-reward-pill-claimed" : ""
            }`}
            title="Yellow corner reward"
          >
            <span className="yellow-score-chip-value">
              <RewardGlyph token={YELLOW_CORNER_REWARD_DISPLAY.label} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
