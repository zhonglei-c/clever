import {
  BLUE_BOARD_DISPLAY,
  BLUE_CONNECTOR_DISPLAY,
  BLUE_COLUMN_REWARD_DISPLAY,
  BLUE_PROGRESS_DISPLAY,
  BLUE_ROW_REWARD_DISPLAY,
  BLUE_SUM_BY_CELL,
  GREEN_REWARD_MARKERS,
  GREEN_SCORE_TRACK,
  GREEN_THRESHOLD_TRACK,
  ORANGE_MULTIPLIER_MARKERS,
  ORANGE_REWARD_MARKERS,
  ORANGE_TRACK_LENGTH,
  PURPLE_REWARD_MARKERS,
  PURPLE_TRACK_LENGTH,
  YELLOW_COLUMN_SCORES,
  YELLOW_CORNER_REWARD_DISPLAY,
  YELLOW_DISPLAY_GRID,
  YELLOW_ROW_REWARD_DISPLAY,
  YELLOW_VALUE_BY_CELL,
  scorePlayerSheet,
  type BlueCellId,
  type PlayerSheetSnapshot,
  type SheetPlacement,
  type YellowCellId
} from "@clever/game-core";
import type { DieValue } from "@clever/shared";

interface ScoreSheetBoardSelection {
  activeZoneIds: Set<SheetPlacement["zone"]>;
  activeYellowCellIds: Set<YellowCellId>;
  activeBlueCellIds: Set<BlueCellId>;
  activeGreen: boolean;
  activeOrange: boolean;
  activePurple: boolean;
}

