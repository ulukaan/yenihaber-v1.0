"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardStats } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { adminApi } from "@/lib/api";
import styles from "./analytics.module.css";

/** Analitik özeti — detaylı chart sonraki dalga */
export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    adminApi.dashboard
      .stats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <AdminShell>
      <div className={styles.page}>
        <header className={styles.head}>
          <h1>Analitik</h1>
          <p>Yayın özeti (canlı trafik entegrasyonu yakında)</p>
        </header>
        <div className={styles.grid}>
          <div className={styles.card}>
            <span>Yayında</span>
            <strong>{stats?.articlesPublished ?? "—"}</strong>
          </div>
          <div className={styles.card}>
            <span>Bugün</span>
            <strong>{stats?.articlesPublishedToday ?? "—"}</strong>
          </div>
          <div className={styles.card}>
            <span>Anlık (tahmini)</span>
            <strong>{stats?.liveReaders ?? "—"}</strong>
          </div>
          <div className={styles.card}>
            <span>Yorum kuyruğu</span>
            <strong>{stats?.commentsPending ?? "—"}</strong>
          </div>
        </div>
        <p className={styles.note}>
          Gerçek zamanlı okuyucu için GA4 / Plausible bağlanacak. Şimdilik operasyonel özet.
        </p>
        <Link href="/dashboard" className={styles.back}>
          ← Panele dön
        </Link>
      </div>
    </AdminShell>
  );
}
