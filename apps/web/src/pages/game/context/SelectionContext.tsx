import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { GameStateSnapshot, PlayerSheetSnapshot, SheetPlacement } from "@clever/game-core";
import {
  buildSheetSelection,
  emptySheetSelection,
  getPlacementPreviewValue,
  hasAnyLegalTarget,
  type SelectedIntent,
  type SheetSelectionState,
} from "../scoreSheetSelection";
import { getLegalPlacements, isSamePlacement } from "../utils/placementHelpers";

interface SelectionContextValue {
  selectedIntent: SelectedIntent | null;
  pendingPlacement: SheetPlacement | null;
  sheetSelection: SheetSelectionState;
  pendingPlacementValue: number | null;
  selectedIntentPlacements: SheetPlacement[];
  selectedIntentHasLegalTarget: boolean;
  setSelectedIntent: (intent: SelectedIntent | null) => void;
  setPendingPlacement: (placement: SheetPlacement | null) => void;
  clearSelection: () => void;
  handleSheetPlacement: (placement: SheetPlacement) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({
  gameState,
  mySheet,
  resetToken,
  children,
}: {
  gameState: GameStateSnapshot | null;
  mySheet: PlayerSheetSnapshot | null;
  resetToken: number;
  children: React.ReactNode;
}) {
  const [selectedIntent, setSelectedIntent] = useState<SelectedIntent | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<SheetPlacement | null>(null);

  const sheetSelection = useMemo(
    () => (gameState && mySheet ? buildSheetSelection(selectedIntent, gameState, mySheet) : emptySheetSelection()),
    [gameState, mySheet, selectedIntent],
  );

  const selectedIntentHasLegalTarget = hasAnyLegalTarget(sheetSelection);

  const selectedIntentPlacements = useMemo(
    () => getLegalPlacements(sheetSelection),
    [sheetSelection],
  );

  const pendingPlacementValue = useMemo(
    () => getPlacementPreviewValue(pendingPlacement, selectedIntent, gameState),
    [gameState, pendingPlacement, selectedIntent],
  );

  const clearSelection = useCallback(() => {
    setSelectedIntent(null);
    setPendingPlacement(null);
  }, []);

  const handleSheetPlacement = useCallback(
    (placement: SheetPlacement) => {
      if (selectedIntent) setPendingPlacement(placement);
    },
    [selectedIntent],
  );

  useEffect(() => {
    clearSelection();
  }, [resetToken, clearSelection]);

  useEffect(() => {
    if (!selectedIntent) {
      if (pendingPlacement) setPendingPlacement(null);
      return;
    }
    if (pendingPlacement && !selectedIntentPlacements.some((p) => isSamePlacement(p, pendingPlacement))) {
      setPendingPlacement(null);
    }
  }, [selectedIntent, pendingPlacement, selectedIntentPlacements]);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selectedIntent,
      pendingPlacement,
      sheetSelection,
      pendingPlacementValue,
      selectedIntentPlacements,
      selectedIntentHasLegalTarget,
      setSelectedIntent,
      setPendingPlacement,
      clearSelection,
      handleSheetPlacement,
    }),
    [
      selectedIntent,
      pendingPlacement,
      sheetSelection,
      pendingPlacementValue,
      selectedIntentPlacements,
      selectedIntentHasLegalTarget,
      clearSelection,
      handleSheetPlacement,
    ],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("useSelection must be used within SelectionProvider");
  return context;
}
