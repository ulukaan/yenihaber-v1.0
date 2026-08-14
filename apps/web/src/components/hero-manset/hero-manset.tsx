import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { NewsCard } from "@/components/news-card/news-card";
import styles from "./hero-manset.module.css";

export type HeroMansetProps = {
  featured: ApiArticle[];
  latest: ApiArticle[];
};

/** Ana manşet alanı — büyük overlay + yan grid */
export function HeroManset({ featured, latest }: HeroMansetProps) {
  const pool = [...featured];
  for (const a of latest) {
    if (!pool.some((p) => p.id === a.id)) pool.push(a);
  }

  const main = pool[0];
  const sideTop = pool.slice(1, 3);
  const sideBottom = pool.slice(3, 7);

  if (!main) return null;

  return (
    <section className={styles.manset} aria-label="Manşet haberleri">
      <div className={styles.mainCol}>
        <NewsCard article={main} variant="overlay" priority />
        <div className={styles.bottomRow}>
          {sideBottom.map((article) => (
            <NewsCard key={article.id} article={article} variant="default" />
          ))}
        </div>
      </div>
      <aside className={styles.sideCol} aria-label="Öne çıkanlar">
        {sideTop.map((article) => (
          <NewsCard key={article.id} article={article} variant="hero" />
        ))}
        <div className={styles.moreBox}>
          <h2>Günün başlıkları</h2>
          <ol className={styles.headlines}>
            {pool.slice(0, 8).map((article, i) => (
              <li key={article.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <Link href={`/haber/${article.slug}`}>{article.title}</Link>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </section>
  );
}
