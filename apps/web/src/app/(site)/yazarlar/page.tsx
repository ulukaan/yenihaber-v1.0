import type { Metadata } from "next";
import Link from "next/link";
import { publicApi, formatDateShort, formatRelative } from "@/lib/api";
import type { ApiAuthor } from "@yenihaber/shared";
import styles from "./yazarlar.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yazarlar",
  description:
    "Düzce Radikal köşe yazarları, son yazılar ve yazar profilleri.",
};

type Props = {
  searchParams: Promise<{ q?: string; tab?: string }>;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toLocaleUpperCase("tr-TR") ?? "").join("");
}

function AuthorAvatar({
  author,
  sizeClass,
}: {
  author: ApiAuthor;
  sizeClass: string;
}) {
  if (author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={author.avatarUrl} alt="" className={sizeClass} />
    );
  }
  return (
    <span className={sizeClass} aria-hidden>
      {initials(author.name) || author.name.slice(0, 1)}
    </span>
  );
}

/** Yazarlar dizin — öne çıkan köşe, filtre, ızgara, son yazılar */
export default async function AuthorsIndexPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tab = sp.tab === "tum" ? "tum" : "kose";

  let authors: ApiAuthor[] = [];
  try {
    authors = await publicApi.authors.list({
      columnistsOnly: tab === "kose" && !q,
      limit: 40,
      q: q || undefined,
    });
    if (tab === "kose" && !q) {
      authors = authors.filter((a) => a.isColumnist);
    }
  } catch {
    authors = [];
  }

  const withWork = authors.filter((a) => a.latestArticle);
  const featured =
    [...withWork].sort((a, b) => {
      const ta = a.latestArticle?.publishedAt
        ? Date.parse(a.latestArticle.publishedAt)
        : 0;
      const tb = b.latestArticle?.publishedAt
        ? Date.parse(b.latestArticle.publishedAt)
        : 0;
      return tb - ta;
    })[0] ?? authors[0];

  const rest = authors.filter((a) => a.id !== featured?.id);
  const stream = withWork
    .map((a) => ({ author: a, article: a.latestArticle! }))
    .sort((x, y) => {
      const ta = x.article.publishedAt ? Date.parse(x.article.publishedAt) : 0;
      const tb = y.article.publishedAt ? Date.parse(y.article.publishedAt) : 0;
      return tb - ta;
    })
    .slice(0, 12);

  return (
    <div className={styles.root}>
      <header className={styles.mast}>
        <div className={`yh-container ${styles.mastInner}`}>
          <nav className={styles.crumb} aria-label="Sayfa konumu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden>/</span>
            <span>Yazarlar</span>
          </nav>
          <p className={styles.kicker}>Köşe & kalemler</p>
          <h1 className={styles.title}>Yazarlar</h1>
          <p className={styles.lead}>
            Yerel gündem, ekonomi, kültür ve spor — Düzce Radikal’in köşe
            yazarları ve son yazıları.
          </p>
          <p className={styles.meta}>
            {authors.length} yazar
            {withWork.length
              ? ` · ${withWork.length} aktif yazı`
              : ""}
          </p>
        </div>
      </header>

      <div className={`yh-container ${styles.body}`}>
        <div className={styles.toolbar}>
          <nav className={styles.tabs} aria-label="Yazar filtreleri">
            <Link
              href={q ? `/yazarlar?tab=kose&q=${encodeURIComponent(q)}` : "/yazarlar"}
              className={tab === "kose" ? styles.tabOn : styles.tab}
              aria-current={tab === "kose" ? "page" : undefined}
            >
              Köşe yazarları
            </Link>
            <Link
              href={
                q
                  ? `/yazarlar?tab=tum&q=${encodeURIComponent(q)}`
                  : "/yazarlar?tab=tum"
              }
              className={tab === "tum" ? styles.tabOn : styles.tab}
              aria-current={tab === "tum" ? "page" : undefined}
            >
              Tümü
            </Link>
          </nav>

          <form className={styles.search} action="/yazarlar" method="get">
            {tab === "tum" ? (
              <input type="hidden" name="tab" value="tum" />
            ) : null}
            <label htmlFor="author-q" className="yh-sr-only">
              Yazar ara
            </label>
            <input
              id="author-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="İsim, unvan veya bio ara…"
              autoComplete="off"
            />
            <button type="submit">Ara</button>
          </form>
        </div>

        {q ? (
          <p className={styles.filterNote} role="status">
            “{q}” için {authors.length} sonuç.{" "}
            <Link href={tab === "tum" ? "/yazarlar?tab=tum" : "/yazarlar"}>
              Filtreyi temizle
            </Link>
          </p>
        ) : null}

        {!authors.length ? (
          <p className={styles.empty}>
            {q
              ? "Aramanızla eşleşen yazar bulunamadı."
              : "Henüz yazar tanımı yok."}
          </p>
        ) : (
          <>
            {featured ? (
              <section
                className={styles.feature}
                aria-label="Öne çıkan yazar"
              >
                <Link
                  href={`/yazar/${featured.slug}`}
                  className={styles.featurePhoto}
                  aria-label={`${featured.name} profili`}
                >
                  {featured.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.avatarUrl} alt="" />
                  ) : (
                    <span aria-hidden>{initials(featured.name)}</span>
                  )}
                </Link>
                <div className={styles.featureBody}>
                  <p className={styles.featureBadge}>
                    {featured.latestArticle ? "Son köşe" : "Yazar"}
                  </p>
                  <h2>
                    <Link href={`/yazar/${featured.slug}`}>
                      {featured.name}
                    </Link>
                  </h2>
                  {featured.title ? (
                    <p className={styles.featureTitle}>{featured.title}</p>
                  ) : null}
                  {featured.bio ? (
                    <p className={styles.featureBio}>{featured.bio}</p>
                  ) : null}
                  {featured.latestArticle ? (
                    <Link
                      href={`/haber/${featured.latestArticle.slug}`}
                      className={styles.featureArticle}
                    >
                      <span>Son yazı</span>
                      <strong>{featured.latestArticle.title}</strong>
                      {featured.latestArticle.publishedAt ? (
                        <time
                          dateTime={featured.latestArticle.publishedAt}
                        >
                          {formatRelative(
                            featured.latestArticle.publishedAt,
                          ) ||
                            formatDateShort(
                              featured.latestArticle.publishedAt,
                            )}
                        </time>
                      ) : null}
                    </Link>
                  ) : null}
                  <div className={styles.featureActions}>
                    <Link
                      href={`/yazar/${featured.slug}`}
                      className={styles.cta}
                    >
                      Tüm yazıları
                    </Link>
                    {typeof featured.articleCount === "number" ? (
                      <span className={styles.countPill}>
                        {featured.articleCount} yazı
                      </span>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="grid-title">
              <header className={styles.sectionHead}>
                <h2 id="grid-title">
                  {tab === "kose" ? "Köşe kadrosu" : "Yazarlar"}
                </h2>
                <span>{rest.length + (featured ? 0 : 0) || authors.length} profil</span>
              </header>
              <ul className={styles.grid}>
                {(featured ? [featured, ...rest] : rest).map((author) => (
                  <li key={author.id}>
                    <article className={styles.card}>
                      <Link
                        href={`/yazar/${author.slug}`}
                        className={styles.cardTop}
                        aria-label={`${author.name} profili`}
                      >
                        <AuthorAvatar
                          author={author}
                          sizeClass={
                            (author.avatarUrl ? styles.cardAv : styles.cardAvPh) ?? ""
                          }
                        />
                        <div className={styles.cardId}>
                          <h3>{author.name}</h3>
                          {author.title ? (
                            <p className={styles.cardRole}>{author.title}</p>
                          ) : author.isColumnist ? (
                            <p className={styles.cardRole}>Köşe yazarı</p>
                          ) : null}
                          {typeof author.articleCount === "number" ? (
                            <p className={styles.cardCount}>
                              {author.articleCount} yayın
                            </p>
                          ) : null}
                        </div>
                      </Link>
                      {author.latestArticle ? (
                        <Link
                          href={`/haber/${author.latestArticle.slug}`}
                          className={styles.cardLatest}
                        >
                          <span className={styles.cardLatestLabel}>
                            Son yazı
                            {author.latestArticle.publishedAt ? (
                              <time
                                dateTime={author.latestArticle.publishedAt}
                              >
                                {" · "}
                                {formatRelative(
                                  author.latestArticle.publishedAt,
                                ) ||
                                  formatDateShort(
                                    author.latestArticle.publishedAt,
                                  )}
                              </time>
                            ) : null}
                          </span>
                          <strong>{author.latestArticle.title}</strong>
                          {author.latestArticle.excerpt ? (
                            <p>{author.latestArticle.excerpt}</p>
                          ) : null}
                        </Link>
                      ) : (
                        <p className={styles.cardEmpty}>Henüz yazı yok</p>
                      )}
                      <Link
                        href={`/yazar/${author.slug}`}
                        className={styles.cardLink}
                      >
                        Profil →
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            {stream.length > 0 ? (
              <section
                className={styles.stream}
                aria-labelledby="stream-title"
              >
                <header className={styles.sectionHead}>
                  <h2 id="stream-title">Son köşeler</h2>
                  <span>Yazara göre en son</span>
                </header>
                <ol className={styles.streamList}>
                  {stream.map(({ author, article }, i) => (
                    <li key={`${author.id}-${article.id}`}>
                      <span className={styles.streamNum} aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className={styles.streamMain}>
                        <Link
                          href={`/haber/${article.slug}`}
                          className={styles.streamTitle}
                        >
                          {article.title}
                        </Link>
                        <p className={styles.streamMeta}>
                          <Link href={`/yazar/${author.slug}`}>
                            {author.name}
                          </Link>
                          {article.publishedAt ? (
                            <time dateTime={article.publishedAt}>
                              {formatDateShort(article.publishedAt)}
                            </time>
                          ) : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
