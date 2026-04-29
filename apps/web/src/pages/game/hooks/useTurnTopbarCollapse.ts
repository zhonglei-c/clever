import { useEffect, useRef, useState } from "react";

export function useTurnTopbarCollapse(shouldShowTurnTopbar: boolean) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const previousVisibleRef = useRef(false);

  useEffect(() => {
    if (shouldShowTurnTopbar && !previousVisibleRef.current) {
      setIsCollapsed(false);
    }
    previousVisibleRef.current = shouldShowTurnTopbar;
  }, [shouldShowTurnTopbar]);

  return {
    isCollapsed,
    toggle: () => setIsCollapsed((current) => !current),
  };
}
