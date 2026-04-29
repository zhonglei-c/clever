interface ZoneHeaderProps {
  label: string;
  count: string;
  tone: "yellow" | "blue" | "green" | "orange" | "purple";
}

export function ZoneHeader({ label, count, tone }: ZoneHeaderProps) {
  return (
    <div className={`score-sheet-zone-head score-sheet-zone-head-${tone}`}>
      <div className="score-sheet-zone-headline">
        <span className={`score-sheet-zone-badge score-sheet-zone-badge-${tone}`} aria-hidden="true" />
        <h2>{label}</h2>
      </div>
      <span className="score-sheet-zone-counter">{count}</span>
    </div>
  );
}
