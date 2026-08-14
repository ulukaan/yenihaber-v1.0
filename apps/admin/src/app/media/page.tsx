"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  ImagePlus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./media.module.css";

type Kind = "all" | "haber" | "marka" | "genel";

type Item = {
  id: string;
  url: string;
  name: string;
  kind: string;
  size: number;
  mime: string | null;
  altText: string;
  credit: string;
  uploadedAt: string;
};

const TABS: { id: Kind; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "haber", label: "Haber görselleri" },
  { id: "marka", label: "Logo & marka" },
  { id: "genel", label: "Genel" },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function kindLabel(k: string) {
  if (k === "haber") return "Haber";
  if (k === "marka") return "Marka";
  return "Genel";
}

/**
 * Medya kütüphanesi — haber kapakları, site logoları, genel dosyalar
 */
export default function MediaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("all");
  const [uploadKind, setUploadKind] = useState<"haber" | "marka" | "genel">(
    "haber",
  );
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.media.list({
        kind: kind === "all" ? undefined : kind,
        q: q.trim() || undefined,
        limit: 96,
      });
      setItems(res.data);
      setTotal(res.meta.total);
      setCounts(res.meta.counts ?? {});
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [kind, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const allSelected = useMemo(
    () => items.length > 0 && items.every((it) => selected.has(it.id)),
    [items, selected],
  );

  const selectedCount = selected.size;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((it) => it.id)));
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      for (const file of Array.from(list)) {
        await adminApi.media.upload(file, { kind: uploadKind });
      }
      setOk(`${list.length} dosya yüklendi`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function sync() {
    setSyncing(true);
    setError("");
    setOk("");
    try {
      const res = await adminApi.media.sync();
      setOk(
        `Tarama: ${res.scanned} dosya · ${res.created} yeni kayıt eklendi`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Senkron başarısız");
    } finally {
      setSyncing(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu medya kaydı silinsin mi?")) return;
    setError("");
    try {
      await adminApi.media.remove(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    }
  }

  async function bulkRemove() {
    const ids = [...selected];
    if (!ids.length) return;
    if (
      !window.confirm(
        `${ids.length} medya kaydı kalıcı silinsin mi?\nDiskteki dosyalar da kaldırılır (marka klasörü hariç).`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await adminApi.media.bulkDelete(ids);
      setOk(`${res.deleted} medya silindi`);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toplu silme başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <AdminPage
        title="Medya kütüphanesi"
        subtitle="Haber kapakları, site logoları ve genel görseller. JPEG / PNG / WebP / GIF / SVG · max 8 MB · toplu seçip silebilirsiniz"
        wide
        actions={
          <div className={styles.headActions}>
            <button
              type="button"
              className={styles.btnGhost}
              disabled={syncing}
              onClick={() => void sync()}
            >
              <RefreshCw size={16} aria-hidden />
              {syncing ? "Taranıyor…" : "Diski tara"}
            </button>
            <label className={styles.uploadKind}>
              <span className={styles.srOnly}>Yükleme türü</span>
              <select
                value={uploadKind}
                onChange={(e) =>
                  setUploadKind(e.target.value as "haber" | "marka" | "genel")
                }
                aria-label="Yükleme kategorisi"
              >
                <option value="haber">Haber görseli</option>
                <option value="marka">Logo / marka</option>
                <option value="genel">Genel</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.btn}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus size={18} aria-hidden />
              {busy ? "Yükleniyor…" : "Yükle"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              multiple
              hidden
              onChange={(e) => void onFiles(e.target.files)}
            />
          </div>
        }
      >
        <div className={styles.toolbar}>
          <nav className={styles.tabs} aria-label="Medya filtresi">
            {TABS.map((t) => {
              const count =
                t.id === "all"
                  ? total ||
                    (counts.haber || 0) +
                      (counts.marka || 0) +
                      (counts.genel || 0)
                  : (counts[t.id] ?? 0);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={kind === t.id ? styles.tabOn : styles.tab}
                  onClick={() => setKind(t.id)}
                >
                  {t.label}
                  <em>{count}</em>
                </button>
              );
            })}
          </nav>
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
              placeholder="Dosya adında ara…"
              aria-label="Medya ara"
            />
          </form>
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

        {!loading && items.length ? (
          <div className={styles.selectBar} role="toolbar" aria-label="Toplu işlem">
            <label className={styles.selectAll}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Sayfadaki tümünü seç"
              />
              <span>{allSelected ? "Seçimi kaldır" : "Tümünü seç"}</span>
            </label>
            <span className={styles.selectCount}>
              {selectedCount > 0
                ? `${selectedCount} seçili`
                : `${items.length} görsel`}
            </span>
            {selectedCount > 0 ? (
              <>
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={busy}
                  onClick={() => void bulkRemove()}
                >
                  <Trash2 size={16} aria-hidden />
                  Seçilenleri sil ({selectedCount})
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  disabled={busy}
                  onClick={() => setSelected(new Set())}
                  aria-label="Seçimi temizle"
                >
                  <X size={16} aria-hidden />
                  Temizle
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <p className={styles.muted}>Yükleniyor…</p>
        ) : items.length ? (
          <div className={styles.grid}>
            {items.map((it) => {
              const isOn = selected.has(it.id);
              return (
                <article
                  key={it.id}
                  className={isOn ? styles.cardOn : styles.card}
                  data-selected={isOn ? "1" : "0"}
                >
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleOne(it.id)}
                      aria-label={`${it.name} seç`}
                    />
                  </label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.url}
                    alt={it.altText || it.name}
                    loading="lazy"
                    onClick={() => toggleOne(it.id)}
                  />
                  <div className={styles.meta}>
                    <div className={styles.metaText}>
                      <span className={styles.badge}>{kindLabel(it.kind)}</span>
                      <strong title={it.name}>{it.name}</strong>
                      <small>{formatBytes(it.size)}</small>
                    </div>
                    <div className={styles.metaActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => void copy(it.url)}
                        aria-label="URL kopyala"
                        title="URL kopyala"
                      >
                        {copied === it.url ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => void remove(it.id)}
                        aria-label="Sil"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <AdminEmpty
            title="Bu filtrede medya yok"
            description="Haber formundan yüklenen kapaklar, site logoları ve buradan yükledikleriniz burada listelenir."
            action={
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => void sync()}
              >
                Mevcut dosyaları tara ve ekle
              </button>
            }
          />
        )}
      </AdminPage>
    </AdminShell>
  );
}
