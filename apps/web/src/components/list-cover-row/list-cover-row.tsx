import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./list-cover-row.module.css";

export type ListCoverRowProps = {
  href: string;
  coverImage?: string | null;
  /** Erişilebilir etiket (başlık) */
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Liste satırı linki — hover/focus’ta kapak görseli satır kutusunu doldurur.
 */
export function ListCoverRow({
  href,
  coverImage,
  ariaLabel,
  className,
  children,
}: ListCoverRowProps) {
  return (
    <Link
      href={href}
      className={[styles.row, className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      <span className={styles.cover} aria-hidden>
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" loading="lazy" />
        ) : (
          <span className={styles.ph} />
        )}
      </span>
      {children}
    </Link>
  );
}
