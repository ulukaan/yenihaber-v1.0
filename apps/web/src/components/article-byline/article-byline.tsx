import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { tarihBicimle } from "@/lib/format-date";
import styles from "./article-byline.module.css";

export type ArticleBylineProps = {
  article: ApiArticle;
  /** compact: 24s kuralı · full: kısa tarih */
  mode?: "compact" | "full";
  className?: string;
  /** Kart içinde parent Link varken false */
  linked?: boolean;
};

/**
 * Kart / başlık altı sade byline.
 * Ajans haberinde kaynak gösterilir; köşe yazarında profile link.
 */
export function ArticleByline({
  article,
  mode = "compact",
  className,
  linked = true,
}: ArticleBylineProps) {
  const time =
    mode === "full"
      ? tarihBicimle(article.publishedAt, "short")
      : tarihBicimle(article.publishedAt, "auto");

  const agency = article.sourceAgency?.trim();
  const isColumnist = !agency && article.author.isColumnist;
  const credit = agency || article.author.name;

  const creditNode =
    linked && !agency && article.author.slug ? (
      <Link href={`/yazar/${article.author.slug}`} className={styles.credit}>
        {isColumnist ? <span className={styles.pen} aria-hidden /> : null}
        {credit}
      </Link>
    ) : (
      <span className={styles.credit}>
        {isColumnist ? <span className={styles.pen} aria-hidden /> : null}
        {credit}
      </span>
    );

  return (
    <p className={`${styles.byline} ${className ?? ""}`.trim()}>
      {creditNode}
      {time ? (
        <>
          <span className={styles.sep} aria-hidden>
            ·
          </span>
          <time dateTime={article.publishedAt ?? undefined}>{time}</time>
        </>
      ) : null}
    </p>
  );
}
