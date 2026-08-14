import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ApiArticle } from "@yenihaber/shared";
import { TAG_INDEX_MIN } from "@yenihaber/shared";
import { formatRelative, publicApi } from "@/lib/api";
import { SidebarWidgets } from "@/components/sidebar-widgets/sidebar-widgets";
import styles from "@/styles/category.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

/**
 * Etiket arşivi — kategori liste şablonunun aynısı (başlık + tagSlug sorgusu)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tag = await publicApi.tags.getBySlug(slug);
    const robots =
      tag.indexable === false
        ? { index: false, follow: true }
        : { index: true, follow: true };
    return {
      title: tag.name,
      description: `${tag.name} etiketli haberler — Düzce Radikal`,
      robots,
    };
  } catch {
    return { title: "Etiket" };
  }
}

function ArticleCard({
  article,
  large = false,
}: {
  article: ApiArticle;
  large?: boolean;
}) {
  const rel = formatRelative(article.publishedAt);
  return (
    <Link
      href={`/haber/${article.slug}`}
      className={large ? styles.cardLg : styles.card}
      aria-label={article.title}
    >
      <div className={styles.cardMedia} aria-hidden>
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImage} alt="" loading="lazy" />
        ) : (
          <div className={styles.cardPh} />
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardCat}>{article.category.name}</span>
        <h3 className={styles.cardTitle}>{article.title}</h3>
        {large && article.excerpt ? (
          <p className={styles.cardExcerpt}>{article.excerpt}</p>
        ) : null}
        <div className={styles.cardMeta}>
          <span>{article.author.name}</span>
          {rel ? (
            <time dateTime={article.publishedAt ?? undefined}>{rel}</time>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 18;

  try {
    const [tag, breaking, latest, articles] = await Promise.all([
      publicApi.tags.getBySlug(slug),
      publicApi.articles.breaking().catch(() => [] as ApiArticle[]),
      publicApi.articles.list({ page: 1, limit: 8 }).catch(() => ({
        data: [] as ApiArticle[],
        meta: { page: 1, limit: 8, total: 0, totalPages: 1 },
      })),
      publicApi.articles.list({ tagSlug: slug, page, limit }),
    ]);

    const items = articles.data;
    const total = articles.meta.total;
    const totalPages = articles.meta.totalPages;
    const lead = page === 1 ? items[0] : undefined;
    const secondaries = page === 1 ? items.slice(1, 5) : [];
    const rest = page === 1 ? items.slice(5) : items;
    const leadRel = lead ? formatRelative(lead.publishedAt) : "";
    const thin = !tag.indexable;

    return (
      <div className={styles.shell}>
        <header className={styles.mast}>
          <div className={styles.mastBg} aria-hidden />
          <div className={`yh-container ${styles.mastInner}`}>
            <nav className={styles.crumb} aria-label="Sayfa konumu">
              <Link href="/">Ana sayfa</Link>
              <span aria-hidden>/</span>
              <span className={styles.crumbNow}>{tag.name}</span>
            </nav>

            <div className={styles.mastRow}>
              <div className={styles.mastText}>
                <p className={styles.mastKicker}>Etiket</p>
                <h1 className={styles.mastTitle}>{tag.name}</h1>
                <p className={styles.mastDesc}>
                  {thin
                    ? `Bu etiket henüz ${TAG_INDEX_MIN} haberi geçmediği için arama motorlarına önerilmez. İçerik biriktikçe indekslenir.`
                    : `${tag.name} ile etiketlenmiş son haberler.`}
                </p>
              </div>
              <div className={styles.mastStat} aria-label={`${total} haber`}>
                <strong>{total.toLocaleString("tr-TR")}</strong>
                <span>haber</span>
              </div>
            </div>
          </div>
        </header>

        <div className={`yh-container ${styles.page}`}>
          <div className={styles.layout}>
            <div className={styles.main}>
              {!items.length ? (
                <div className={styles.empty}>
                  <strong>Bu etikette henüz haber yok</strong>
                  <span>Yeni içerikler yayınlandıkça burada listelenir.</span>
                  <Link href="/" className={styles.emptyCta}>
                    Ana sayfaya dön
                  </Link>
                </div>
              ) : (
                <>
                  {lead ? (
                    <section
                      className={styles.hero}
                      aria-label={`${tag.name} manşet`}
                    >
                      <Link
                        href={`/haber/${lead.slug}`}
                        className={styles.lead}
                        aria-label={lead.title}
                      >
                        <div className={styles.leadMedia}>
                          {lead.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lead.coverImage}
                              alt=""
                              loading="eager"
                            />
                          ) : (
                            <div className={styles.leadPh} />
                          )}
                          <div className={styles.leadShade} aria-hidden />
                        </div>
                        <div className={styles.leadBody}>
                          <span className={styles.leadBadge}>Öne çıkan</span>
                          <h2 className={styles.leadTitle}>{lead.title}</h2>
                          {lead.excerpt ? (
                            <p className={styles.leadExcerpt}>{lead.excerpt}</p>
                          ) : null}
                          <p className={styles.leadFoot}>
                            <span>{lead.author.name}</span>
                            {leadRel ? <time>{leadRel}</time> : null}
                          </p>
                        </div>
                      </Link>

                      {secondaries.length ? (
                        <ol className={styles.rankList}>
                          {secondaries.map((item, i) => (
                            <li key={item.id}>
                              <Link
                                href={`/haber/${item.slug}`}
                                className={styles.rankItem}
                              >
                                <span className={styles.rankNum} aria-hidden>
                                  {i + 2}
                                </span>
                                <span className={styles.rankMedia} aria-hidden>
                                  {item.coverImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.coverImage}
                                      alt=""
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className={styles.rankPh} />
                                  )}
                                </span>
                                <span className={styles.rankText}>
                                  <strong>{item.title}</strong>
                                  <time
                                    dateTime={item.publishedAt ?? undefined}
                                  >
                                    {formatRelative(item.publishedAt)}
                                  </time>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </section>
                  ) : null}

                  {rest.length ? (
                    <section
                      className={styles.stream}
                      aria-labelledby="tag-list-title"
                    >
                      <div className={styles.sectionHead}>
                        <h2 id="tag-list-title">
                          {page === 1 ? "Son haberler" : `Sayfa ${page}`}
                        </h2>
                        <span>
                          {rest.length} / {total.toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className={styles.cardGrid}>
                        {rest.map((article, idx) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            large={idx === 0 && page > 1}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {totalPages > 1 ? (
                    <nav className={styles.pager} aria-label="Sayfalama">
                      {page > 1 ? (
                        <Link
                          href={
                            page === 2
                              ? `/etiket/${slug}`
                              : `/etiket/${slug}?page=${page - 1}`
                          }
                          className={styles.pagerBtn}
                          rel="prev"
                        >
                          ← Önceki
                        </Link>
                      ) : (
                        <span className={styles.pagerDisabled}>← Önceki</span>
                      )}
                      <span className={styles.pagerInfo}>
                        {page} / {totalPages}
                      </span>
                      {page < totalPages ? (
                        <Link
                          href={`/etiket/${slug}?page=${page + 1}`}
                          className={styles.pagerBtn}
                          rel="next"
                        >
                          Sonraki →
                        </Link>
                      ) : (
                        <span className={styles.pagerDisabled}>Sonraki →</span>
                      )}
                    </nav>
                  ) : null}
                </>
              )}
            </div>

            <aside className={styles.side} aria-label="Yan panel">
              <SidebarWidgets
                breaking={breaking}
                popular={latest.data}
                context="default"
              />
            </aside>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
