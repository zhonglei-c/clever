import type { DieValue } from "@clever/shared";
import type { SelectedIntent } from "../scoreSheetSelection";

export function isIntentSelected(
  intent: SelectedIntent | null,
  expectedKind: "active" | "passive",
  dieId: DieValue["id"],
) {
  return Boolean(intent && intent.kind === expectedKind && intent.die.id === dieId);
}
