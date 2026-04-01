import {
  BLUE_COLUMN_REWARD_DISPLAY,
  BLUE_COUNT_TRACK,
  BLUE_DISPLAY_GRID,
  BLUE_ROW_REWARD_DISPLAY,
  BLUE_SCORE_TRACK,
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
  selection: ScoreSheetBoardSelection;
  onSelect: (placement: SheetPlacement) => void;
  orangePreviewValue: number | null;
  purplePreviewValue: number | null;
}

export function ScoreSheetBoard({
  player,
  selection,
  onSelect,
  orangePreviewValue,
  purplePreviewValue
}: ScoreSheetBoardProps) {
  const breakdown = scorePlayerSheet(player.sheet);

  return (
    <div className="score-sheet-board">
      <ScoreSheetChrome />

      <div className="score-sheet-board-content">
        <header className="score-sheet-masthead">
          <div className="score-sheet-brand">
            <span className="score-sheet-brand-line">Pretty Clever</span>
            <strong className="score-sheet-brand-title">Score Sheet</strong>
          </div>
          <div className="score-sheet-masthead-meta">
            <span>Yellow and Blue keep the printed number visible under an X.</span>
            <span>Green, Orange, and Purple write the chosen value directly.</span>
          </div>
        </header>

        <section
          className={`score-sheet-zone score-sheet-zone-yellow ${
            selection.activeZoneIds.has("yellow") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Yellow" count={`${player.sheet.yellow.markedCellIds.length}/12`} tone="yellow" />
          {renderYellowZone(player, selection, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-blue ${
            selection.activeZoneIds.has("blue") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Blue" count={`${player.sheet.blue.markedCellIds.length}/11`} tone="blue" />
          {renderBlueZone(player, selection, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-green ${
            selection.activeZoneIds.has("green") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Green" count={`${player.sheet.green.filledThresholds.length}/11`} tone="green" />
          {renderGreenZone(player, selection, onSelect)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-orange ${
            selection.activeZoneIds.has("orange") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Orange" count={`${player.sheet.orange.values.length}/${ORANGE_TRACK_LENGTH}`} tone="orange" />
          {renderOrangeZone(player, selection, onSelect, orangePreviewValue)}
        </section>

        <section
          className={`score-sheet-zone score-sheet-zone-purple ${
            selection.activeZoneIds.has("purple") ? "score-sheet-zone-active" : ""
          }`}
        >
          <ZoneHeader label="Purple" count={`${player.sheet.purple.values.length}/${PURPLE_TRACK_LENGTH}`} tone="purple" />
          {renderPurpleZone(player, selection, onSelect, purplePreviewValue)}
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

function ScoreSheetChrome() {
  return (
    <div className="score-sheet-board-chrome" aria-hidden="true">
      <svg viewBox="0 0 1200 980" preserveAspectRatio="none" className="score-sheet-board-chrome-svg">
        <rect x="16" y="16" width="1168" height="948" rx="34" className="score-sheet-chrome-outer" />
        <rect x="38" y="38" width="1124" height="904" rx="28" className="score-sheet-chrome-inner" />
        <path d="M70 142h1060" className="score-sheet-chrome-rule" />
        <path d="M70 844h1060" className="score-sheet-chrome-rule" />
        <path d="M598 38v106" className="score-sheet-chrome-rule-faint" />
        <circle cx="96" cy="96" r="8" className="score-sheet-chrome-dot" />
        <circle cx="1104" cy="96" r="8" className="score-sheet-chrome-dot" />
        <circle cx="96" cy="884" r="8" className="score-sheet-chrome-dot" />
        <circle cx="1104" cy="884" r="8" className="score-sheet-chrome-dot" />
      </svg>
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
      <svg viewBox="0 0 24 24" className="sheet-reward-glyph-svg" aria-hidden="true">
        <path d="M6 6 18 18" />
        <path d="M18 6 6 18" />
      </svg>
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

function renderYellowZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
  onSelect: (placement: SheetPlacement) => void,
) {
  const marked = new Set(player.sheet.yellow.markedCellIds);
  const completedRows = new Set(
    YELLOW_DISPLAY_GRID.map((row, rowIndex) => {
      const fillable = row.filter((entry) => entry.kind === "fillable");
      return fillable.every((entry) => marked.has(entry.cellId)) ? rowIndex + 1 : null;
    }).filter((value): value is number => value !== null),
  );

  return (
    <div className="yellow-sheet-frame">
      <div className="yellow-sheet-visual">
        <div className="yellow-grid-shell">
          <YellowGridBackdrop />
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
                        <span className="yellow-cell-mark">X</span>
                      </div>
                    </div>
                  );
                }

                const isMarked = marked.has(entry.cellId);
                const isActionable = selection.activeYellowCellIds.has(entry.cellId);
                const printedValue = YELLOW_VALUE_BY_CELL[entry.cellId];

                return (
                  <div
                    key={entry.cellId}
                    className="yellow-slot"
                  >
                    <button
                      className={`sheet-cell yellow-cell-face ${isMarked ? "yellow-cell-filled" : ""} ${
                        isActionable ? "sheet-cell-actionable" : ""
                      }`}
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
                          <span className="yellow-cell-cross">X</span>
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
            <div key={score} className="yellow-score-chip" title={`Yellow column ${index + 1} scores ${score}`}>
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
  onSelect: (placement: SheetPlacement) => void,
) {
  const marked = new Set(player.sheet.blue.markedCellIds);
  const filledCount = player.sheet.blue.markedCellIds.length;
  const completedRows = new Set(
    BLUE_DISPLAY_GRID.map((row, rowIndex) => {
      const fillable = row.filter((entry) => entry.kind === "fillable");
      return fillable.every((entry) => marked.has(entry.cellId)) ? rowIndex + 1 : null;
    }).filter((value): value is number => value !== null),
  );
  const completedColumns = new Set(
    [1, 2, 3, 4].filter((column) =>
      BLUE_DISPLAY_GRID.every((row) => {
        const entry = row[column - 1];
        return entry.kind !== "fillable" || marked.has(entry.cellId);
      }),
    ),
  );

  return (
    <div className="blue-sheet-frame">
      <div className="blue-score-track">
        {BLUE_SCORE_TRACK.map((score, index) => (
          <div
            key={score}
            className={`blue-score-node ${index < filledCount ? "blue-score-node-filled" : ""}`}
            title={`Blue score step ${index + 1}`}
          >
            {score}
          </div>
        ))}
      </div>
      <div className="blue-count-track">
        {BLUE_COUNT_TRACK.map((count) => (
          <span key={count} className="blue-count-label">
            {count}
          </span>
        ))}
      </div>
      <div className="blue-sheet-visual">
        <div className="blue-grid-shell">
          <BlueGridBackdrop />
          <div className="sheet-grid blue-grid">
            {BLUE_DISPLAY_GRID.flatMap((row) =>
              row.map((entry) => {
                if (entry.kind === "formula") {
                  return (
                    <div key={entry.id} className="blue-formula-tile" title="Blue die plus white die">
                      <span className="blue-formula-die blue-formula-die-blue" />
                      <span className="blue-formula-plus">+</span>
                      <span className="blue-formula-die blue-formula-die-white" />
                    </div>
                  );
                }

                const isMarked = marked.has(entry.cellId);
                const isActionable = selection.activeBlueCellIds.has(entry.cellId);
                const sum = BLUE_SUM_BY_CELL[entry.cellId];

                return (
                  <button
                    key={entry.cellId}
                    className={`sheet-cell blue-sum-cell ${isMarked ? "blue-sum-cell-filled" : ""} ${
                      isActionable ? "sheet-cell-actionable" : ""
                    }`}
                    title={
                      isMarked
                        ? `Blue sum ${sum} already crossed off`
                        : isActionable
                          ? `Cross off blue sum ${sum}`
                          : `Blue sum ${sum} is not available right now`
                    }
                    onClick={() => onSelect({ zone: "blue", cellId: entry.cellId })}
                    disabled={!isActionable}
                  >
                    {isMarked ? (
                      <>
                        <span className="blue-sum-number blue-sum-number-crossed">{sum}</span>
                        <span className="blue-sum-cross">X</span>
                      </>
                    ) : (
                      <span className="blue-sum-number">{sum}</span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <div className="blue-reward-rail">
          {BLUE_ROW_REWARD_DISPLAY.map((reward) => (
            <div
              key={reward.row}
              className={`blue-reward-pill ${reward.tone} ${
                completedRows.has(reward.row) ? "blue-reward-pill-claimed" : ""
              }`}
              title={`Blue row ${reward.row} reward`}
            >
              <span className="blue-reward-pill-label">
                <RewardGlyph token={reward.label} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="blue-bottom-row blue-bottom-row-sheet">
        {BLUE_COLUMN_REWARD_DISPLAY.map((reward) => (
          <div
            key={reward.column}
            className={`blue-bottom-reward ${reward.tone} ${
              completedColumns.has(reward.column) ? "blue-reward-pill-claimed" : ""
            }`}
            style={{ gridColumn: String(reward.column) }}
            title={`Blue column ${reward.column} reward`}
          >
            <span className="blue-reward-pill-label">
              <RewardGlyph token={reward.label} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YellowGridBackdrop() {
  return (
    <div className="yellow-grid-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="yellow-grid-backdrop-svg">
        <path d="M12 12H88V88" className="yellow-grid-backdrop-stroke" />
        <path d="M12 32H68" className="yellow-grid-backdrop-stroke" />
        <path d="M32 12V68" className="yellow-grid-backdrop-stroke" />
        <path d="M12 52H48" className="yellow-grid-backdrop-stroke" />
        <path d="M52 32V88" className="yellow-grid-backdrop-stroke" />
        <path d="M32 72H88" className="yellow-grid-backdrop-stroke" />
        <path d="M72 12V48" className="yellow-grid-backdrop-stroke" />
      </svg>
    </div>
  );
}

function BlueGridBackdrop() {
  return (
    <div className="blue-grid-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 78" preserveAspectRatio="none" className="blue-grid-backdrop-svg">
        <rect x="5" y="5" width="90" height="68" rx="12" className="blue-grid-backdrop-frame" />
        <path d="M30 5V73" className="blue-grid-backdrop-line" />
        <path d="M52.5 5V73" className="blue-grid-backdrop-line" />
        <path d="M75 5V73" className="blue-grid-backdrop-line" />
        <path d="M5 27.7H95" className="blue-grid-backdrop-line" />
        <path d="M5 50.3H95" className="blue-grid-backdrop-line" />
        <circle cx="16" cy="16" r="3.2" className="blue-grid-backdrop-dot" />
        <circle cx="84" cy="16" r="3.2" className="blue-grid-backdrop-dot" />
        <circle cx="16" cy="62" r="3.2" className="blue-grid-backdrop-dot" />
        <circle cx="84" cy="62" r="3.2" className="blue-grid-backdrop-dot" />
      </svg>
    </div>
  );
}

function renderGreenZone(
  player: PlayerSheetSnapshot,
  selection: ScoreSheetBoardSelection,
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

              return (
                <button
                  key={key}
                  className={`green-threshold-cell ${isFilled ? "green-threshold-cell-filled" : ""} ${
                    isActionable ? "sheet-cell-actionable" : ""
                  }`}
                  title={
                    isFilled
                      ? `Green threshold ${value} already filled`
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
  onSelect: (placement: SheetPlacement) => void,
  previewValue: number | null,
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
              const multiplier = ORANGE_MULTIPLIER_MARKERS.find((marker) => marker.index === index + 1);

              return (
                <div key={`orange-${index}`} className="orange-slot-wrap">
                  <button
                    className={`orange-slot-cell ${isFilled ? "orange-slot-cell-filled" : ""} ${
                      isActionable ? "sheet-cell-actionable" : ""
                    }`}
                    title={
                      isFilled
                        ? `Orange slot ${index + 1} contains ${value}`
                        : isActionable
                          ? `Write ${previewValue ?? "the current value"} in orange`
                          : `Orange slot ${index + 1} is not available right now`
                    }
                    onClick={() => onSelect({ zone: "orange" })}
                    disabled={!isActionable}
                  >
                    {isFilled ? value : isActionable && typeof previewValue === "number" ? previewValue : ""}
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
  onSelect: (placement: SheetPlacement) => void,
  previewValue: number | null,
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

              return (
                <button
                  key={`purple-${index}`}
                  className={`purple-slot-cell ${isFilled ? "purple-slot-cell-filled" : ""} ${
                    isActionable ? "sheet-cell-actionable" : ""
                  }`}
                  title={
                    isFilled
                      ? `Purple slot ${index + 1} contains ${value}`
                      : isActionable
                        ? `Write ${previewValue ?? "the current value"} in purple`
                        : `Purple slot ${index + 1} is not available right now`
                  }
                  onClick={() => onSelect({ zone: "purple" })}
                  disabled={!isActionable}
                >
                  {isFilled ? (
                    <span className="purple-slot-value">{value}</span>
                  ) : isActionable && typeof previewValue === "number" ? (
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
