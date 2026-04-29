import { scorePlayerSheet, type PlayerSheetSnapshot } from "@clever/game-core";
import type { RoomSummary } from "@clever/shared";
import styles from "./OpponentSheetTab.module.css";

interface OpponentSheetTabProps {
  player: PlayerSheetSnapshot;
  nickname: string;
  room: RoomSummary | null;
}

export function OpponentSheetTab({ player, nickname, room }: OpponentSheetTabProps) {
  const breakdown = scorePlayerSheet(player.sheet);
  const roomPlayer = room?.players.find((p) => p.id === player.playerId);

  return (
    <div className={styles.opponentSheet}>
      <div className={styles.head}>
        <h3 className={styles.name}>{nickname || roomPlayer?.nickname || player.playerId}</h3>
        <span className={styles.totalScore}>{breakdown.total}</span>
      </div>

      <div className={styles.zones}>
        <ZoneRow label="Yellow" tone="yellow" filled={player.sheet.yellow.markedCellIds.length} total={16} score={breakdown.yellow} />
        <ZoneRow label="Blue" tone="blue" filled={player.sheet.blue.markedCellIds.length} total={20} score={breakdown.blue} />
        <ZoneRow label="Green" tone="green" filled={player.sheet.green.filledThresholds.length} total={11} score={breakdown.green} />
        <ZoneRow label="Orange" tone="orange" filled={player.sheet.orange.values.length} total={11} score={breakdown.orange} />
        <ZoneRow label="Purple" tone="purple" filled={player.sheet.purple.values.length} total={11} score={breakdown.purple} />
      </div>

      <div className={styles.resources}>
        <ResourceBadge label="Fox" value={player.sheet.resources.foxes} />
        <ResourceBadge label="Reroll" value={player.sheet.resources.rerolls} />
        <ResourceBadge label="Extra" value={player.sheet.resources.extraDice} />
        <ResourceBadge label="Pending" value={player.sheet.pendingBonuses.length} />
      </div>

      <div className={styles.foxNote}>
        Fox: {breakdown.fox} ({player.sheet.resources.foxes} × multiplier)
      </div>
    </div>
  );
}

function ZoneRow({
  label,
  tone,
  filled,
  total,
  score,
}: {
  label: string;
  tone: string;
  filled: number;
  total: number;
  score: number;
}) {
  return (
    <div className={`${styles.zoneRow} ${styles[`zoneRow${tone}`]}`}>
      <span className={styles.zoneLabel}>{label}</span>
      <span className={styles.zoneProgress}>
        <span className={styles.zoneFilled}>{filled}</span>
        <span className={styles.zoneSep}>/</span>
        <span className={styles.zoneTotal}>{total}</span>
      </span>
      <span className={styles.zoneScore}>{score}</span>
    </div>
  );
}

function ResourceBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.resourceBadge}>
      <span className={styles.resourceLabel}>{label}</span>
      <strong className={styles.resourceValue}>{value}</strong>
    </div>
  );
}
