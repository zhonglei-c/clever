import { scorePlayerSheet, type PlayerSheetSnapshot, type SheetPlacement } from "@clever/game-core";
import type { DieValue } from "@clever/shared";
import type { SheetSelectionState } from "../../scoreSheetSelection";
import { SheetHeader } from "./SheetHeader";
import { SheetFooter } from "./SheetFooter";
import { YellowZone } from "./zone/YellowZone";
import { BlueZone } from "./zone/BlueZone";
import { GreenZone } from "./zone/GreenZone";
import { OrangeZone } from "./zone/OrangeZone";
import { PurpleZone } from "./zone/PurpleZone";

interface MyScoreSheetProps {
  player: PlayerSheetSnapshot;
  activeSelections: DieValue[];
  currentRound: number;
  totalRounds: number;
  selection: SheetSelectionState;
  previewPlacement: SheetPlacement | null;
  previewValue: number | null;
  onSelect: (placement: SheetPlacement) => void;
}

export function MyScoreSheet({
  player,
  activeSelections,
  currentRound,
  totalRounds,
  selection,
  previewPlacement,
  previewValue,
  onSelect,
}: MyScoreSheetProps) {
  const breakdown = scorePlayerSheet(player.sheet);

  return (
    <div className="score-sheet-board">
      <div className="score-sheet-board-content">
        <SheetHeader
          player={player}
          activeSelections={activeSelections}
          currentRound={currentRound}
          totalRounds={totalRounds}
        />

        <YellowZone player={player} selection={selection} previewPlacement={previewPlacement} onSelect={onSelect} />
        <BlueZone player={player} selection={selection} previewPlacement={previewPlacement} onSelect={onSelect} />
        <GreenZone player={player} selection={selection} previewPlacement={previewPlacement} previewValue={previewValue} onSelect={onSelect} />
        <OrangeZone player={player} selection={selection} previewPlacement={previewPlacement} previewValue={previewValue} onSelect={onSelect} />
        <PurpleZone player={player} selection={selection} previewPlacement={previewPlacement} previewValue={previewValue} onSelect={onSelect} />

        <SheetFooter breakdown={breakdown} />
      </div>
    </div>
  );
}
