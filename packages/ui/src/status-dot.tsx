import type { HTMLAttributes } from "react";
import { cn } from "./lib/cn";
import styles from "./status-dot.module.css";

export type StatusDotTone = "ok" | "warn" | "danger" | "muted" | "info";

export type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusDotTone;
  label: string;
  /** Yalnız nokta (görsel); label ekran okuyucuya */
  showLabel?: boolean;
};

/** Yayın durumu — küçük nokta + metin (admin listeleri) */
export function StatusDot({
  tone = "muted",
  label,
  showLabel = true,
  className,
  ...props
}: StatusDotProps) {
  return (
    <span className={cn(styles.root, styles[tone], className)} {...props}>
      <i className={styles.dot} aria-hidden />
      {showLabel ? <span className={styles.label}>{label}</span> : null}
      {!showLabel ? <span className="yh-sr-only">{label}</span> : null}
    </span>
  );
}
