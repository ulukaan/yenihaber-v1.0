import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/server-api";
import { NewsCard } from "@/components/news-card/news-card";
import styles from "@/styles/category.module.css";
import searchStyles from "./search.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Arama" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  let results: Awaited<ReturnType<typeof publicApi.articles.list>> = {
    data: [],
    meta: { page: 1, limit: 24, total: 0, totalPages: 1 },
  };
  let authors: Awaited<ReturnType<typeof publicApi.authors.list>> = [];

  if (term) {
    try {
      const [art, auth] = await Promise.all([
        publicApi.articles.list({ q: term, page: 1, limit: 24 }),
        publicApi.authors.list({ q: term, limit: 16 }),
      ]);
      results = art;
      authors = auth;
    } catch {
      results = {
        data: [],
        meta: { page: 1, limit: 24, total: 0, totalPages: 1 },
      };
      authors = [];
    }
  }

  return (
    <div className={`yh-container ${styles.page}`}>
      <header className={styles.head}>
        <h1>Arama</h1>
        <p>
          {term
            ? `"${term}" · ${authors.length} yazar, ${results.meta.total} haber`
            : "Haber veya yazar arayın"}
        </p>
      </header>

      {term && authors.length > 0 ? (
        <section className={searchStyles.authorsBlock} aria-label="Yazar sonuçları">
          <h2 className={searchStyles.sectionTitle}>Yazarlar</h2>
          <ul className={searchStyles.authors}>
            {authors.map((a) => (
              <li key={a.id}>
                <Link href={`/yazar/${a.slug}`} className={searchStyles.authorCard}>
                  <span className={searchStyles.avatar} aria-hidden>
                    {(a.name || "?").slice(0, 1).toLocaleUpperCase("tr-TR")}
                  </span>
                  <span>
                    <strong>{a.name}</strong>
                    <span className={searchStyles.sub}>
                      {a.title || (a.isColumnist ? "Köşe yazarı" : "Yazar")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {term ? (
        <section aria-label="Haber sonuçları">
          <h2 className={searchStyles.sectionTitle}>Haberler</h2>
          <div className={styles.grid}>
            {results.data.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          {results.data.length === 0 && authors.length === 0 ? (
            <p className={searchStyles.empty}>Sonuç bulunamadı.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
