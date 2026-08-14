"use client";

import { useCallback, useEffect, useState } from "react";
import {
  REACTION_LABELS,
  REACTION_ORDER,
  type ReactionType,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./page.module.css";

/**
 * Editör nabız — en çok tepki alan haberler
 */
export default function ReactionsInsightsPage() {
  const [type, setType] = useState<ReactionType>("kizdim");
  const [rows, setRows] = useState<
    Array<{
      articleId: string;
      count: number;
      title: string;
      slug: string;
      coverImage: string | null;
      categoryName: string;
      publishedAt: string | null;
    }>
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.reactions.insights({ type, limit: 20 });
      setRows(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <AdminPage
        title="Tepki nabzı"
        subtitle="Okuma sayısından daha net sinyal — hangi haber hangi duyguyu tetikliyor."
        className={styles.page}
      >
        <div className="adminTabs" role="tablist" aria-label="Tepki tipi">
          {REACTION_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={type === id}
              className="adminTab"
              data-active={type === id}
              onClick={() => setType(id)}
            >
              {REACTION_LABELS[id]}
            </button>
          ))}
        </div>
        {error ? <p className={styles.err}>{error}</p> : null}
        {loading ? (
          <p className={styles.muted}>Yükleniyor…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty
            title="Henüz veri yok"
            description="Seçtiğiniz tepki türü için sıralanacak haber bulunmuyor. Yayında haber biriktikçe burası dolacak."
          />
        ) : (
          <ol className={styles.list}>
            {rows.map((r, i) => (
              <li key={r.articleId}>
                <span className={styles.rank}>{i + 1}</span>
                {r.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverImage} alt="" className={styles.thumb} />
                ) : (
                  <span className={styles.thumbPh} />
                )}
                <div className={styles.meta}>
                  <a href={`/articles/${r.articleId}`}>{r.title}</a>
                  <span>
                    {r.categoryName} · {r.count.toLocaleString("tr-TR")} tepki
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </AdminPage>
    </AdminShell>
  );
}
