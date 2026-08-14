import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./lib/cn";
import styles from "./badge.module.css";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "accent" | "muted" | "success" | "warning";
};

export function Badge({
  children,
  className,
  tone = "accent",
  ...props
}: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], className)} {...props}>
      {children}
    </span>
  );
}
