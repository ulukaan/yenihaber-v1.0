"use client";

import { SITE_ORIGIN } from "@/lib/public-env";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiComment, CommentStatus } from "@yenihaber/shared";
import {
  Archive,
  Check,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import styles from "./comments.module.css";

type Tab = "BEKLEMEDE" | "ONAYLI" | "ARSIV" | "COP";

const TABS: { id: Tab; label: string; hint: string }[] = [
  {
    id: "BEKLEMEDE",
    label: "Onay bekleyen",
    hint: "Sitede görünmez — iş burada",
  },
  { id: "ONAYLI", label: "Yayında", hint: "Sitede görünür" },
  { id: "ARSIV", label: "Arşiv", hint: "Sorunlu değil, geri alınabilir" },
  { id: "COP", label: "Çöp", hint: "30 gün sonra kalıcı silinir" },
];

const WEB_URL = (
  SITE_ORIGIN
).replace(/\/$/, "");

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Yorum moderasyonu — durum değiştirir, silmez
 */
export default function CommentsPage() {
  const [tab, setTab] = useState<Tab>("BEKLEMEDE");
  const [items, setItems] = useState<ApiComment[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    BEKLEMEDE: 0,
    ONAYLI: 0,
    ARSIV: 0,
    COP: 0,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.comments.list({
        status: tab,
        q: q.trim() || undefined,
        limit: 100,
      });
      setItems(res.data);
      setCounts({
        BEKLEMEDE: res.meta.counts.BEKLEMEDE,
        ONAYLI: res.meta.counts.ONAYLI,
        ARSIV: res.meta.counts.ARSIV,
        COP: res.meta.counts.COP,
      });
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [tab, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const allChecked = useMemo(
    () => items.length > 0 && items.every((i) => selected.has(i.id)),
    [items, selected],
  );

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((i) => i.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function setStatus(ids: string[], status: CommentStatus) {
    if (!ids.length) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      if (ids.length === 1) {
        await adminApi.comments.moderate(ids[0]!, status);
      } else {
        await adminApi.comments.bulk(ids, status);
      }
      const labels: Record<CommentStatus, string> = {
        BEKLEMEDE: "onay kuyruğuna alındı",
        ONAYLI: "yayınlandı",
        ARSIV: "arşivlendi",
        COP: "çöpe atıldı",
      };
      setOk(
        `${ids.length} yorum ${labels[status]} (cevaplar da aynı duruma geçti)`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  const bulkIds = [...selected];

  return (
    <AdminShell>
      <AdminPage
        title="Yorumlar"
        subtitle="Her aksiyon durumu değiştirir — yorum silinmez. Arşiv geri alınabilir; çöp 30 gün saklanır."
      >
        <nav className={styles.tabs} aria-label="Yorum durumu">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? styles.tabOn : styles.tab}
              onClick={() => setTab(t.id)}
              title={t.hint}
            >
              {t.label}
              <em>{counts[t.id]}</em>
            </button>
          ))}
        </nav>

        <div className={styles.toolbar}>
          <form
            className={styles.search}
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            <Search size={16} aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Yorum veya isimde ara…"
              aria-label="Yorum ara"
            />
          </form>

          <div className={styles.bulk}>
            <span className={styles.bulkCount}>
              {bulkIds.length ? `${bulkIds.length} seçili` : "Toplu işlem"}
            </span>
            <button
              type="button"
              className={styles.btnSuccess}
              disabled={busy || !bulkIds.length}
              onClick={() => void setStatus(bulkIds, "ONAYLI")}
            >
              <Check size={15} aria-hidden />
              Onayla
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              disabled={busy || !bulkIds.length}
              onClick={() => void setStatus(bulkIds, "ARSIV")}
            >
              <Archive size={15} aria-hidden />
              Arşivle
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              disabled={busy || !bulkIds.length}
              onClick={() => void setStatus(bulkIds, "COP")}
            >
              <Trash2 size={15} aria-hidden />
              Çöpe at
            </button>
            {tab === "COP" || tab === "ARSIV" ? (
              <button
                type="button"
                className={styles.btnGhost}
                disabled={busy || !bulkIds.length}
                onClick={() => void setStatus(bulkIds, "BEKLEMEDE")}
              >
                Kuyruğa al
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className={styles.ok} role="status">
            {ok}
          </p>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colCheck}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Tümünü seç"
                    disabled={!items.length}
                  />
                </th>
                <th>Yorum</th>
                <th>Yazar</th>
                <th>Haber</th>
                <th>Tarih</th>
                <th className={styles.colActions}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Yükleniyor…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Bu sekmede yorum yok.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const href = item.article?.slug
                    ? `${WEB_URL}/haber/${item.article.slug}`
                    : null;
                  return (
                    <tr key={item.id}>
                      <td className={styles.colCheck}>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleOne(item.id)}
                          aria-label={`${item.name} yorumunu seç`}
                        />
                      </td>
                      <td>
                        <p className={styles.body}>{item.content}</p>
                        {item.isQuick ? (
                          <span className={styles.chip}>hızlı</span>
                        ) : null}
                        {item.parentId ? (
                          <span className={styles.chipMuted}>cevap</span>
                        ) : null}
                      </td>
                      <td>
                        <strong className={styles.author}>{item.name}</strong>
                      </td>
                      <td>
                        {href && item.article ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.articleLink}
                          >
                            {item.article.title}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td className={styles.date}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td className={styles.colActions}>
                        <div className={styles.rowActions}>
                          {tab !== "ONAYLI" ? (
                            <button
                              type="button"
                              className={styles.iconOk}
                              disabled={busy}
                              onClick={() =>
                                void setStatus([item.id], "ONAYLI")
                              }
                              aria-label="Onayla"
                              title="Onayla / yayına al"
                            >
                              <Check size={16} />
                            </button>
                          ) : null}
                          {tab !== "ARSIV" ? (
                            <button
                              type="button"
                              className={styles.iconArch}
                              disabled={busy}
                              onClick={() =>
                                void setStatus([item.id], "ARSIV")
                              }
                              aria-label="Arşivle"
                              title="Arşivle"
                            >
                              <Archive size={16} />
                            </button>
                          ) : null}
                          {tab !== "COP" ? (
                            <button
                              type="button"
                              className={styles.iconTrash}
                              disabled={busy}
                              onClick={() => void setStatus([item.id], "COP")}
                              aria-label="Çöpe at"
                              title="Çöpe at"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.iconOk}
                              disabled={busy}
                              onClick={() =>
                                void setStatus([item.id], "ONAYLI")
                              }
                              aria-label="Geri yükle"
                              title="Yayına geri al"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
