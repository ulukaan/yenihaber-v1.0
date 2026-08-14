import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ApiAuthor } from "@yenihaber/shared";
import { formatDate, formatDateShort, formatRelative, publicApi } from "@/lib/api";
import { FollowAuthorButton } from "@/components/member-account/follow-author-button";
import styles from "./yazar.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { author } = await publicApi.authors.getBySlug(slug, { limit: 1 });
    return {
      title: author.name,
      description:
        author.bio || author.title || `${author.name} köşe yazıları — Düzce Radikal`,
    };
  } catch {
    return { title: "Yazar" };
  }
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
}

/** Yazar profili — hero, son yazı, arşiv, pagination, diğer yazarlar */
export default async function AuthorProfilePage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 12;

  let payload: Awaited<ReturnType<typeof publicApi.authors.getBySlug>>;
  try {
    payload = await publicApi.authors.getBySlug(slug, { page, limit });
  } catch {
    notFound();
  }

  const { author, articles } = payload;
  const items = articles.data;
  const total = articles.meta.total;
  const totalPages = articles.meta.totalPages;
  const lead = page === 1 ? items[0] : undefined;
  const rest = page === 1 ? items.slice(1) : items;

  let peers: ApiAuthor[] = [];
  try {
    const all = await publicApi.authors.list({
      columnistsOnly: true,
      limit: 12,
    });
    peers = all.filter((a) => a.id !== author.id).slice(0, 6);
  } catch {
    peers = [];
  }

  return (
    <div className={styles.root}>
      <header className={styles.mast}>
        <div className={`yh-container ${styles.mastInner}`}>
          <nav className={styles.crumb} aria-label="Sayfa konumu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden>/</span>
            <Link href="/yazarlar">Yazarlar</Link>
            <span aria-hidden>/</span>
            <span>{author.name}</span>
          </nav>

          <div className={styles.hero}>
            <div className={styles.photo}>
              {author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatarUrl} alt="" />
              ) : (
                <div className={styles.photoPh} aria-hidden>
                  {initials(author.name)}
                </div>
              )}
            </div>
            <div className={styles.identity}>
              <p className={styles.kicker}>
                {author.isColumnist ? "Köşe yazarı" : "Yazar"}
              </p>
              <h1>{author.name}</h1>
              {author.title ? (
                <p className={styles.title}>{author.title}</p>
              ) : null}
              {author.bio ? <p className={styles.bio}>{author.bio}</p> : null}
              <div className={styles.metaRow}>
                {typeof author.articleCount === "number" || total ? (
                  <span className={styles.stat}>
                    <strong>{author.articleCount ?? total}</strong> yazı
                  </span>
                ) : null}
                <FollowAuthorButton
                  slug={author.slug}
                  name={author.name}
                  title={author.title}
                  avatarUrl={author.avatarUrl}
                />
                {author.twitterUrl ? (
                  <a
                    href={author.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    X / Twitter
                  </a>
                ) : null}
                {author.linkedinUrl ? (
                  <a
                    href={author.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`yh-container ${styles.layout}`}>
        <div className={styles.main}>
          {lead ? (
            <section className={styles.leadArt} aria-label="Son yazı">
              <Link
                href={`/haber/${lead.slug}`}
                className={styles.leadLink}
                aria-label={lead.title}
              >
                <div className={styles.leadMedia} aria-hidden>
                  {lead.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lead.coverImage} alt="" />
                  ) : (
                    <div className={styles.leadPh} />
                  )}
                </div>
                <div className={styles.leadBody}>
                  <span className={styles.leadBadge}>
                    {page === 1 ? "Son yazı" : "Öne çıkan"}
                  </span>
                  <h2>{lead.title}</h2>
                  {lead.excerpt ? <p>{lead.excerpt}</p> : null}
                  <time dateTime={lead.publishedAt ?? undefined}>
                    {formatDate(lead.publishedAt)}
                  </time>
                </div>
              </Link>
            </section>
          ) : null}

          <section aria-labelledby="works-title">
            <header className={styles.worksHead}>
              <h2 id="works-title">
                {page > 1 ? `Yazılar · sayfa ${page}` : "Tüm yazıları"}
              </h2>
              <span>
                {total} kayıt
                {totalPages > 1 ? ` · ${totalPages} sayfa` : ""}
              </span>
            </header>

            {rest.length || (!lead && items.length) ? (
              <ul className={styles.list}>
                {(lead ? rest : items).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/haber/${item.slug}`}
                      className={styles.row}
                      aria-label={item.title}
                    >
                      <div className={styles.rowMedia} aria-hidden>
                        {item.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverImage} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.rowPh} />
                        )}
                      </div>
                      <div className={styles.rowBody}>
                        <time dateTime={item.publishedAt ?? undefined}>
                          {item.publishedAt
                            ? formatRelative(item.publishedAt) ||
                              formatDateShort(item.publishedAt)
                            : "—"}
                        </time>
                        <h3>{item.title}</h3>
                        {item.excerpt ? <p>{item.excerpt}</p> : null}
                        {item.category?.name ? (
                          <span className={styles.rowCat}>
                            {item.category.name}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : !lead ? (
              <p className={styles.empty}>Henüz yayınlanmış yazı yok.</p>
            ) : null}

            {totalPages > 1 ? (
              <nav className={styles.pager} aria-label="Sayfalar">
                {page > 1 ? (
                  <Link
                    href={
                      page === 2
                        ? `/yazar/${slug}`
                        : `/yazar/${slug}?page=${page - 1}`
                    }
                    className={styles.pageBtn}
                  >
                    Önceki
                  </Link>
                ) : (
                  <span className={styles.pageBtnDis}>Önceki</span>
                )}
                <span className={styles.pageInfo}>
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={`/yazar/${slug}?page=${page + 1}`}
                    className={styles.pageBtn}
                  >
                    Sonraki
                  </Link>
                ) : (
                  <span className={styles.pageBtnDis}>Sonraki</span>
                )}
              </nav>
            ) : null}
          </section>
        </div>

        <aside className={styles.aside}>
          <div className={styles.panel}>
            <h2>Profil</h2>
            <p>
              <strong>{author.name}</strong>
            </p>
            {author.title ? <p>{author.title}</p> : null}
            <p className={styles.panelMuted}>
              {(author.articleCount ?? total) || 0} yayınlanmış yazı
            </p>
            <Link href="/yazarlar" className={styles.panelLink}>
              Tüm yazarlar →
            </Link>
          </div>

          {peers.length ? (
            <div className={styles.panel}>
              <h2>Diğer kalemler</h2>
              <ul className={styles.peers}>
                {peers.map((p) => (
                  <li key={p.id}>
                    <Link href={`/yazar/${p.slug}`} className={styles.peer}>
                      {p.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatarUrl} alt="" />
                      ) : (
                        <span aria-hidden>{initials(p.name)}</span>
                      )}
                      <span>
                        <strong>{p.name}</strong>
                        {p.title ? <small>{p.title}</small> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
