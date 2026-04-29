import styles from "./DiceCard.module.css";
import type { DieValue } from "@clever/shared";

export type DiceCardVariant = "default" | "square";
export type DiceCardState = "default" | "selected" | "blocked" | "locked";

interface DiceCardProps {
  die: DieValue;
  variant?: DiceCardVariant;
  state?: DiceCardState;
  actionable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}

const stateClass: Record<DiceCardState, string> = {
  default: "",
  selected: styles.selected,
  blocked: styles.blocked,
  locked: styles.locked,
};

export function DiceCard({
  die,
  variant = "default",
  state = "default",
  actionable = false,
  disabled = false,
  onClick,
  title,
}: DiceCardProps) {
  const classNames = [
    styles.dieCard,
    variant === "square" ? styles.square : "",
    styles[die.color as keyof typeof styles] ?? "",
    actionable ? styles.actionable : "",
    stateClass[state],
  ].filter(Boolean).join(" ");

  if (onClick) {
    return (
      <button className={classNames} onClick={onClick} disabled={disabled} title={title}>
        <span>{die.value}</span>
      </button>
    );
  }

  return (
    <div className={classNames} title={title}>
      <span>{die.value}</span>
    </div>
  );
}
