import type { ReactNode } from "react";
import { cn } from "./lib/cn";
import styles from "./meta-line.module.css";

export type MetaLineProps = {
  children: ReactNode;
  className?: string;
  as?: "p" | "div" | "span" | "time";
  dateTime?: string;
};

/** Tarih · yazar · okuma süresi satırı — muted sans, 400 */
export function MetaLine({
  children,
  className,
  as: Tag = "p",
  dateTime,
}: MetaLineProps) {
  return (
    <Tag
      className={cn(styles.meta, className)}
      {...(Tag === "time" && dateTime ? { dateTime } : {})}
    >
      {children}
    </Tag>
  );
}
