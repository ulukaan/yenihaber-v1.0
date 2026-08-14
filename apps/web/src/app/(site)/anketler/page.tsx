import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import { tarihBicimle } from "@/lib/format-date";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anket arşivi | Düzce Radikal",
  description:
    "Günün anketleri ve kapanan oylamaların sonuçları — Düzce Radikal arşivi.",
};

export default async function PollsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1) || 1);
  let data: Awaited<ReturnType<typeof publicApi.polls.archive>> = {
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
  try {
    data = await publicApi.polls.archive({ page, limit: 20 });
  } catch {
    /* empty */
  }

  return (
    <div className={styles.page}>
      <div className={`yh-container ${styles.inner}`}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Topluluk</p>
          <h1>Anket arşivi</h1>
          <p>
            Kapanan ve süresi dolan anketlerin sonuçları burada kalır. Günlük
            anketi site yan sütununda bulabilirsiniz.
          </p>
        </header>

        {!data.data.length ? (
          <p className={styles.empty}>Henüz arşivlenecek anket yok.</p>
        ) : (
          <ul className={styles.list}>
            {data.data.map((poll) => (
              <li key={poll.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h2>{poll.question}</h2>
                  <p className={styles.meta}>
                    {tarihBicimle(poll.endAt || poll.createdAt, "absolute")}
                    {poll.articleSlug && poll.articleTitle ? (
                      <>
                        {" · "}
                        <Link href={`/haber/${poll.articleSlug}`}>
                          {poll.articleTitle}
                        </Link>
                      </>
                    ) : (
                      " · Genel anket"
                    )}
                    {` · ${poll.totalVotes.toLocaleString("tr-TR")} oy`}
                  </p>
                </div>
                <ul className={styles.bars}>
                  {poll.options.map((o) => (
                    <li key={o.id}>
                      <div className={styles.barHead}>
                        <span>{o.label}</span>
                        <strong>%{o.percent}</strong>
                      </div>
                      <div className={styles.track}>
                        <div
                          className={styles.fill}
                          style={{ width: `${o.percent}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {data.meta.totalPages > 1 ? (
          <nav className={styles.pager} aria-label="Sayfalar">
            {page > 1 ? (
              <Link href={`/anketler?page=${page - 1}`}>Önceki</Link>
            ) : (
              <span />
            )}
            <span>
              {page} / {data.meta.totalPages}
            </span>
            {page < data.meta.totalPages ? (
              <Link href={`/anketler?page=${page + 1}`}>Sonraki</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
