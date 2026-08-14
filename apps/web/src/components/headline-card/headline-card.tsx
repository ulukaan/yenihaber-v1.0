import Link from "next/link";
import type { MansetCardView, MansetSettings } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import styles from "./headline-card.module.css";

export type HeadlineCardSize = "hero" | "large" | "small" | "full";

export type HeadlineCardProps = {
  card: MansetCardView;
  size?: HeadlineCardSize;
  settings?: Partial<MansetSettings>;
  /** Küçük kartlarda spot asla yok */
  forceHideSpot?: boolean;
};

function fmtDuration(sec: number | null | undefined) {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Manşet kartı anatomisi — tüm düzenlerde ortak.
 */
export function HeadlineCard({
  card,
  size = "small",
  settings,
  forceHideSpot,
}: HeadlineCardProps) {
  const { article, headlineTitle, kicker, spot, badge, showSpot: cardShowSpot } =
    card;
  const cover = article.coverImage169 || article.coverImage;
  const rel = formatRelative(article.publishedAt);
  const showSpot =
    !forceHideSpot && cardShowSpot && size !== "small" && Boolean(spot);
  const showAuthor = settings?.showAuthor !== false && size !== "small";
  const showComments =
    settings?.showComments !== false &&
    size !== "small" &&
    (article.commentCount ?? 0) > 0;
  const mediaLabel =
    article.contentType === "video"
      ? fmtDuration(article.videoDuration)
      : article.contentType === "galeri"
        ? "Galeri"
        : null;

  const catColor =
    article.category.color?.trim() || "var(--yh-accent)";

  return (
    <article
      className={[
        styles.card,
        size === "hero" ? styles.hero : "",
        size === "large" ? styles.large : "",
        size === "full" ? styles.full : "",
        size === "small" ? styles.small : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link href={`/haber/${article.slug}`} className={styles.link}>
        <div className={styles.media}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={size === "small" ? 400 : 1200}
              height={size === "small" ? 225 : 675}
              className={styles.img}
            />
          ) : (
            <span
              className={styles.ph}
              style={{ background: catColor }}
              aria-hidden
            />
          )}
          {badge ? (
            <span
              className={styles.badge}
              style={{ background: badge.color }}
            >
              {badge.text}
            </span>
          ) : null}
          {mediaLabel ? (
            <span className={styles.mediaTag}>{mediaLabel}</span>
          ) : null}
        </div>

        <div className={styles.body}>
          <p className={styles.kicker}>{kicker}</p>
          <h2 className={styles.title}>{headlineTitle}</h2>
          {showSpot && spot ? <p className={styles.spot}>{spot}</p> : null}
          <p className={styles.meta}>
            <time dateTime={article.publishedAt ?? undefined}>
              {rel || "Az önce"}
            </time>
            {showAuthor && article.author?.name ? (
              <>
                <span aria-hidden>·</span>
                <span>{article.author.name}</span>
              </>
            ) : null}
            {showComments ? (
              <>
                <span aria-hidden>·</span>
                <span>{article.commentCount} yorum</span>
              </>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
