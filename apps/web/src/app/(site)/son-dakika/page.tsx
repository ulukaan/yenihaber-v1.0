import type { Metadata } from "next";
import { publicApi } from "@/lib/api";
import { NewsCard } from "@/components/news-card/news-card";
import { SidebarWidgets } from "@/components/sidebar-widgets/sidebar-widgets";
import styles from "@/styles/category.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Son Dakika" };

export default async function BreakingPage() {
  let items: Awaited<ReturnType<typeof publicApi.articles.breaking>> = [];
  let latest: Awaited<ReturnType<typeof publicApi.articles.list>> = {
    data: [],
    meta: { page: 1, limit: 8, total: 0, totalPages: 1 },
  };
  try {
    [items, latest] = await Promise.all([
      publicApi.articles.breaking(),
      publicApi.articles.list({ page: 1, limit: 8 }),
    ]);
  } catch {
    items = [];
  }

  return (
    <div className={`yh-container ${styles.page}`}>
      <header className={styles.head}>
        <p className={styles.kicker}>Canlı akış</p>
        <h1>Son Dakika</h1>
        <p>Öne çıkan acil ve güncel başlıklar anbean yenilenir</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.grid}>
            {items.map((article) => (
              <NewsCard key={article.id} article={article} variant="hero" />
            ))}
            {!items.length ? <p>Şu an son dakika haberi yok.</p> : null}
          </div>
        </div>
        <aside className={styles.side}>
          <SidebarWidgets
            breaking={items}
            popular={latest.data}
            context="breaking"
          />
        </aside>
      </div>
    </div>
  );
}
