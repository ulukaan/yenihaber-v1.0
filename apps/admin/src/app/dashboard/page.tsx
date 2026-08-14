"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ArticleStatus, DashboardStats } from "@yenihaber/shared";
import { ARTICLE_STATUS_LABELS } from "@yenihaber/shared";
import { StatusDot, type StatusDotTone } from "@yenihaber/ui";
import { FolderPlus, ImagePlus, Newspaper, UserPlus, Video } from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import styles from "./dashboard.module.css";

function statusTone(status: ArticleStatus): StatusDotTone {
  if (status === "YAYINDA") return "ok";
  if (status === "ONAYDA") return "warn";
  if (status === "ZAMANLANMIS") return "info";
  if (status === "TASLAK") return "muted";
  return "muted";
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}K`;
  return formatInt(n);
}

function formatRel(iso: string | null, fallback: string): string {
  const raw = iso ?? fallback;
  const d = new Date(raw);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h} sa önce`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Dün";
  }
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard
      .stats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Hata"))
      .finally(() => setLoading(false));
  }, []);

  const chart = useMemo(() => {
    const series = stats?.trafficWeek ?? [];
    const max = Math.max(1, ...series.map((d) => d.visitors));
    return { series, max };
  }, [stats]);

  const weekTotals = useMemo(() => {
    const days = stats?.trafficWeek ?? [];
    return {
      visitors: days.reduce((s, d) => s + d.visitors, 0),
      pageviews: days.reduce((s, d) => s + d.pageviews, 0),
      sessions: days.reduce((s, d) => s + d.sessions, 0),
      avgSec: days.length
        ? Math.round(days.reduce((s, d) => s + d.avgSessionSec, 0) / days.length)
        : 0,
    };
  }, [stats]);

  const news =
    stats?.todayArticles?.length ? stats.todayArticles : stats?.recentArticles ?? [];

  const kpi = stats
    ? [
        {
          key: "haber",
          label: "Haberler",
          value: formatInt(stats.articlesPublished),
          hint: `+${stats.articlesTodayDelta ?? stats.articlesPublishedToday} bugün`,
          href: "/articles",
        },
        {
          key: "views",
          label: "Görüntülenme",
          value: formatCompact(stats.viewsTotal ?? 0),
          hint:
            (stats.viewsWeekChangePct ?? 0) >= 0
              ? `+${stats.viewsWeekChangePct ?? 0}% haftalık`
              : `${stats.viewsWeekChangePct}% haftalık`,
          href: "/analytics",
        },
        {
          key: "yazar",
          label: "Yazarlar",
          value: formatInt(stats.columnistsTotal),
          hint: `aktif ${stats.columnistsActive ?? 0}`,
          href: "/users",
        },
        {
          key: "uye",
          label: "Üyeler",
          value: formatInt(stats.membersTotal ?? stats.usersTotal),
          hint: `+${stats.membersTodayDelta ?? 0} bugün`,
          href: "/users",
        },
      ]
    : [];

  const queueItems = stats
    ? [
        { n: stats.queue?.drafts ?? stats.articlesDraft, label: "Taslak haber", href: "/articles" },
        {
          n: stats.queue?.scheduled ?? stats.articlesScheduled,
          label: "Planlanmış haber",
          href: "/articles",
        },
        {
          n: stats.queue?.pendingComments ?? stats.commentsPending,
          label: "Bekleyen yorum",
          href: "/comments",
        },
        {
          n: stats.queue?.pendingAuthors ?? stats.articlesPending,
          label: "Onay bekleyen",
          href: "/articles",
        },
        {
          n: stats.queue?.missingCovers ?? stats.missingCoverCount ?? 0,
          label: "Eksik kapak görseli",
          href: "/articles",
        },
      ]
    : [];

  return (
    <AdminShell>
      <AdminPage
        title="Dashboard"
        subtitle="Sitenin nabzı — yayın, trafik, kuyruk"
        wide
      >
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        {stats ? (
          <>
            {/* 1 · KPI */}
            <section className={styles.kpiRow} aria-label="Özet istatistikler">
              {kpi.map((c) => (
                <Link key={c.key} href={c.href} className={styles.kpi}>
                  <span className={styles.kpiLabel}>{c.label}</span>
                  <strong className={styles.kpiVal}>{c.value}</strong>
                  <span className={styles.kpiHint}>{c.hint}</span>
                </Link>
              ))}
            </section>

            {/* 2 · Trafik + Canlı */}
            <div className={styles.split}>
              <section className={styles.panel} aria-labelledby="traf-h">
                <header className={styles.panelHead}>
                  <h2 id="traf-h">Son 7 gün ziyaretçi</h2>
                  <span className={styles.panelHint}>Tahmini · GA bağlantısı yakında</span>
                </header>
                <div className={styles.chart} role="img" aria-label="Haftalık ziyaretçi grafiği">
                  {chart.series.map((d) => (
                    <div key={d.date} className={styles.chartCol}>
                      <div className={styles.chartBarTrack}>
                        <div
                          className={styles.chartBar}
                          style={{
                            height: `${Math.max(6, Math.round((d.visitors / chart.max) * 100))}%`,
                          }}
                          title={`${d.label}: ${formatInt(d.visitors)}`}
                        />
                      </div>
                      <span className={styles.chartLabel}>{d.label}</span>
                    </div>
                  ))}
                </div>
                <dl className={styles.metricRow}>
                  <div>
                    <dt>Ziyaretçi</dt>
                    <dd>{formatCompact(weekTotals.visitors)}</dd>
                  </div>
                  <div>
                    <dt>Sayfa görüntülenme</dt>
                    <dd>{formatCompact(weekTotals.pageviews)}</dd>
                  </div>
                  <div>
                    <dt>Oturum</dt>
                    <dd>{formatCompact(weekTotals.sessions)}</dd>
                  </div>
                  <div>
                    <dt>Ort. oturum</dt>
                    <dd>{formatDuration(weekTotals.avgSec)}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.panel} aria-labelledby="live-h">
                <header className={styles.panelHead}>
                  <h2 id="live-h">
                    <span className={styles.liveDot} aria-hidden />
                    Canlı durum
                  </h2>
                </header>
                <ul className={styles.liveList}>
                  <li>
                    <span>Şu anda sitede</span>
                    <strong>{formatInt(stats.liveReaders)} kişi</strong>
                  </li>
                  <li>
                    <span>Bugün yayınlanan</span>
                    <strong>{formatInt(stats.articlesPublishedToday)}</strong>
                  </li>
                  <li>
                    <span>Taslak haber</span>
                    <strong>{formatInt(stats.articlesDraft)}</strong>
                  </li>
                  <li>
                    <span>Planlanmış haber</span>
                    <strong>{formatInt(stats.articlesScheduled)}</strong>
                  </li>
                  <li>
                    <span>Bekleyen yorum</span>
                    <strong>{formatInt(stats.commentsPending)}</strong>
                  </li>
                </ul>
              </section>
            </div>

            {/* 3 · Bugünün haberleri + Kuyruk */}
            <div className={styles.splitWide}>
              <section className={styles.panel} aria-labelledby="today-h">
                <header className={styles.panelHead}>
                  <h2 id="today-h">Bugünün haberleri</h2>
                  <Link href="/articles" className={styles.moreLink}>
                    Tümünü gör →
                  </Link>
                </header>
                {news.length === 0 ? (
                  <p className={styles.muted}>Kayıt yok.</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th scope="col">Başlık</th>
                          <th scope="col">Kategori</th>
                          <th scope="col">Yazar</th>
                          <th scope="col">Zaman</th>
                          <th scope="col">Görüntülenme</th>
                          <th scope="col">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {news.slice(0, 10).map((a) => (
                          <tr key={a.id}>
                            <td>
                              <Link href={`/articles/${a.id}`} className={styles.newsTitle}>
                                {a.title}
                              </Link>
                            </td>
                            <td className={styles.cellMuted}>{a.categoryName}</td>
                            <td className={styles.cellMuted}>{a.authorName}</td>
                            <td className={styles.cellMuted}>
                              {formatRel(a.publishedAt, a.updatedAt)}
                            </td>
                            <td className={styles.cellNum}>
                              {formatInt(a.viewCount ?? 0)}
                            </td>
                            <td>
                              <StatusDot
                                tone={statusTone(a.status as ArticleStatus)}
                                label={
                                  ARTICLE_STATUS_LABELS[a.status as ArticleStatus] ??
                                  a.status
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className={styles.panel} aria-labelledby="queue-h">
                <header className={styles.panelHead}>
                  <h2 id="queue-h">İşlem bekleyenler</h2>
                </header>
                <ul className={styles.queueList}>
                  {queueItems.map((q) => (
                    <li key={q.label}>
                      <Link href={q.href} className={styles.queueRow}>
                        <strong className={q.n > 0 ? styles.queueHot : undefined}>
                          {q.n}
                        </strong>
                        <span>{q.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/comments" className={styles.moreLinkBlock}>
                  Hepsini gör →
                </Link>
              </section>
            </div>

            {/* 4 · Yazar + kategori */}
            <div className={styles.splitEqual}>
              <section className={styles.panel} aria-labelledby="auth-h">
                <header className={styles.panelHead}>
                  <h2 id="auth-h">En çok okunan yazarlar</h2>
                  <Link href="/users" className={styles.moreLink}>
                    Tümü →
                  </Link>
                </header>
                {!(stats.topAuthors?.length) ? (
                  <p className={styles.muted}>Veri yok.</p>
                ) : (
                  <ol className={styles.rankList}>
                    {stats.topAuthors.map((a, i) => (
                      <li key={a.id}>
                        <span className={styles.rankNum}>{i + 1}</span>
                        <div className={styles.rankBody}>
                          <strong>{a.name}</strong>
                          <span>
                            {a.articleCount} yazı · ort. {formatCompact(a.viewsAvg)}
                          </span>
                        </div>
                        <span className={styles.rankVal}>
                          {formatCompact(a.viewsTotal)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className={styles.panel} aria-labelledby="cat-h">
                <header className={styles.panelHead}>
                  <h2 id="cat-h">Kategori performansı</h2>
                  <Link href="/categories" className={styles.moreLink}>
                    Tümü →
                  </Link>
                </header>
                {!(stats.categoryPerformance?.length) ? (
                  <p className={styles.muted}>Veri yok.</p>
                ) : (
                  <ul className={styles.barList}>
                    {stats.categoryPerformance.map((c) => (
                      <li key={c.slug}>
                        <div className={styles.barTop}>
                          <span>{c.name}</span>
                          <strong>{c.sharePct}%</strong>
                        </div>
                        <div className={styles.barTrack} aria-hidden>
                          <div
                            className={styles.barFill}
                            style={{ width: `${Math.min(100, c.sharePct)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* 5 · Hızlı işlemler */}
            <section className={styles.panel} aria-labelledby="quick-h">
              <header className={styles.panelHead}>
                <h2 id="quick-h">Hızlı işlemler</h2>
              </header>
              <div className={styles.quickRow}>
                <Link href="/articles/new" className={styles.quickPrimary}>
                  <Newspaper size={18} aria-hidden />
                  + Haber
                </Link>
                <Link href="/users" className={styles.quickBtn}>
                  <UserPlus size={18} aria-hidden />
                  + Yazar
                </Link>
                <Link href="/categories" className={styles.quickBtn}>
                  <FolderPlus size={18} aria-hidden />
                  + Kategori
                </Link>
                <Link href="/media" className={styles.quickBtn} title="Yakında">
                  <Video size={18} aria-hidden />
                  + Video
                </Link>
                <Link href="/media" className={styles.quickBtn} title="Yakında">
                  <ImagePlus size={18} aria-hidden />
                  + Galeri
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </AdminPage>
    </AdminShell>
  );
}
