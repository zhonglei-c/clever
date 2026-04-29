import { type CSSProperties } from "react";
import { RewardGlyph } from "./glyphs/RewardGlyph";
import { SheetCrossGlyph } from "./glyphs/SheetCrossGlyph";

const RESOURCE_TRACK_BASE_SLOTS = 7;

interface ResourceTrackProps {
  label: string;
  title: string;
  accent: "reroll" | "plus";
  token: string;
  available: number;
  gained: number;
  spent: number;
}

export function ResourceTrack({
  label,
  title,
  accent,
  token,
  available,
  gained,
  spent,
}: ResourceTrackProps) {
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

export function getRoundRewardLabel(round: number) {
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

export function getLinearTrackMarkerStyle(index: number, trackLength: number): CSSProperties {
  const anchorColumn = Math.min(index, trackLength);
  const shift = index >= trackLength ? "50%" : "calc(50% + (var(--linear-track-gap) / 2))";

  return {
    gridColumn: String(anchorColumn),
    "--linear-marker-shift": shift,
  } as CSSProperties;
}
