import { BLUE_CONNECTOR_DISPLAY } from "@clever/game-core";

export function BlueBoardBackdrop() {
  const cellCenterX = (column: number) => (column - 0.5) * 20;
  const cellCenterY = (row: number) => (row - 0.5) * 25;

  return (
    <div className="blue-board-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="blue-board-backdrop-svg">
        <rect x="2" y="2" width="76" height="71" rx="11" className="blue-board-backdrop-main" />
        <rect x="82" y="6" width="16" height="63" rx="8.5" className="blue-board-backdrop-rail" />
        <rect x="2" y="77" width="76" height="21" rx="10.5" className="blue-board-backdrop-bottom" />
        {BLUE_CONNECTOR_DISPLAY.map((connector) => {
          const x1 = cellCenterX(connector.fromColumn);
          const y1 = cellCenterY(connector.fromRow);
          const x2 = cellCenterX(connector.toColumn);
          const y2 = cellCenterY(connector.toRow);

          if (connector.axis === "row") {
            return (
              <g key={connector.id} className="blue-board-backdrop-connector">
                <path d={`M ${x1} ${y1} H ${x2 - 3.4}`} className="blue-board-backdrop-line" />
                <path d={`M ${x2 - 6.8} ${y2 - 4.8} L ${x2} ${y2} L ${x2 - 6.8} ${y2 + 4.8}`} className="blue-board-backdrop-arrow" />
              </g>
            );
          }

          return (
            <g key={connector.id} className="blue-board-backdrop-connector">
              <path d={`M ${x1} ${y1} V ${y2 - 3.8}`} className="blue-board-backdrop-line" />
              <path d={`M ${x2 - 4.6} ${y2 - 7.2} L ${x2} ${y2} L ${x2 + 4.6} ${y2 - 7.2}`} className="blue-board-backdrop-arrow" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
