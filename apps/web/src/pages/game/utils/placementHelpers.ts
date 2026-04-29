import type { SheetPlacement } from "@clever/game-core";
import type { SheetSelectionState } from "../scoreSheetSelection";

export function getLegalPlacements(selection: SheetSelectionState): SheetPlacement[] {
  const placements: SheetPlacement[] = [];

  selection.activeYellowCellIds.forEach((cellId) => {
    placements.push({ zone: "yellow", cellId });
  });

  selection.activeBlueCellIds.forEach((cellId) => {
    placements.push({ zone: "blue", cellId });
  });

  if (selection.activeGreen) {
    placements.push({ zone: "green" });
  }

  if (selection.activeOrange) {
    placements.push({ zone: "orange" });
  }

  if (selection.activePurple) {
    placements.push({ zone: "purple" });
  }

  return placements;
}

export function isSamePlacement(left: SheetPlacement, right: SheetPlacement) {
  return left.zone === right.zone && getPlacementCellId(left) === getPlacementCellId(right);
}

export function describePlacement(placement: SheetPlacement) {
  const cellId = getPlacementCellId(placement);

  switch (placement.zone) {
    case "yellow":
      return `黄色区域${cellId ? ` ${cellId}` : ""}`;
    case "blue":
      return `蓝色区域${cellId ? ` ${cellId}` : ""}`;
    case "green":
      return "绿色下一格";
    case "orange":
      return "橙色下一格";
    case "purple":
      return "紫色下一格";
    default:
      return "当前落点";
  }
}

export function getPlacementCellId(placement: SheetPlacement) {
  return "cellId" in placement ? placement.cellId : null;
}
