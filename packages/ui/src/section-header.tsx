import type { ReactNode } from "react";
import { cn } from "./lib/cn";
import styles from "./section-header.module.css";

export type SectionHeaderProps = {
  title: string;
  titleId?: string;
  href?: string;
  moreLabel?: string;
  /** Daha fazla linki (Next Link vs a) — children yerine moreSlot */
  more?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  /** bar: sol 3px; underline: başlık altı 3px (şerit kuralı) */
  accent?: "bar" | "underline";
};

/**
 * Bölüm başlığı — aksan çubuk veya alt çizgi + serif başlık.
 */
export function SectionHeader({
  title,
  titleId,
  href,
  moreLabel = "Tümü",
  more,
  className,
  as: Tag = "h2",
  accent = "bar",
}: SectionHeaderProps) {
  return (
    <header className={cn(styles.head, className)}>
      <Tag
        id={titleId}
        className={cn(
          styles.title,
          accent === "underline" && styles.titleUnderline,
        )}
      >
        {accent === "bar" ? <span className={styles.bar} aria-hidden /> : null}
        {href ? (
          <a href={href} className={styles.titleLink}>
            <span className={styles.titleText}>{title}</span>
          </a>
        ) : (
          <span className={styles.titleText}>{title}</span>
        )}
      </Tag>
      {more ??
        (href ? (
          <a href={href} className={styles.more}>
            {moreLabel}
            <span className={styles.moreArrow} aria-hidden>
              →
            </span>
          </a>
        ) : null)}
    </header>
  );
}
