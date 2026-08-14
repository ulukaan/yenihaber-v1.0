"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiContactMessage } from "@yenihaber/shared";
import { Archive, Check, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./messages.module.css";

type Tab = "new" | "read" | "archived";

const TABS: { id: Tab; label: string }[] = [
  { id: "new", label: "Yeni" },
  { id: "read", label: "Okunan" },
  { id: "archived", label: "Arşiv" },
];

const TOPIC_LABEL: Record<string, string> = {
  genel: "Genel",
  ihbar: "Haber ihbarı",
  duzeltme: "Düzeltme",
  reklam: "Reklam",
  kvkk: "KVKK",
};

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

/** İletişim formu mesajları */
export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("new");
  const [items, setItems] = useState<ApiContactMessage[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    new: 0,
    read: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cur, allNew, allRead, allArch] = await Promise.all([
        adminApi.contact.list(tab),
        adminApi.contact.list("new"),
        adminApi.contact.list("read"),
        adminApi.contact.list("archived"),
      ]);
      setItems(cur.data);
      setCounts({
        new: allNew.data.length,
        read: allRead.data.length,
        archived: allArch.data.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: Tab) {
    setBusy(true);
    setOk("");
    setError("");
    try {
      await adminApi.contact.update(id, status);
      setOk(
        status === "read"
          ? "Okundu işaretlendi"
          : status === "archived"
            ? "Arşivlendi"
            : "Yeni olarak işaretlendi",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Mesaj kalıcı silinsin mi?")) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.contact.remove(id);
      setOk("Silindi");
      if (openId === id) setOpenId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function openMessage(m: ApiContactMessage) {
    setOpenId(m.id === openId ? null : m.id);
    if (m.status === "new") {
      try {
        await adminApi.contact.update(m.id, "read");
        setItems((prev) =>
          prev.map((x) =>
            x.id === m.id
              ? { ...x, status: "read", readAt: new Date().toISOString() }
              : x,
          ),
        );
        setCounts((c) => ({
          ...c,
          new: Math.max(0, c.new - 1),
          read: c.read + 1,
        }));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <AdminShell>
      <AdminPage
        title="Mesajlar"
        subtitle="Site iletişim formundan gelen talepler."
      >
        <div className={styles.tabs} role="tablist" aria-label="Mesaj durumu">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? styles.tabOn : styles.tab}
              onClick={() => {
                setTab(t.id);
                setOpenId(null);
              }}
            >
              {t.label}
              <em>{counts[t.id]}</em>
            </button>
          ))}
        </div>

        {error ? (
          <p className={styles.err} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className={styles.ok} role="status">
            {ok}
          </p>
        ) : null}

        {loading ? (
          <p className={styles.muted}>Yükleniyor…</p>
        ) : items.length === 0 ? (
          <AdminEmpty
            title="Bu sekmede mesaj yok"
            description="Site iletişim formundan yeni bir talep geldiğinde burada listelenir."
          />
        ) : (
          <ul className={styles.list}>
            {items.map((m) => {
              const open = openId === m.id;
              return (
                <li
                  key={m.id}
                  className={`${styles.card}${open ? ` ${styles.cardOpen}` : ""}${
                    m.status === "new" ? ` ${styles.cardNew}` : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.cardHead}
                    onClick={() => void openMessage(m)}
                    aria-expanded={open}
                  >
                    <span className={styles.cardMeta}>
                      <strong>{m.name || m.email || "Anonim"}</strong>
                      <span>
                        {TOPIC_LABEL[m.topic] ?? m.topic}
                        {m.subject ? ` · ${m.subject}` : ""}
                      </span>
                    </span>
                    <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time>
                  </button>
                  {open ? (
                    <div className={styles.cardBody}>
                      {m.email ? (
                        <p className={styles.email}>
                          <a href={`mailto:${m.email}`}>{m.email}</a>
                        </p>
                      ) : null}
                      <p className={styles.body}>{m.body}</p>
                      <div className={styles.actions}>
                        {m.status !== "read" ? (
                          <button
                            type="button"
                            className={styles.btn}
                            disabled={busy}
                            onClick={() => void setStatus(m.id, "read")}
                          >
                            <Check size={14} aria-hidden />
                            Okundu
                          </button>
                        ) : null}
                        {m.status !== "archived" ? (
                          <button
                            type="button"
                            className={styles.btn}
                            disabled={busy}
                            onClick={() => void setStatus(m.id, "archived")}
                          >
                            <Archive size={14} aria-hidden />
                            Arşivle
                          </button>
                        ) : null}
                        {m.status === "archived" ? (
                          <button
                            type="button"
                            className={styles.btn}
                            disabled={busy}
                            onClick={() => void setStatus(m.id, "new")}
                          >
                            Yeni yap
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={styles.btnDanger}
                          disabled={busy}
                          onClick={() => void remove(m.id)}
                          aria-label="Sil"
                        >
                          <Trash2 size={14} aria-hidden />
                          Sil
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminPage>
    </AdminShell>
  );
}
