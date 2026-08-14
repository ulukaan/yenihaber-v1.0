"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./logs.module.css";

type LogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

/** Sistem / audit logları */
export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [actions, setActions] = useState<{ action: string; count: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.logs.list({
        page,
        limit: 40,
        q: q.trim() || undefined,
        action: action || undefined,
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loglar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [page, q, action]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    adminApi.logs
      .actions()
      .then((r) => setActions(r.data))
      .catch(() => setActions([]));
  }, []);

  return (
    <AdminShell>
      <AdminPage
        title="Loglar"
        subtitle="Yayın, oturum ve yönetim eylemleri — AuditLog"
        wide
        actions={<span className={styles.total}>{total} kayıt</span>}
      >
        <div className={styles.filters}>
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Ara: aksiyon, entity…"
            aria-label="Log ara"
          />
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            aria-label="Aksiyon filtre"
          >
            <option value="">Tüm aksiyonlar</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action} ({a.count})
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Aksiyon</th>
                <th>Varlık</th>
                <th>Kullanıcı</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Date(r.createdAt).toLocaleString("tr-TR", {
                      timeZone: "Europe/Istanbul",
                    })}
                  </td>
                  <td>
                    <code>{r.action}</code>
                  </td>
                  <td>
                    {r.entityType}
                    {r.entityId ? (
                      <span className={styles.id}> · {r.entityId.slice(0, 10)}</span>
                    ) : null}
                  </td>
                  <td>{r.actor?.name ?? "—"}</td>
                  <td className={styles.meta}>
                    {r.meta ? r.meta.slice(0, 80) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <AdminEmpty
            title="Kayıt yok"
            description="Seçilen filtrelere uygun bir işlem günlüğü bulunamadı."
          />
        ) : null}

        <div className={styles.pager}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Önceki
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </button>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
