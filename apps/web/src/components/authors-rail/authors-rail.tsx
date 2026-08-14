import Link from "next/link";
import type { ApiAuthor } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import { Copy } from "@/lib/copy";
import styles from "./authors-rail.module.css";

export type AuthorsRailProps = {
  authors: ApiAuthor[];
  /** Maks. profil. Varsayılan 12. */
  limit?: number;
};

/**
 * Anasayfa yazar rayı — portre, unvan ve son köşe yazısı
 */
export function AuthorsRail({ authors, limit = 12 }: AuthorsRailProps) {
  const list = authors.slice(0, limit);
  if (!list.length) return null;

  return (
    <section
      className={styles.wrap}
      aria-labelledby="authors-rail-heading"
      data-count={list.length}
    >
      <header className={styles.head}>
        <div className={styles.headLeft}>
          <h2 id="authors-rail-heading" className={styles.title}>
            <span className={styles.bar} aria-hidden />
            <span className={styles.titleStack}>
              <span className={styles.kicker}>Köşe</span>
              <span className={styles.titleText}>Yazarlar</span>
            </span>
          </h2>
          <p className={styles.lead}>Gündemi yorumlayan kalemler</p>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.count}>{list.length} yazar</span>
          <Link href="/yazarlar" className={styles.more}>
            {Copy.seeAll}
            <span className={styles.moreArrow} aria-hidden>
              →
            </span>
          </Link>
        </div>
      </header>

      <ul className={styles.grid} aria-label="Köşe yazarları">
        {list.map((author) => {
          const latest = author.latestArticle;
          const rel = latest?.publishedAt
            ? formatRelative(latest.publishedAt)
            : "";

          return (
            <li key={author.id} className={styles.item}>
              <article className={styles.card}>
                <Link
                  href={`/yazar/${author.slug}`}
                  className={styles.profile}
                  aria-label={`${author.name} profili`}
                >
                  <span className={styles.avatarWrap}>
                    {author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={author.avatarUrl}
                        alt=""
                        className={styles.avatar}
                        width={96}
                        height={96}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className={styles.avatarPh} aria-hidden>
                        {author.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
                      </span>
                    )}
                  </span>
                  <span className={styles.identity}>
                    <strong className={styles.name}>{author.name}</strong>
                    {author.title ? (
                      <span className={styles.role}>{author.title}</span>
                    ) : null}
                  </span>
                </Link>

                {latest ? (
                  <Link
                    href={`/haber/${latest.slug}`}
                    className={styles.latest}
                    aria-label={`${author.name}: ${latest.title}`}
                  >
                    <span className={styles.latestLabel}>Son yazı</span>
                    <span className={styles.latestTitle}>{latest.title}</span>
                    {rel ? (
                      <time
                        className={styles.latestTime}
                        dateTime={latest.publishedAt ?? undefined}
                      >
                        {rel}
                      </time>
                    ) : null}
                  </Link>
                ) : (
                  <p className={styles.empty}>Yeni yazı yakında</p>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
