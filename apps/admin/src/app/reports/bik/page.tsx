"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { adminApi } from "@/lib/api";
import styles from "../../kurumsal/kurumsal.module.css";

type BikRow = {
  date: string;
  publishedCount: number;
  pageviews: number;
  uniqueVisitors: number | null;
  note: string | null;
};

/** BİK / İLANBİS günlük içerik + trafik özeti */
export default function BikRaporPage() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<BikRow[]>([]);
  const [totals, setTotals] = useState({ publishedCount: 0, pageviews: 0 });
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingDate, setSavingDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.dashboard.bik(days);
      setRows(res.data);
      setTotals(res.totals);
      setHint(res.hint);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveUv(date: string, raw: string) {
    setSavingDate(date);
    try {
      const trimmed = raw.trim();
      const uniqueVisitors =
        trimmed === "" ? null : Math.max(0, Number(trimmed) || 0);
      const updated = await adminApi.dashboard.bikPatch(date, {
        uniqueVisitors,
      });
      setRows((list) =>
        list.map((r) =>
          r.date === date
            ? { ...r, uniqueVisitors: updated.uniqueVisitors }
            : r,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setSavingDate(null);
    }
  }

  function downloadCsv() {
    const header = "tarih,yayinlanan_icerik,sayfa_goruntuleme,tekil_ziyaretci\n";
    const body = rows
      .map(
        (r) =>
          `${r.date},${r.publishedCount},${r.pageviews},${r.uniqueVisitors ?? ""}`,
      )
      .join("\n");
    const blob = new Blob([header + body], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bik-rapor-${days}gun.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <AdminPage
        title="BİK / İLANBİS özeti"
        subtitle="Günlük yayınlanan içerik ve sayfa görüntüleme — İLANBİS için CSV indir"
        actions={
          <div className={styles.actions}>
            <select
              className={styles.selectInline}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label="Gün aralığı"
            >
              <option value={7}>7 gün</option>
              <option value={30}>30 gün</option>
              <option value={90}>90 gün</option>
            </select>
            <AdminButton
              variant="ghost"
              onClick={() => void load()}
              disabled={loading}
            >
              Yenile
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={downloadCsv}
              disabled={!rows.length}
            >
              CSV indir
            </AdminButton>
          </div>
        }
      >
        {hint ? <p className={styles.muted}>{hint}</p> : null}
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {!loading ? (
          <p className={styles.muted}>
            Toplam {days} günde{" "}
            <strong>{totals.publishedCount}</strong> yayın ·{" "}
            <strong>{totals.pageviews.toLocaleString("tr-TR")}</strong> sayfa
            görüntüleme
          </p>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Yayınlanan içerik</th>
                <th>Sayfa görüntüleme</th>
                <th>Tekil ziyaretçi (UV)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td>{r.publishedCount}</td>
                  <td>{r.pageviews.toLocaleString("tr-TR")}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      defaultValue={r.uniqueVisitors ?? ""}
                      key={`${r.date}-${r.uniqueVisitors ?? "x"}`}
                      aria-label={`${r.date} tekil ziyaretçi`}
                      disabled={savingDate === r.date}
                      onBlur={(e) => void saveUv(r.date, e.target.value)}
                      style={{
                        width: 110,
                        minHeight: 36,
                        padding: "0 8px",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
