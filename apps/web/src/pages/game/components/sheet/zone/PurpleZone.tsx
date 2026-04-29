import {
  PURPLE_REWARD_MARKERS,
  PURPLE_TRACK_LENGTH,
  type PlayerSheetSnapshot,
  type SheetPlacement,
} from "@clever/game-core";
import type { SheetSelectionState } from "../../../scoreSheetSelection";
import { RewardGlyph } from "../glyphs/RewardGlyph";
import { getLinearTrackMarkerStyle } from "../ResourceTrack";
import { PurpleTrackBackdrop } from "../backdrops/GreenTrackBackdrop";
import { ZoneHeader } from "../ZoneHeader";

interface PurpleZoneProps {
  player: PlayerSheetSnapshot;
  selection: SheetSelectionState;
  previewPlacement: SheetPlacement | null;
  previewValue: number | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function PurpleZone({ player, selection, previewPlacement, previewValue, onSelect }: PurpleZoneProps) {
  const values = player.sheet.purple.values;
  const nextIndex = values.length;

  return (
    <section
      className={`score-sheet-zone score-sheet-zone-purple ${
        selection.activeZoneIds.has("purple") ? "score-sheet-zone-active" : ""
      }`}
    >
      <ZoneHeader label="Purple" count={`${player.sheet.purple.values.length}/${PURPLE_TRACK_LENGTH}`} tone="purple" />
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
                const isPreviewed =
                  !isFilled && index === nextIndex && previewPlacement?.zone === "purple";

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
                className={`purple-reward-token linear-track-marker ${marker.tone} ${
                  nextIndex >= marker.index ? "sheet-reward-claimed" : ""
                }`}
                style={getLinearTrackMarkerStyle(marker.index, PURPLE_TRACK_LENGTH)}
                title={`Purple milestone reward ${marker.label}`}
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
