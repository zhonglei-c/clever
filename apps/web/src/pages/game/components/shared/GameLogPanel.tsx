import styles from "./GameLogPanel.module.css";
import type { GameLogEntry } from "@clever/game-core";

interface GameLogPanelProps {
  logs?: GameLogEntry[];
  limit?: number;
  title?: string;
}

export function GameLogPanel({ logs, limit = 5, title = "最近日志" }: GameLogPanelProps) {
  const entries = (logs ?? []).slice(-limit).reverse();

  return (
    <article className="panel game-log-panel">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="helper-copy">暂无日志</p>
      ) : (
        <div className={styles.logList}>
          {entries.map((entry) => (
            <div key={entry.id} className={styles.logItem}>
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
