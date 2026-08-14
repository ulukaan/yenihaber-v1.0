import Link from "next/link";
import { SectionHeader } from "@yenihaber/ui";
import type { ApiArticle } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import styles from "./headline-grid.module.css";

export type HeadlineGridProps = {
  items: ApiArticle[];
  title?: string;
};

/**
 * Öne çıkan — büyük lead + 3 editöryel kart
 */
export function HeadlineGrid({
  items,
  title = "Günün seçtikleri",
}: HeadlineGridProps) {
  const list = items.slice(0, 4);
  if (!list.length) return null;

  const [lead, ...rest] = list;
  if (!lead) return null;

  const leadRel = formatRelative(lead.publishedAt);
  const leadCover = lead.coverImage169 || lead.coverImage;

  return (
    <section className={styles.wrap} aria-labelledby="one-cikan-title">
      <SectionHeader title={title} titleId="one-cikan-title" />

      <div className={styles.layout}>
        <article className={styles.lead}>
          <Link href={`/haber/${lead.slug}`} className={styles.leadLink}>
            <span className={styles.leadMedia} aria-hidden>
              {leadCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={leadCover} alt="" width={900} height={560} />
              ) : (
                <span className={styles.ph} />
              )}
            </span>
            <span className={styles.leadBody}>
              <span className={styles.kicker}>{lead.category.name}</span>
              <h3 className={styles.leadTitle}>{lead.title}</h3>
              {lead.excerpt ? (
                <p className={styles.excerpt}>{lead.excerpt}</p>
              ) : null}
              <span className={styles.meta}>
                <time dateTime={lead.publishedAt ?? undefined}>
                  {leadRel || "Az önce"}
                </time>
                {lead.author?.name ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{lead.author.name}</span>
                  </>
                ) : null}
              </span>
            </span>
          </Link>
        </article>

        {rest.length ? (
          <ul className={styles.stack}>
            {rest.map((item) => {
              const rel = formatRelative(item.publishedAt);
              const cover = item.coverImage || item.coverImage169;
              return (
                <li key={item.id}>
                  <Link href={`/haber/${item.slug}`} className={styles.row}>
                    <span className={styles.rowMedia} aria-hidden>
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" width={160} height={120} />
                      ) : (
                        <span className={styles.ph} />
                      )}
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.kicker}>{item.category.name}</span>
                      <strong className={styles.rowTitle}>{item.title}</strong>
                      <span className={styles.meta}>
                        <time dateTime={item.publishedAt ?? undefined}>
                          {rel || "Az önce"}
                        </time>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
