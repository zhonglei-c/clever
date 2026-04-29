import styles from "./FinalStandings.module.css";
import type { FinalStanding as FinalStandingType } from "@clever/game-core";
import type { RoomSummary } from "@clever/shared";

interface FinalStandingsProps {
  standings: FinalStandingType[];
  room: RoomSummary | null;
}

export function FinalStandings({ standings, room }: FinalStandingsProps) {
  return (
    <div className={styles.standings}>
      <h3>最终排名</h3>
      {standings.map((standing) => {
        const player = room?.players.find((entry) => entry.id === standing.playerId);
        return (
          <div key={standing.playerId} className={styles.standingRow}>
            <span className={styles.rank}>#{standing.rank}</span>
            <span>{player?.nickname ?? standing.playerId}</span>
            <span className={styles.score}>{standing.totalScore}</span>
          </div>
        );
      })}
    </div>
  );
}
