import Link from "next/link";
import { SectionHeader } from "@yenihaber/ui";
import type { ApiArticle } from "@yenihaber/shared";
import { Copy } from "@/lib/copy";
import styles from "./latest-feed.module.css";

export type LatestFeedProps = {
  items: ApiArticle[];
  title?: string;
  limit?: number;
};

/** Manşet yanı — numara + serif başlık; aksan yalnız hover */
export function LatestFeed({
  items,
  title = "Son haberler",
  limit = 10,
}: LatestFeedProps) {
  const list = items.slice(0, limit);
  if (!list.length) return null;

  return (
    <aside className={styles.wrap} aria-label={title}>
      <SectionHeader
        title={title}
        more={
          <Link href="/son-dakika" className={styles.more}>
            {Copy.seeAll}
            <span aria-hidden> →</span>
          </Link>
        }
      />

      <ol className={styles.list}>
        {list.map((item, i) => (
          <li key={item.id}>
            <Link href={`/haber/${item.slug}`} className={styles.row}>
              <span className={styles.num} aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.itemTitle}>{item.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
