import styles from "./ErrorBanner.module.css";

interface ErrorBannerProps {
  message: string;
  className?: string;
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  return <p className={[styles.banner, className].filter(Boolean).join(" ")}>{message}</p>;
}

interface InfoBannerProps {
  children: React.ReactNode;
  className?: string;
}

export function InfoBanner({ children, className }: InfoBannerProps) {
  return <div className={[styles.info, className].filter(Boolean).join(" ")}>{children}</div>;
}
