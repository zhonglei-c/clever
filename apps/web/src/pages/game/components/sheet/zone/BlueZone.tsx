import {
  BLUE_BOARD_DISPLAY,
  BLUE_COLUMN_REWARD_DISPLAY,
  BLUE_PROGRESS_DISPLAY,
  BLUE_ROW_REWARD_DISPLAY,
  BLUE_SUM_BY_CELL,
  type PlayerSheetSnapshot,
  type SheetPlacement,
} from "@clever/game-core";
import type { SheetSelectionState } from "../../../scoreSheetSelection";
import { RewardGlyph } from "../glyphs/RewardGlyph";
import { SheetCrossGlyph } from "../glyphs/SheetCrossGlyph";
import { FormulaDieGlyph } from "../glyphs/FormulaDieGlyph";
import { BlueBoardBackdrop } from "../backdrops/BlueBoardBackdrop";
import { ZoneHeader } from "../ZoneHeader";

interface BlueZoneProps {
  player: PlayerSheetSnapshot;
  selection: SheetSelectionState;
  previewPlacement: SheetPlacement | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function BlueZone({ player, selection, previewPlacement, onSelect }: BlueZoneProps) {
  const marked = new Set(player.sheet.blue.markedCellIds);
  const filledCount = player.sheet.blue.markedCellIds.length;
  const completedRows = new Set(player.sheet.blue.claimedRowBonuses);
  const completedColumns = new Set(player.sheet.blue.claimedColumnBonuses);

  return (
    <section
      className={`score-sheet-zone score-sheet-zone-blue ${
        selection.activeZoneIds.has("blue") ? "score-sheet-zone-active" : ""
      }`}
    >
      <ZoneHeader label="Blue" count={`${player.sheet.blue.markedCellIds.length}/11`} tone="blue" />
      <div className="blue-sheet-frame">
        <div className="blue-progress-track">
          {BLUE_PROGRESS_DISPLAY.map((step, index) => (
            <div
              key={step.step}
              className="blue-progress-step"
              style={{ gridColumn: String(step.column) }}
              title={`Blue score step ${step.step}`}
            >
              <div className={`blue-score-node ${index < filledCount ? "blue-score-node-filled" : ""}`}>
                {step.score}
              </div>
              <span className="blue-count-label">{step.count}</span>
            </div>
          ))}
        </div>
        <div className="blue-board-shell">
          <BlueBoardBackdrop />
          <div className="blue-board-grid">
            {BLUE_BOARD_DISPLAY.map((slot) => {
              const slotStyle = {
                gridColumn: String(slot.column),
                gridRow: String(slot.row),
              };

              if (slot.kind === "formula") {
                return (
                  <div
                    key={slot.id}
                    className="blue-formula-tile"
                    style={slotStyle}
                    title="Blue die plus white die"
                  >
                    <span className="blue-formula-die blue-formula-die-blue">
                      <FormulaDieGlyph tone="blue" />
                    </span>
                    <span className="blue-formula-plus">+</span>
                    <span className="blue-formula-die blue-formula-die-white">
                      <FormulaDieGlyph tone="white" />
                    </span>
                  </div>
                );
              }

              if (slot.kind === "fillable" && slot.cellId) {
                const isMarked = marked.has(slot.cellId);
                const isActionable = selection.activeBlueCellIds.has(slot.cellId);
                const isPreviewed =
                  previewPlacement?.zone === "blue" &&
                  "cellId" in previewPlacement &&
                  previewPlacement.cellId === slot.cellId;
                const sum = BLUE_SUM_BY_CELL[slot.cellId];

                return (
                  <button
                    key={slot.id}
                    className={`sheet-cell blue-sum-cell ${isMarked ? "blue-sum-cell-filled" : ""} ${
                      isActionable ? "sheet-cell-actionable" : ""
                    } ${isPreviewed ? "sheet-cell-previewed blue-sum-cell-previewed" : ""}`}
                    style={slotStyle}
                    title={
                      isMarked
                        ? `Blue sum ${sum} already crossed off`
                        : isActionable
                          ? `Cross off blue sum ${sum}`
                          : `Blue sum ${sum} is not available right now`
                    }
                    onClick={() => onSelect({ zone: "blue", cellId: slot.cellId })}
                    disabled={!isActionable}
                  >
                    {isMarked ? (
                      <>
                        <span className="blue-sum-number blue-sum-number-crossed">{sum}</span>
                        <span className="blue-sum-cross" aria-hidden="true">
                          <SheetCrossGlyph className="blue-sum-cross-svg" />
                        </span>
                      </>
                    ) : isPreviewed ? (
                      <>
                        <span className="blue-sum-number blue-sum-number-crossed">{sum}</span>
                        <span className="blue-sum-cross blue-sum-cross-preview" aria-hidden="true">
                          <SheetCrossGlyph className="blue-sum-cross-svg" />
                        </span>
                      </>
                    ) : (
                      <span className="blue-sum-number">{sum}</span>
                    )}
                  </button>
                );
              }

              if (slot.kind === "row-reward" && slot.rewardRow) {
                const reward = BLUE_ROW_REWARD_DISPLAY.find((entry) => entry.row === slot.rewardRow);
                if (!reward) return null;

                return (
                  <div
                    key={slot.id}
                    className={`blue-reward-pill ${reward.tone} ${
                      completedRows.has(reward.row) ? "blue-reward-pill-claimed" : ""
                    }`}
                    style={slotStyle}
                    title={`Blue row ${reward.row} reward`}
                  >
                    <span className="blue-reward-pill-label">
                      <RewardGlyph token={reward.label} />
                    </span>
                  </div>
                );
              }

              if (slot.kind === "column-reward" && slot.rewardColumn) {
                const reward = BLUE_COLUMN_REWARD_DISPLAY.find((entry) => entry.column === slot.rewardColumn);
                if (!reward) return null;

                return (
                  <div
                    key={slot.id}
                    className={`blue-bottom-reward ${reward.tone} ${
                      completedColumns.has(reward.column) ? "blue-reward-pill-claimed" : ""
                    }`}
                    style={slotStyle}
                    title={`Blue column ${reward.column} reward`}
                  >
                    <span className="blue-reward-pill-label">
                      <RewardGlyph token={reward.label} />
                    </span>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
