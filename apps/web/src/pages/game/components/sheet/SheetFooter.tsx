import type { PlayerScoreBreakdown } from "@clever/game-core";
import { ScoreBox } from "./ScoreBox";

interface SheetFooterProps {
  breakdown: PlayerScoreBreakdown;
}

export function SheetFooter({ breakdown }: SheetFooterProps) {
  return (
    <footer className="score-sheet-footer">
      <div className="score-sheet-score-strip">
        <ScoreBox label="Y" value={breakdown.yellow} tone="yellow" />
        <ScoreBox label="B" value={breakdown.blue} tone="blue" />
        <ScoreBox label="G" value={breakdown.green} tone="green" />
        <ScoreBox label="O" value={breakdown.orange} tone="orange" />
        <ScoreBox label="P" value={breakdown.purple} tone="purple" />
        <ScoreBox label="FOX" value={breakdown.fox} tone="fox" />
      </div>
      <div className="score-sheet-total-box">
        <span className="score-sheet-total-label">Total</span>
        <strong className="score-sheet-total-value">{breakdown.total}</strong>
      </div>
    </footer>
  );
}
