import {
  GREEN_REWARD_MARKERS,
  GREEN_SCORE_TRACK,
  GREEN_THRESHOLD_TRACK,
  type PlayerSheetSnapshot,
  type SheetPlacement,
} from "@clever/game-core";
import type { SheetSelectionState } from "../../../scoreSheetSelection";
import { RewardGlyph } from "../glyphs/RewardGlyph";
import { getLinearTrackMarkerStyle } from "../ResourceTrack";
import { GreenTrackBackdrop } from "../backdrops/GreenTrackBackdrop";
import { ZoneHeader } from "../ZoneHeader";

interface GreenZoneProps {
  player: PlayerSheetSnapshot;
  selection: SheetSelectionState;
  previewPlacement: SheetPlacement | null;
  previewValue: number | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function GreenZone({ player, selection, previewPlacement, previewValue, onSelect }: GreenZoneProps) {
  const filled = new Set(player.sheet.green.filledThresholds.map((value, index) => `${value}-${index}`));
  const enteredValues = player.sheet.green.values ?? [];
  const nextIndex = player.sheet.green.filledThresholds.length;

  return (
    <section
      className={`score-sheet-zone score-sheet-zone-green ${
        selection.activeZoneIds.has("green") ? "score-sheet-zone-active" : ""
      }`}
    >
      <ZoneHeader label="Green" count={`${player.sheet.green.filledThresholds.length}/11`} tone="green" />
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
                const isPreviewed =
                  !isFilled && index === nextIndex &&
                  previewPlacement?.zone === "green";

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
                className={`green-reward-token linear-track-marker ${marker.tone} ${
                  nextIndex >= marker.index ? "sheet-reward-claimed" : ""
                }`}
                style={getLinearTrackMarkerStyle(marker.index, GREEN_THRESHOLD_TRACK.length)}
                title={`Green milestone reward ${marker.label}`}
              >
                <RewardGlyph token={marker.label} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
