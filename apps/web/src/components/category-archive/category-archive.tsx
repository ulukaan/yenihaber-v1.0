import Link from "next/link";
import type { ApiArticle, ApiCategory, CategoryPageTemplate } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import { categoryThemeColor } from "@/lib/category-theme";
import { SidebarWidgets } from "@/components/sidebar-widgets/sidebar-widgets";
import { SportPanel } from "@/components/sport-panel/sport-panel";
import { EconomyStrip } from "@/components/economy-strip/economy-strip";
import { AdSlot } from "@/components/ads/ad-slot";
import styles from "@/styles/category.module.css";

type Chip = { href: string; label: string };

type Props = {
  category: ApiCategory;
  slug: string;
  page: number;
  items: ApiArticle[];
  total: number;
  totalPages: number;
  breaking: ApiArticle[];
  popular: ApiArticle[];
  chips: Chip[];
};

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

/**
 * Tek kategori arşivi — şablon admin’den seçilir (WordPress page template).
 */
export function CategoryArchive({
  category,
  slug,
  page,
  items,
  total,
  totalPages,
  breaking,
  popular,
  chips,
}: Props) {
  const template: CategoryPageTemplate = category.pageTemplate ?? "magazine";
  const cat = categoryThemeColor(category.color);
  const useHero = template !== "list" && page === 1;
  const lead = useHero ? items[0] : undefined;
  const secondaries = useHero ? items.slice(1, 5) : [];
  const rest = useHero ? items.slice(5) : items;
  const leadRel = lead ? formatRelative(lead.publishedAt) : "";
  const sideContext =
    template === "sport"
      ? "sport"
      : template === "economy"
        ? "economy"
        : "default";

  return (
    <div className={styles.shell} style={{ ["--cat" as string]: cat }}>
      <header className={styles.mast}>
        <div className={styles.mastBg} aria-hidden />
        <div className={`yh-container ${styles.mastInner}`}>
          <nav className={styles.crumb} aria-label="Sayfa konumu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden>/</span>
            <span className={styles.crumbNow}>{category.name}</span>
          </nav>
          <div className={styles.mastRow}>
            <div className={styles.mastText}>
              <p className={styles.mastKicker}>Kategori</p>
              <h1 className={styles.mastTitle}>{category.name}</h1>
              <p className={styles.mastDesc}>
                {category.description?.trim() ||
                  `${category.name} hakkındaki son gelişmeler ve öne çıkan başlıklar.`}
              </p>
            </div>
            <div className={styles.mastStat} aria-label={`${total} haber`}>
              <strong>{total.toLocaleString("tr-TR")}</strong>
              <span>haber</span>
            </div>
          </div>
          {chips.length > 0 ? (
            <nav className={styles.chips} aria-label="Alt kategoriler">
              {chips.map((c) => {
                const active = c.href === `/kategori/${slug}`;
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={active ? styles.chipOn : styles.chip}
                    aria-current={active ? "page" : undefined}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </header>

      <div className={`yh-container ${styles.page}`}>
        <AdSlot code="category-top" />
        {template === "sport" || template === "economy" ? (
          <div className={styles.panelSlot}>
            {template === "sport" ? <SportPanel /> : null}
            {template === "economy" ? <EconomyStrip /> : null}
          </div>
        ) : null}

        <div className={styles.layout}>
          <div className={styles.main}>
            {!items.length ? (
              <div className={styles.empty}>
                <strong>Bu kategoride henüz haber yok</strong>
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
                    aria-label={`${category.name} manşet`}
                  >
                    <Link
                      href={`/haber/${lead.slug}`}
                      className={styles.lead}
                      aria-label={lead.title}
                    >
                      <div className={styles.leadMedia}>
                        {lead.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={lead.coverImage} alt="" loading="eager" />
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
                                  <img src={item.coverImage} alt="" loading="lazy" />
                                ) : (
                                  <span className={styles.rankPh} />
                                )}
                              </span>
                              <span className={styles.rankText}>
                                <strong>{item.title}</strong>
                                <time dateTime={item.publishedAt ?? undefined}>
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
                  <section className={styles.stream} aria-labelledby="cat-list-title">
                    <div className={styles.sectionHead}>
                      <h2 id="cat-list-title">
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
                            ? `/kategori/${slug}`
                            : `/kategori/${slug}?page=${page - 1}`
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
                        href={`/kategori/${slug}?page=${page + 1}`}
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
              popular={popular}
              context={sideContext}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
