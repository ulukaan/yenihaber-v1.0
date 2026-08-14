import type { CSSProperties, ReactNode } from "react";
import { cn } from "./lib/cn";
import { MetaLine } from "./meta-line";
import { Tag } from "./tag";
import styles from "./article-card.module.css";

export type ArticleCardVariant = "lead" | "row" | "compact";

export type ArticleCardProps = {
  href: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  categoryName?: string | null;
  /** Kategori aksanı — etiket + hover kutu rengi */
  categoryAccent?: string | null;
  meta?: ReactNode;
  variant?: ArticleCardVariant;
  index?: number;
  className?: string;
  linkComponent?: "a";
};

/**
 * Haber kartı — ince nötr kutu; kategori rengi hover’da.
 */
export function ArticleCard({
  href,
  title,
  excerpt,
  coverImage,
  categoryName,
  categoryAccent,
  meta,
  variant = "row",
  index,
  className,
}: ArticleCardProps) {
  const isLead = variant === "lead";
  const isCompact = variant === "compact";
  const accent =
    categoryAccent?.trim().startsWith("#") ? categoryAccent.trim() : null;

  return (
    <a
      href={href}
      className={cn(
        styles.card,
        isLead && styles.lead,
        isCompact && styles.compact,
        !isLead && !isCompact && styles.row,
        accent && styles.tinted,
        className,
      )}
      style={
        accent
          ? ({ ["--card-accent" as string]: accent } as CSSProperties)
          : undefined
      }
      aria-label={title}
    >
      {coverImage !== undefined ? (
        <span
          className={styles.media}
          aria-hidden={coverImage ? undefined : true}
        >
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt="" loading="lazy" />
          ) : (
            <span className={styles.ph} />
          )}
        </span>
      ) : null}

      <span className={styles.body}>
        {categoryName || index != null ? (
          <span className={styles.top}>
            {index != null ? (
              <span className={styles.index} aria-hidden>
                {String(index).padStart(2, "0")}
              </span>
            ) : null}
            {categoryName ? (
              <Tag
                tone={accent ? "accent" : "muted"}
                accentColor={accent}
              >
                {categoryName}
              </Tag>
            ) : null}
          </span>
        ) : null}

        <h3 className={styles.title}>{title}</h3>

        {excerpt && !isCompact ? (
          <p className={styles.excerpt}>{excerpt}</p>
        ) : null}

        {meta ? <MetaLine className={styles.meta}>{meta}</MetaLine> : null}
      </span>
    </a>
  );
}
