import Link from "next/link";
import type { ApiAuthor } from "@yenihaber/shared";
import styles from "./columns-showcase.module.css";

export type ColumnsShowcaseProps = {
  authors: ApiAuthor[];
  /** Maks. köşe yazısı. Varsayılan 8. */
  limit?: number;
};

type FeaturePick = {
  featured: ApiAuthor;
  rest: ApiAuthor[];
  badge: string;
  kicker: string;
};

function dayKey(d = new Date()): number {
  return d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function publishedMs(a: ApiAuthor): number {
  const p = a.latestArticle?.publishedAt;
  if (!p) return 0;
  const t = Date.parse(p);
  return Number.isFinite(t) ? t : 0;
}

function commentScore(a: ApiAuthor): number {
  return a.latestArticle?.commentCount ?? 0;
}

/** Öne çıkan köşe: etkileşim / yenilik / günlük rastgele. */
function pickFeatured(list: ApiAuthor[]): FeaturePick {
  const seed = dayKey();
  const mode = seed % 3;
  const pool = [...list];
  let ordered = pool;
  let badge = "Bugünün seçimi";
  let kicker = "Köşe · öne çıkan";

  if (mode === 0) {
    ordered = [...pool].sort((a, b) => {
      const c = commentScore(b) - commentScore(a);
      if (c !== 0) return c;
      return publishedMs(b) - publishedMs(a);
    });
    if (commentScore(ordered[0]!) > 0) {
      badge = "En çok okunan";
      kicker = "Köşe · en çok okunan";
    } else {
      badge = "Sıcak köşe";
      kicker = "Köşe · gündemde";
    }
  } else if (mode === 1) {
    ordered = [...pool].sort((a, b) => publishedMs(b) - publishedMs(a));
    badge = "Son yazı";
    kicker = "Köşe · yeni";
  } else {
    const rnd = mulberry32(seed ^ 0x9e3779b9);
    ordered = [...pool]
      .map((author) => ({ author, r: rnd() }))
      .sort((x, y) => x.r - y.r)
      .map(({ author }) => author);
    badge = "Rastgele";
    kicker = "Köşe · bugün";
  }

  const featured = ordered[0]!;
  const rest = pool.filter((a) => a.id !== featured.id);
  return { featured, rest, badge, kicker };
}

/**
 * Sadece köşe yazıları — yazı başlığı ve metin odaklı.
 * Yazar listesi bu bileşende yok.
 */
export function ColumnsShowcase({ authors, limit = 8 }: ColumnsShowcaseProps) {
  const list = authors.filter((a) => a.latestArticle).slice(0, limit);
  if (!list.length) return null;

  const { featured, rest, badge, kicker } = pickFeatured(list);
  if (!featured.latestArticle) return null;

  const side = rest.slice(0, 5);
  const photo =
    featured.latestArticle.coverImage?.trim() ||
    featured.avatarUrl?.trim() ||
    null;

  return (
    <section
      className={styles.wrap}
      aria-labelledby="columns-heading"
      data-count={list.length}
    >
      <header className={styles.head}>
        <h2 id="columns-heading" className={styles.title}>
          <span className={styles.bar} aria-hidden />
          <span className={styles.titleText}>Köşe Yazıları</span>
        </h2>
        <span className={styles.count} aria-label={`${list.length} yazı`}>
          {list.length} yazı
        </span>
      </header>

      <div
        className={
          side.length ? styles.board : `${styles.board} ${styles.boardSolo}`
        }
      >
        <article className={styles.featured}>
          <Link
            href={`/haber/${featured.latestArticle.slug}`}
            className={styles.featuredPhoto}
            aria-label={featured.latestArticle.title}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" />
            ) : (
              <div className={styles.photoPh} aria-hidden>
                “
              </div>
            )}
            <span className={styles.photoBadge}>{badge}</span>
          </Link>

          <div className={styles.featuredBody}>
            <p className={styles.kicker}>{kicker}</p>
            <Link
              href={`/haber/${featured.latestArticle.slug}`}
              className={styles.featQuote}
            >
              <span className={styles.quoteMark} aria-hidden>
                “
              </span>
              <span className={styles.featQuoteText}>
                {featured.latestArticle.title}
              </span>
            </Link>
            {featured.latestArticle.excerpt ? (
              <p className={styles.featExcerpt}>
                {featured.latestArticle.excerpt}
              </p>
            ) : null}
            <p className={styles.byline}>
              <Link href={`/yazar/${featured.slug}`}>{featured.name}</Link>
              {featured.title ? (
                <span className={styles.bylineRole}> · {featured.title}</span>
              ) : null}
            </p>
            <Link
              href={`/haber/${featured.latestArticle.slug}`}
              className={styles.read}
            >
              Yazıyı oku →
            </Link>
          </div>
        </article>

        {side.length ? (
          <ol className={styles.side} aria-label="Diğer köşe yazıları">
            {side.map((author, i) => {
              const article = author.latestArticle!;
              return (
                <li key={article.id}>
                  <Link href={`/haber/${article.slug}`} className={styles.row}>
                    <span className={styles.num} aria-hidden>
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.rowTitle}>{article.title}</span>
                      <span className={styles.rowBy}>
                        {author.name}
                        {author.title ? ` · ${author.title}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
