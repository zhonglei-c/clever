import { useLayoutEffect, useEffect, useRef, useState } from "react";

export interface SheetViewportScaling {
  scale: number;
  height: number | null;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  scheduleUpdate: () => void;
}

export function useSheetViewportScaling(): SheetViewportScaling {
  const [metrics, setMetrics] = useState<{ scale: number; height: number | null }>({
    scale: 1,
    height: null,
  });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const scheduleUpdateRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameId = 0;
    const resizeObserver = new ResizeObserver(() => {
      scheduleUpdate();
    });

    const updateBoardStageMetrics = () => {
      frameId = 0;

      const viewport = viewportRef.current;
      const content = contentRef.current;

      if (!viewport || !content || window.innerWidth <= 900) {
        setMetrics((current) =>
          current.scale === 1 && current.height === null ? current : { scale: 1, height: null },
        );
        return;
      }

      const rawHeight = content.offsetHeight;
      const viewportTop = viewport.getBoundingClientRect().top;
      const availableHeight = Math.max(0, window.innerHeight - viewportTop - 28);

      if (!rawHeight || !availableHeight) {
        return;
      }

      const nextScale = Math.min(1, availableHeight / rawHeight);
      const nextHeight = Math.ceil(rawHeight * nextScale);

      setMetrics((current) => {
        const scaleChanged = Math.abs(current.scale - nextScale) > 0.01;
        const heightChanged = current.height !== nextHeight;
        if (!scaleChanged && !heightChanged) return current;
        return { scale: nextScale, height: nextHeight };
      });
    };

    function scheduleUpdate() {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateBoardStageMetrics);
    }

    scheduleUpdateRef.current = scheduleUpdate;

    if (viewportRef.current) {
      resizeObserver.observe(viewportRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      scheduleUpdateRef.current = null;
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
    };
  }, []);

  return {
    scale: metrics.scale,
    height: metrics.height,
    viewportRef,
    contentRef,
    scheduleUpdate: () => scheduleUpdateRef.current?.(),
  };
}
