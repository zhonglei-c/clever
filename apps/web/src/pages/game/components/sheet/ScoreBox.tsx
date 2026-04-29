interface ScoreBoxProps {
  label: string;
  value: number;
  tone: "yellow" | "blue" | "green" | "orange" | "purple" | "fox";
}

export function ScoreBox({ label, value, tone }: ScoreBoxProps) {
  return (
    <div className={`score-sheet-score-box score-sheet-score-box-${tone}`}>
      <span className="score-sheet-score-box-label">{label}</span>
      <strong className="score-sheet-score-box-value">{value}</strong>
    </div>
  );
}
