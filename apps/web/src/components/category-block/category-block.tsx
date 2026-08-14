import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { NewsCard } from "@/components/news-card/news-card";
import { Copy } from "@/lib/copy";
import styles from "./category-block.module.css";

export type CategoryBlockProps = {
  title: string;
  slug: string;
  articles: ApiArticle[];
  tone?: "default" | "dark";
};

/** Kategori satırı — 1 büyük + yan listeler */
export function CategoryBlock({
  title,
  slug,
  articles,
  tone = "default",
}: CategoryBlockProps) {
  if (!articles.length) return null;
  const [lead, ...rest] = articles;
  const mid = rest.slice(0, 2);
  const tail = rest.slice(2, 5);

  return (
    <section
      className={`${styles.block} ${tone === "dark" ? styles.dark : ""}`}
      aria-labelledby={`cat-${slug}`}
    >
      <div className={styles.head}>
        <h2 id={`cat-${slug}`}>{title}</h2>
        <Link href={`/kategori/${slug}`} className={styles.more}>
          {Copy.seeAll}
          <span aria-hidden>→</span>
        </Link>
      </div>
      <div className={styles.grid}>
        {lead ? <NewsCard article={lead} variant="hero" /> : null}
        <div className={styles.mid}>
          {mid.map((a) => (
            <NewsCard key={a.id} article={a} variant="default" />
          ))}
        </div>
        <div className={styles.tail}>
          {tail.map((a) => (
            <NewsCard key={a.id} article={a} variant="rail" />
          ))}
        </div>
      </div>
    </section>
  );
}
