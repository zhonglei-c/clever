import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "micro" | "micro-emphasis" | "micro-selected";

interface ButtonProps {
  variant: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  micro: styles.micro,
  "micro-emphasis": styles.microEmphasis,
  "micro-selected": styles.microSelected,
};

export function Button({ variant, disabled, onClick, className, title, children }: ButtonProps) {
  return (
    <button
      className={[styles.button, variantClass[variant], className].filter(Boolean).join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
