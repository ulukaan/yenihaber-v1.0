import Link from "next/link";
import type { CSSProperties } from "react";
import type { ApiArticle } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import { ListCoverRow } from "@/components/list-cover-row/list-cover-row";
import { categoryThemeColor } from "@/lib/category-theme";
import styles from "./news-card.module.css";

export type NewsCardProps = {
  article: ApiArticle;
  /**
   * default — editöryal kart (görsel + serif başlık)
   * overlay — manşet / öne çıkan (kapak üstü)
   * numbered — çok okunanlar / sidebar
   * hero — büyük editöryal (3/2 + daha büyük başlık)
   * compact | rail — yatay mini (görsel + başlık, serif)
   * text — numaralı metin (numbered ile aynı hiyerarşi)
   */
  variant?: "default" | "compact" | "hero" | "overlay" | "rail" | "text";
  rank?: number;
  priority?: boolean;
  showByline?: boolean;
};

function creditLine(article: ApiArticle): string {
  const agency = article.sourceAgency?.trim();
  if (agency) return agency;
  return article.author.name;
}

/**
 * Haber kartı — ince nötr kutu; hover’da kategori rengi.
 * Hiyerarşi: overlay manşet · default editöryal · numbered liste
 */
export function NewsCard({
  article,
  variant = "default",
  rank,
  priority = false,
  showByline = true,
}: NewsCardProps) {
  const rel = formatRelative(article.publishedAt);
  const credit = creditLine(article);
  const catAccent = categoryThemeColor(article.category.color);
  const tintStyle = catAccent.startsWith("#")
    ? ({ ["--card-accent" as string]: catAccent } as CSSProperties)
    : undefined;
  const isNumbered =
    typeof rank === "number" || variant === "text" || variant === "rail";
  const layout =
    variant === "overlay"
      ? "overlay"
      : isNumbered && (variant === "text" || typeof rank === "number")
        ? "numbered"
        : variant === "compact" || variant === "rail"
          ? "compact"
          : variant === "hero"
            ? "hero"
            : "default";

  if (layout === "overlay") {
    return (
      <article className={`${styles.card} ${styles.overlay}`}>
        <Link
          href={`/haber/${article.slug}`}
          className={styles.link}
          aria-label={article.title}
        >
          <div className={styles.mediaOverlay}>
            {article.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.coverImage}
                alt=""
                className={styles.image}
                loading={priority ? "eager" : "lazy"}
              />
            ) : (
              <div className={styles.placeholder} aria-hidden />
            )}
            <div className={styles.overlayMeta}>
              <div className={styles.catRow}>
                <span className={styles.dot} aria-hidden />
                <span className={styles.catLabel}>{article.category.name}</span>
                {article.isBreaking ? (
                  <span className={styles.live}>Son dakika</span>
                ) : null}
              </div>
              <h3 className={styles.overlayTitle}>{article.title}</h3>
              {article.excerpt ? (
                <p className={styles.overlayExcerpt}>{article.excerpt}</p>
              ) : null}
              <p className={styles.overlayFoot}>
                {credit}
                {rel ? ` · ${rel}` : ""}
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (layout === "numbered") {
    const n = rank ?? 0;
    return (
      <article
        className={`${styles.card} ${styles.numbered} ${styles.tinted}`}
        style={tintStyle}
      >
        <ListCoverRow
          href={`/haber/${article.slug}`}
          coverImage={article.coverImage}
          className={styles.numberedLink}
          ariaLabel={article.title}
        >
          {n > 0 ? (
            <span className={styles.num} aria-hidden>
              {String(n).padStart(2, "0")}
            </span>
          ) : null}
          <span className={styles.numberedBody}>
            <span className={styles.catRow}>
              <span className={styles.dot} aria-hidden />
              <span className={styles.catLabel}>{article.category.name}</span>
            </span>
            <h3 className={styles.numberedTitle}>{article.title}</h3>
            {showByline ? (
              <span className={styles.footInline}>
                {credit}
                {rel ? ` · ${rel}` : ""}
              </span>
            ) : null}
          </span>
        </ListCoverRow>
      </article>
    );
  }

  if (layout === "compact") {
    return (
      <article
        className={`${styles.card} ${styles.compact} ${styles.tinted}`}
        style={tintStyle}
      >
        <ListCoverRow
          href={`/haber/${article.slug}`}
          coverImage={article.coverImage}
          className={styles.compactLink}
          ariaLabel={article.title}
        >
          <span className={styles.compactBody}>
            <span className={styles.catRow}>
              <span className={styles.dot} aria-hidden />
              <span className={styles.catLabel}>{article.category.name}</span>
            </span>
            <h3 className={styles.compactTitle}>{article.title}</h3>
            {showByline ? (
              <p className={styles.footInline}>
                {credit}
                {rel ? ` · ${rel}` : ""}
              </p>
            ) : null}
          </span>
        </ListCoverRow>
      </article>
    );
  }

  /* default + hero — editöryal dikey kart */
  return (
    <article
      className={`${styles.card} ${layout === "hero" ? styles.hero : styles.default} ${styles.tinted}`}
      style={tintStyle}
    >
      <Link
        href={`/haber/${article.slug}`}
        className={styles.link}
        aria-label={article.title}
      >
        <div className={styles.media}>
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt=""
              className={styles.image}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.catRow}>
            <span className={styles.dot} aria-hidden />
            <span className={styles.catLabel}>{article.category.name}</span>
            {article.isBreaking ? (
              <span className={styles.live}>Son dakika</span>
            ) : null}
          </div>

          <h3 className={styles.title}>{article.title}</h3>

          {(layout === "default" || layout === "hero") && article.excerpt ? (
            <p className={styles.excerpt}>{article.excerpt}</p>
          ) : null}

          {showByline ? (
            <p className={styles.foot}>
              {credit}
              {rel ? ` · ${rel}` : ""}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
