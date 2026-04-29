import {
  ORANGE_MULTIPLIER_MARKERS,
  ORANGE_REWARD_MARKERS,
  ORANGE_TRACK_LENGTH,
  type PlayerSheetSnapshot,
  type SheetPlacement,
} from "@clever/game-core";
import type { SheetSelectionState } from "../../../scoreSheetSelection";
import { RewardGlyph } from "../glyphs/RewardGlyph";
import { getLinearTrackMarkerStyle } from "../ResourceTrack";
import { OrangeTrackBackdrop } from "../backdrops/GreenTrackBackdrop";
import { ZoneHeader } from "../ZoneHeader";

interface OrangeZoneProps {
  player: PlayerSheetSnapshot;
  selection: SheetSelectionState;
  previewPlacement: SheetPlacement | null;
  previewValue: number | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function OrangeZone({ player, selection, previewPlacement, previewValue, onSelect }: OrangeZoneProps) {
  const values = player.sheet.orange.values;
  const nextIndex = values.length;

  return (
    <section
      className={`score-sheet-zone score-sheet-zone-orange ${
        selection.activeZoneIds.has("orange") ? "score-sheet-zone-active" : ""
      }`}
    >
      <ZoneHeader label="Orange" count={`${player.sheet.orange.values.length}/${ORANGE_TRACK_LENGTH}`} tone="orange" />
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
                const isPreviewed =
                  !isFilled && index === nextIndex && previewPlacement?.zone === "orange";

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
                  </div>
                );
              })}
            </div>
            <div className="orange-multiplier-grid" aria-hidden="true">
              {ORANGE_MULTIPLIER_MARKERS.map((marker) => (
                <span
                  key={`${marker.index}-${marker.label}`}
                  className="orange-multiplier linear-track-marker"
                  style={getLinearTrackMarkerStyle(marker.index, ORANGE_TRACK_LENGTH)}
                >
                  {marker.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="orange-reward-strip">
          <div className="orange-reward-spacer" aria-hidden="true" />
          <div className="orange-reward-grid">
            {ORANGE_REWARD_MARKERS.map((marker) => (
              <div
                key={`${marker.index}-${marker.label}`}
                className={`orange-reward-token linear-track-marker ${marker.tone} ${
                  nextIndex >= marker.index ? "sheet-reward-claimed" : ""
                }`}
                style={getLinearTrackMarkerStyle(marker.index, ORANGE_TRACK_LENGTH)}
                title={`Orange milestone reward ${marker.label}`}
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