interface ScoreSheetBoardProps {
  player: PlayerSheetSnapshot;
  activeSelections: DieValue[];
  currentRound: number;
  totalRounds: number;
  selection: ScoreSheetBoardSelection;
  previewPlacement: SheetPlacement | null;
  previewValue: number | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function ScoreSheetBoard({
  player,
  activeSelections,
  currentRound,
  totalRounds,
  selection,
  previewPlacement,
  previewValue,
  onSelect,
}: ScoreSheetBoardProps) {
  const breakdown = scorePlayerSheet(player.sheet);

  return (
    <div className="score-sheet-board">
      <div className="score-sheet-board-content">
        <header className="score-sheet-topbar">
          <div className="score-sheet-used-dice">
            <div className="score-sheet-used-dice-head">
              <span className="score-sheet-panel-label">Used Dice</span>
              <strong>已使用骰子</strong>
            </div>
            <div className="score-sheet-used-dice-slots">
              {Array.from({ length: 3 }, (_, index) => {
                const die = activeSelections[index] ?? null;

                return (
                  <div
                    key={`selected-die-slot-${index + 1}`}
                    className={`score-sheet-used-die-slot ${
                      die ? "score-sheet-used-die-slot-filled" : ""
                    }`}
                    title={die ? `${die.id} ${die.value}` : `已使用骰位 ${index + 1}`}
                  >
                    {die ? (
                      <div className={`score-sheet-used-die-face die-card die-card-square die-${die.color}`}>
                        <span>{die.value}</span>
                      </div>
                    ) : (
                      <span className="score-sheet-used-die-placeholder">{index + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="score-sheet-topbar-main">
            <div className="score-sheet-topbar-head">
              <div className="score-sheet-brand">
                <span className="score-sheet-brand-line">Pretty Clever</span>
                <strong className="score-sheet-brand-title">Player Sheet</strong>
              </div>
              <div className="score-sheet-summary-strip">
                <div className="score-sheet-summary-pill">
                  <span>Fox</span>
                  <strong>{player.sheet.resources.foxes}</strong>
                </div>
                <div className="score-sheet-summary-pill">
                  <span>Pending</span>
                  <strong>{player.sheet.pendingBonuses.length}</strong>
                </div>
              </div>
            </div>

            <div className="score-sheet-round-strip">
              <div className="score-sheet-round-strip-head">
                <span className="score-sheet-panel-label">Round Track</span>
                <strong>
                  {currentRound} / {totalRounds}
                </strong>
              </div>
              <div className="score-sheet-round-track">
                {Array.from({ length: totalRounds }, (_, index) => {
                  const round = index + 1;
                  const state =
                    round < currentRound ? "complete" : round === currentRound ? "active" : "upcoming";
                  const rewardLabel = getRoundRewardLabel(round);

                  return (
                    <div
                      key={`round-${round}`}
                      className={`score-sheet-round-step score-sheet-round-step-${state}`}
                    >
                      <div className="score-sheet-round-step-number">{round}</div>
                      <div className="score-sheet-round-step-meta">{rewardLabel ?? " "}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="score-sheet-resource-lanes">
              <ResourceTrack
                label="Reroll"
                title="重投"
                accent="reroll"
                token="R"
                available={player.sheet.resources.rerolls}
                gained={player.sheet.resourceTracks.rerolls.gained}
                spent={player.sheet.resourceTracks.rerolls.spent}
              />
              <ResourceTrack
                label="Plus One"
                title="+1"
                accent="plus"
                token="+1"
                available={player.sheet.resources.extraDice}
                gained={player.sheet.resourceTracks.extraDice.gained}
                spent={player.sheet.resourceTracks.extraDice.spent}
              />
            </div>
          </div>
        </header>

        <section
          className={`score-sheet-zone score-sheet-zone-yellow ${
            selection.activeZoneIds.has("yellow") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Yellow" count={`${player.sheet.yellow.markedCellIds.length}/12`} tone="yellow" />
          {renderYellowZone(player, selection, previewPlacement, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-blue ${
            selection.activeZoneIds.has("blue") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Blue" count={`${player.sheet.blue.markedCellIds.length}/11`} tone="blue" />
          {renderBlueZone(player, selection, previewPlacement, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-green ${
            selection.activeZoneIds.has("green") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Green" count={`${player.sheet.green.filledThresholds.length}/11`} tone="green" />
          {renderGreenZone(player, selection, previewPlacement, previewValue, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-orange ${
            selection.activeZoneIds.has("orange") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Orange" count={`${player.sheet.orange.values.length}/${ORANGE_TRACK_LENGTH}`} tone="orange" />
          {renderOrangeZone(player, selection, previewPlacement, previewValue, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-purple ${
            selection.activeZoneIds.has("purple") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Purple" count={`${player.sheet.purple.values.length}/${PURPLE_TRACK_LENGTH}`} tone="purple" />
          {renderPurpleZone(player, selection, previewPlacement, previewValue, onSelect)}
        </section>

        <footer className="score-sheet-footer">
          <div className="score-sheet-score-strip">
            <ScoreBox label="Y" value={breakdown.yellow} tone="yellow" />
            <ScoreBox label="B" value={breakdown.blue} tone="blue" />
            <ScoreBox label="G" value={breakdown.green} tone="green" />
            <ScoreBox label="O" value={breakdown.orange} tone="orange" />
            <ScoreBox label="P" value={breakdown.purple} tone="purple" />
            <ScoreBox label="FOX" value={breakdown.fox} tone="fox" />
          </div>
          <div className="score-sheet-total-box">
            <span className="score-sheet-total-label">Total</span>
            <strong className="score-sheet-total-value">{breakdown.total}</strong>
          </div>
        </footer>
      </div>
    </div>
  );
}

function isPreviewPlacement(
  previewPlacement: SheetPlacement | null,
  placement: SheetPlacement,
) {
  return (
    previewPlacement?.zone === placement.zone &&
    getPlacementCellId(previewPlacement) === getPlacementCellId(placement)
  );
}

const RESOURCE_TRACK_BASE_SLOTS = 7;

function getPlacementCellId(placement: SheetPlacement) {
  return "cellId" in placement ? placement.cellId : null;
}

function getRoundRewardLabel(round: number) {
  switch (round) {
    case 1:
      return "R";
    case 2:
      return "+1";
    case 3:
      return "R";
    case 4:
      return "X | 6";
    default:
      return null;
  }
}

function ResourceTrack({
  label,
  title,
  accent,
  token,
  available,
  gained,
  spent
}: {
  label: string;
  title: string;
  accent: "reroll" | "plus";
  token: string;
  available: number;
  gained: number;
  spent: number;
}) {
  const totalSlots = Math.max(RESOURCE_TRACK_BASE_SLOTS, gained, spent + available);

  return (
    <div className="score-sheet-resource-lane">
      <div className="score-sheet-resource-lane-head">
        <span className="score-sheet-panel-label">{label}</span>
        <strong>{title}</strong>
      </div>
      <div className="score-sheet-resource-lane-body">
        <div className={`score-sheet-resource-icon score-sheet-resource-icon-${accent}`}>
          <RewardGlyph token={token} />
        </div>
        <div className="score-sheet-resource-track">
          {Array.from({ length: totalSlots }, (_, index) => {
            const state =
              index < spent ? "used" : index < spent + available ? "available" : "empty";

            return (
              <div
                key={`${label}-${index + 1}`}
                className={`score-sheet-resource-mark score-sheet-resource-mark-${state}`}
                aria-hidden="true"
              >
                {state === "used" ? <SheetCrossGlyph className="score-sheet-resource-cross-svg" /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ZoneHeader({
  label,
  count,
  tone
}: {
  label: string;
  count: string;
  tone: "yellow" | "blue" | "green" | "orange" | "purple";
}) {
  return (
    <div className={`score-sheet-zone-head score-sheet-zone-head-${tone}`}>
      <div className="score-sheet-zone-headline">
        <span className={`score-sheet-zone-badge score-sheet-zone-badge-${tone}`} aria-hidden="true" />
        <h2>{label}</h2>
      </div>
      <span className="score-sheet-zone-counter">{count}</span>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "yellow" | "blue" | "green" | "orange" | "purple" | "fox";
}) {
  return (
    <div className={`score-sheet-score-box score-sheet-score-box-${tone}`}>
      <span className="score-sheet-score-box-label">{label}</span>
      <strong className="score-sheet-score-box-value">{value}</strong>
    </div>
  );
}

function RewardGlyph({ token }: { token: string }) {
  if (token === "X") {
    return (
      <SheetCrossGlyph className="sheet-reward-glyph-svg" />
    );
  }

  if (token === "R") {
    return (
      <svg viewBox="0 0 24 24" className="sheet-reward-glyph-svg" aria-hidden="true">
        <path d="M18 9a7 7 0 1 0 1.1 7.2" />
        <path d="M14.5 4H20v5.5" />
      </svg>
    );
  }

  if (token === "FOX") {
    return (
      <svg viewBox="0 0 24 24" className="sheet-reward-glyph-svg sheet-reward-glyph-fox" aria-hidden="true">
        <path d="M6 9 3.5 4 9 6.5 12 5.5 15 6.5 20.5 4 18 9l-.9 6.6L12 20l-5.1-4.4Z" />
        <circle cx="9.25" cy="11.3" r="1.05" />
        <circle cx="14.75" cy="11.3" r="1.05" />
      </svg>
    );
  }

  return <span className="sheet-reward-glyph-text">{token}</span>;
}

function SheetCrossGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function FormulaDieGlyph({ tone }: { tone: "blue" | "white" }) {
  return (
    <svg viewBox="0 0 24 24" className={`blue-formula-die-svg blue-formula-die-svg-${tone}`} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.2" />
      <circle cx="12" cy="12" r="2.15" />
    </svg>
  );
}

function renderYellowZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
  previewPlacement: SheetPlacement | null,
  onSelect: (placement: SheetPlacement) => void,
) {
  const marked = new Set(player.sheet.yellow.markedCellIds);
  const completedRows = new Set(player.sheet.yellow.claimedRowBonuses);

  return (
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
                    <div
                      key={entry.id}
                      className="yellow-slot yellow-slot-diagonal"
                    >
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
                const isPreviewed = isPreviewPlacement(previewPlacement, { zone: "yellow", cellId: entry.cellId });
                const printedValue = YELLOW_VALUE_BY_CELL[entry.cellId];

                return (
                  <div
                    key={entry.cellId}
                    className="yellow-slot"
                  >
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
  );
}

function renderBlueZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
  previewPlacement: SheetPlacement | null,
  onSelect: (placement: SheetPlacement) => void,
) {
  const marked = new Set(player.sheet.blue.markedCellIds);
  const filledCount = player.sheet.blue.markedCellIds.length;
  const completedRows = new Set(player.sheet.blue.claimedRowBonuses);
  const completedColumns = new Set(player.sheet.blue.claimedColumnBonuses);

  return (
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
              gridRow: String(slot.row)
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
              const isPreviewed = isPreviewPlacement(previewPlacement, { zone: "blue", cellId: slot.cellId });
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

              if (!reward) {
                return null;
              }

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

              if (!reward) {
                return null;
              }

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
  );
}

function BlueBoardBackdrop() {
  const cellCenterX = (column: number) => (column - 0.5) * 20;
  const cellCenterY = (row: number) => (row - 0.5) * 25;

  return (
    <div className="blue-board-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="blue-board-backdrop-svg">
        <rect x="2" y="2" width="76" height="71" rx="11" className="blue-board-backdrop-main" />
        <rect x="82" y="6" width="16" height="63" rx="8.5" className="blue-board-backdrop-rail" />
        <rect x="2" y="77" width="76" height="21" rx="10.5" className="blue-board-backdrop-bottom" />
        {BLUE_CONNECTOR_DISPLAY.map((connector) => {
          const x1 = cellCenterX(connector.fromColumn);
          const y1 = cellCenterY(connector.fromRow);
          const x2 = cellCenterX(connector.toColumn);
          const y2 = cellCenterY(connector.toRow);

          if (connector.axis === "row") {
            return (
              <g key={connector.id} className="blue-board-backdrop-connector">
                <path d={`M ${x1} ${y1} H ${x2 - 3.4}`} className="blue-board-backdrop-line" />
                <path d={`M ${x2 - 6.8} ${y2 - 4.8} L ${x2} ${y2} L ${x2 - 6.8} ${y2 + 4.8}`} className="blue-board-backdrop-arrow" />
              </g>
            );
          }

          return (
            <g key={connector.id} className="blue-board-backdrop-connector">
              <path d={`M ${x1} ${y1} V ${y2 - 3.8}`} className="blue-board-backdrop-line" />
              <path d={`M ${x2 - 4.6} ${y2 - 7.2} L ${x2} ${y2} L ${x2 + 4.6} ${y2 - 7.2}`} className="blue-board-backdrop-arrow" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function renderGreenZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
  previewPlacement: SheetPlacement | null,
  previewValue: number | null,
  onSelect: (placement: SheetPlacement) => void,
) {
  const filled = new Set(player.sheet.green.filledThresholds.map((value, index) => `${value}-${index}`));
  const enteredValues = player.sheet.green.values ?? [];
  const nextIndex = player.sheet.green.filledThresholds.length;

  return (
    <div className="green-sheet-frame">
      <div className="green-score-track">
        {GREEN_SCORE_TRACK.map((score, index) => (
          <div
            key={score}
            className={`green-score-node ${index < nextIndex ? "green-score-node-filled" : ""}`}
            title={`Green score step ${index + 1}`}
          >
            {score}
          </div>
        ))}
      </div>
      <div className="green-sheet-row">
        <div className="green-arrow-cell" aria-hidden="true" />
        <div className="green-track-shell">
          <GreenTrackBackdrop />
          <div className="green-threshold-strip">
            {GREEN_THRESHOLD_TRACK.map((value, index) => {
              const key = `${value}-${index}`;
              const isFilled = filled.has(key);
              const isActionable = !isFilled && index === nextIndex && selection.activeGreen;
              const isPreviewed = !isFilled && index === nextIndex && isPreviewPlacement(previewPlacement, { zone: "green" });

              return (
                <button
                  key={key}
                  className={`green-threshold-cell ${isFilled ? "green-threshold-cell-filled" : ""} ${
                    isActionable ? "sheet-cell-actionable" : ""
                  } ${isPreviewed ? "sheet-cell-previewed green-threshold-cell-previewed" : ""}`}
                  title={
                    isFilled
                      ? `Green threshold ${value} already filled`
                      : isPreviewed
                        ? `Preview ${previewValue ?? "current value"} in the next green box`
                        : isActionable
                          ? `Write your die in the next green box`
                        : `Green threshold ${value} is not available right now`
                  }
                  onClick={() => onSelect({ zone: "green" })}
                  disabled={!isActionable}
                >
                  {isFilled ? (
                    <>
                      <span className="green-threshold-value">{enteredValues[index] ?? ""}</span>
                      <span className="green-threshold-corner">{`>=${value}`}</span>
                    </>
                  ) : isPreviewed && typeof previewValue === "number" ? (
                    <>
                      <span className="green-threshold-value green-threshold-value-preview">{previewValue}</span>
                      <span className="green-threshold-corner">{`>=${value}`}</span>
                    </>
                  ) : (
                    <span className="green-threshold-label">{`>=${value}`}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="green-reward-strip">
        <div className="green-reward-spacer" aria-hidden="true" />
        <div className="green-reward-grid">
          {GREEN_REWARD_MARKERS.map((marker) => (
            <div
              key={`${marker.index}-${marker.label}`}
              className={`green-reward-token ${marker.tone} ${
                nextIndex >= marker.index ? "sheet-reward-claimed" : ""
              }`}
              style={{ gridColumn: String(marker.index) }}
              title={`Green milestone reward ${marker.label}`}
            >
              <RewardGlyph token={marker.label} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderOrangeZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
  previewPlacement: SheetPlacement | null,
  previewValue: number | null,
  onSelect: (placement: SheetPlacement) => void,
) {
  const values = player.sheet.orange.values;
  const nextIndex = values.length;

  return (
    <div className="orange-sheet-frame">
      <div className="orange-sheet-row">
        <div className="orange-arrow-cell" aria-hidden="true" />
        <div className="orange-track-shell">
          <OrangeTrackBackdrop />
          <div className="orange-slot-strip">
            {Array.from({ length: ORANGE_TRACK_LENGTH }, (_, index) => {
              const value = values[index];
              const isFilled = typeof value === "number";
              const isActionable = !isFilled && index === nextIndex && selection.activeOrange;
              const isPreviewed = !isFilled && index === nextIndex && isPreviewPlacement(previewPlacement, { zone: "orange" });
              const multiplier = ORANGE_MULTIPLIER_MARKERS.find((marker) => marker.index === index + 1);

              return (
                <div key={`orange-${index}`} className="orange-slot-wrap">
                  <button
                    className={`orange-slot-cell ${isFilled ? "orange-slot-cell-filled" : ""} ${
                      isActionable ? "sheet-cell-actionable" : ""
                    } ${isPreviewed ? "sheet-cell-previewed orange-slot-cell-previewed" : ""}`}
                    title={
                      isFilled
                        ? `Orange slot ${index + 1} contains ${value}`
                        : isPreviewed
                          ? `Preview ${previewValue ?? "current value"} in orange`
                          : isActionable
                            ? `Write ${previewValue ?? "the current value"} in orange`
                          : `Orange slot ${index + 1} is not available right now`
                    }
                    onClick={() => onSelect({ zone: "orange" })}
                    disabled={!isActionable}
                  >
                    {isFilled ? value : isPreviewed && typeof previewValue === "number" ? previewValue : ""}
                  </button>
                  {multiplier ? <span className="orange-multiplier">{multiplier.label}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="orange-reward-strip">
        <div className="orange-reward-spacer" aria-hidden="true" />
        <div className="orange-reward-grid">
          {ORANGE_REWARD_MARKERS.map((marker) => (
            <div
              key={`${marker.index}-${marker.label}`}
              className={`orange-reward-token ${marker.tone} ${
                nextIndex >= marker.index ? "sheet-reward-claimed" : ""
              }`}
              style={{ gridColumn: String(marker.index) }}
              title={`Orange milestone reward ${marker.label}`}
            >
              <RewardGlyph token={marker.label} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderPurpleZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
  previewPlacement: SheetPlacement | null,
  previewValue: number | null,
  onSelect: (placement: SheetPlacement) => void,
) {
  const values = player.sheet.purple.values;
  const nextIndex = values.length;

  return (
    <div className="purple-sheet-frame">
      <div className="purple-sheet-row">
        <div className="purple-arrow-cell" aria-hidden="true" />
        <div className="purple-track-shell">
          <PurpleTrackBackdrop />
          <div className="purple-slot-strip">
            {Array.from({ length: PURPLE_TRACK_LENGTH }, (_, index) => {
              const value = values[index];
              const isFilled = typeof value === "number";
              const isActionable = !isFilled && index === nextIndex && selection.activePurple;
              const isPreviewed = !isFilled && index === nextIndex && isPreviewPlacement(previewPlacement, { zone: "purple" });

              return (
                <button
                  key={`purple-${index}`}
                  className={`purple-slot-cell ${isFilled ? "purple-slot-cell-filled" : ""} ${
                    isActionable ? "sheet-cell-actionable" : ""
                  } ${isPreviewed ? "sheet-cell-previewed purple-slot-cell-previewed" : ""}`}
                  title={
                    isFilled
                      ? `Purple slot ${index + 1} contains ${value}`
                      : isPreviewed
                        ? `Preview ${previewValue ?? "current value"} in purple`
                        : isActionable
                          ? `Write ${previewValue ?? "the current value"} in purple`
                        : `Purple slot ${index + 1} is not available right now`
                  }
                  onClick={() => onSelect({ zone: "purple" })}
                  disabled={!isActionable}
                >
                  {isFilled ? (
                    <span className="purple-slot-value">{value}</span>
                  ) : isPreviewed && typeof previewValue === "number" ? (
                    <span className="purple-slot-value purple-slot-value-preview">{previewValue}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="purple-reward-strip">
        <div className="purple-reward-spacer" aria-hidden="true" />
        <div className="purple-reward-grid">
          {PURPLE_REWARD_MARKERS.map((marker) => (
            <div
              key={`${marker.index}-${marker.label}`}
              className={`purple-reward-token ${marker.tone} ${
                nextIndex >= marker.index ? "sheet-reward-claimed" : ""
              }`}
              style={{ gridColumn: String(marker.index) }}
              title={`Purple milestone reward ${marker.label}`}
            >
              <RewardGlyph token={marker.label} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GreenTrackBackdrop() {
  return (
    <div className="green-track-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="green-track-backdrop-svg">
        <rect x="1.5" y="1.5" width="97" height="15" rx="7.5" className="green-track-backdrop-frame" />
        <path d="M10.5 2v14M19.5 2v14M28.5 2v14M37.5 2v14M46.5 2v14M55.5 2v14M64.5 2v14M73.5 2v14M82.5 2v14M91.5 2v14" className="green-track-backdrop-line" />
      </svg>
    </div>
  );
}

function OrangeTrackBackdrop() {
  return (
    <div className="orange-track-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="orange-track-backdrop-svg">
        <rect x="1.5" y="1.5" width="97" height="15" rx="7.5" className="orange-track-backdrop-frame" />
        <path d="M10.5 2v14M19.5 2v14M28.5 2v14M37.5 2v14M46.5 2v14M55.5 2v14M64.5 2v14M73.5 2v14M82.5 2v14M91.5 2v14" className="orange-track-backdrop-line" />
        <circle cx="37.5" cy="9" r="1.8" className="orange-track-backdrop-dot" />
        <circle cx="64.5" cy="9" r="1.8" className="orange-track-backdrop-dot" />
        <circle cx="82.5" cy="9" r="1.8" className="orange-track-backdrop-dot" />
      </svg>
    </div>
  );
}

function PurpleTrackBackdrop() {
  return (
    <div className="purple-track-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="purple-track-backdrop-svg">
        <rect x="1.5" y="1.5" width="97" height="15" rx="7.5" className="purple-track-backdrop-frame" />
        <path d="M10.5 2v14M19.5 2v14M28.5 2v14M37.5 2v14M46.5 2v14M55.5 2v14M64.5 2v14M73.5 2v14M82.5 2v14M91.5 2v14" className="purple-track-backdrop-line" />
        <path d="M6 12c3-5 6-5 9 0s6 5 9 0 6-5 9 0 6 5 9 0 6-5 9 0 6 5 9 0 6-5 9 0 6 5 9 0 6-5 9 0" className="purple-track-backdrop-wave" />
      </svg>
    </div>
  );
}
