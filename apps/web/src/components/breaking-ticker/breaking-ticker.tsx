import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { Copy } from "@/lib/copy";
import styles from "./breaking-ticker.module.css";

export type BreakingTickerProps = {
  items: ApiArticle[];
};

/** Son dakika kayan şerit */
export function BreakingTicker({ items }: BreakingTickerProps) {
  if (!items.length) return null;

  const loop = items.length === 1 ? [...items, ...items, ...items] : [...items, ...items];

  return (
    <section className={styles.wrap} aria-label="Son dakika haberleri">
      <div className={`yh-container ${styles.inner}`}>
        <Link href="/son-dakika" className={styles.label}>
          <span className={styles.dot} aria-hidden />
          SON DAKİKA
        </Link>

        <div className={styles.trackWrap}>
          <ul className={styles.list}>
            {loop.map((item, idx) => (
              <li key={`${item.id}-${idx}`} className={styles.item}>
                <Link href={`/haber/${item.slug}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/son-dakika" className={styles.all}>
          {Copy.seeAll}
        </Link>
      </div>
    </section>
  );
}
