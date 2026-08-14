"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ApiTag, ApiTagListMeta, ApiTagPair } from "@yenihaber/shared";
import {
  TAG_FEATURED_MAX,
  TAG_INDEX_MIN,
  normalizeTagName,
  tagSlugFromName,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import styles from "./tags.module.css";

type Tab = "all" | "featured" | "rare" | "similar";

function relativeTr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${min} dk`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat`;
  const day = Math.floor(h / 24);
  if (day === 1) return "Dün";
  if (day < 30) return `${day} gün`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} ay`;
  return `${Math.floor(mo / 12)} yıl`;
}

function statusLabel(t: ApiTag): { text: string; kind: "feat" | "noindex" | "ok" } {
  if (t.isFeatured) return { text: "Öne çıkan", kind: "feat" };
  if (!t.indexable) return { text: "İndekslenmiyor", kind: "noindex" };
  return { text: "Yayında", kind: "ok" };
}

export default function TagsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [rows, setRows] = useState<ApiTag[]>([]);
  const [pairs, setPairs] = useState<ApiTagPair[]>([]);
  const [meta, setMeta] = useState<ApiTagListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.tags.list({
        filter: tab,
        q: q || undefined,
        page,
        limit: 25,
      });
      setMeta(res.meta);
      if (tab === "similar") {
        setPairs(res.data as ApiTagPair[]);
        setRows([]);
      } else {
        setRows(res.data as ApiTag[]);
        setPairs([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [tab, page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [tab]);

  const counts = meta?.counts;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll(ids: string[]) {
    setSelected((prev) => {
      if (ids.every((id) => prev.has(id))) return new Set();
      return new Set(ids);
    });
  }

  async function createTag() {
    const name = normalizeTagName(newName);
    if (name.length < 2) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.tags.create({ name });
      setNewName("");
      setOk("Etiket oluşturuldu");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  async function featureSelected(on: boolean) {
    if (!selected.size) return;
    setBusy(true);
    try {
      await adminApi.tags.bulk({
        ids: [...selected],
        action: on ? "feature" : "unfeature",
      });
      setOk(on ? "Öne çıkarıldı" : "Öne çıkarma kaldırıldı");
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (
      !window.confirm(
        `${selected.size} etiket silinecek (yalnızca 0 haberli). Onaylıyor musunuz?`,
      )
    )
      return;
    setBusy(true);
    try {
      await adminApi.tags.bulk({ ids: [...selected], action: "delete" });
      setOk("Silindi");
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi — haberliyse birleştirin");
    } finally {
      setBusy(false);
    }
  }

  async function confirmMerge() {
    if (!mergeTarget || selected.size < 1) return;
    const sources = [...selected].filter((id) => id !== mergeTarget);
    if (!sources.length) {
      setError("Hedef dışında en az bir kaynak seçin");
      return;
    }
    const target = rows.find((t) => t.id === mergeTarget);
    if (
      !window.confirm(
        `Birleştirme geri alınamaz.\n${sources.length} etiket → «${target?.name ?? "hedef"}» taşınır,\neski slug’lara 301 yazılır, kaynaklar silinir.\nDevam?`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await adminApi.tags.merge({
        sourceIds: sources,
        targetId: mergeTarget,
      });
      setOk(
        `Birleştirildi · ${res.movedLinks} ilişki taşındı · 301 kaydı yazıldı`,
      );
      setSelected(new Set());
      setMergeOpen(false);
      setMergeTarget("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Birleştirme başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function mergePair(sourceId: string, targetId: string) {
    if (
      !window.confirm(
        "Bu benzer çifti birleştirmek geri alınamaz. Kaynak silinir, 301 yazılır. Onay?",
      )
    )
      return;
    setBusy(true);
    try {
      const res = await adminApi.tags.merge({
        sourceIds: [sourceId],
        targetId,
      });
      setOk(`Birleştirildi · ${res.movedLinks} ilişki`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Birleştirme başarısız");
    } finally {
      setBusy(false);
    }
  }

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const start = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <AdminShell>
      <AdminPage
        title="Etiketler"
        subtitle={`Özel isim · normalize slug · birleştirme · ${TAG_INDEX_MIN}+ haber indekslenir · max ${TAG_FEATURED_MAX} öne çıkan`}
        wide
        actions={
          <div className={styles.newRow}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Yeni etiket adı"
              aria-label="Yeni etiket"
              onKeyDown={(e) => {
                if (e.key === "Enter") void createTag();
              }}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={busy || newName.trim().length < 2}
              onClick={() => void createTag()}
            >
              <Plus size={18} aria-hidden />
              Yeni etiket
            </button>
          </div>
        }
      >
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}

        <div className={styles.tabs} role="tablist" aria-label="Etiket filtreleri">
          {(
            [
              ["all", "Tümü", counts?.all],
              ["featured", "Öne çıkan", counts?.featured],
              ["rare", "Az kullanılan", counts?.rare],
              ["similar", "Benzerler", counts?.similar],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? styles.tabOn : styles.tab}
              onClick={() => setTab(id)}
            >
              {label}
              {n !== undefined ? <span>{n}</span> : null}
            </button>
          ))}
        </div>

        {tab !== "similar" ? (
          <div className={styles.toolbar}>
            <input
              className={styles.search}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Ara…"
              aria-label="Etiket ara"
            />
          </div>
        ) : null}

        {selected.size > 0 && tab !== "similar" ? (
          <div className={styles.bulk} role="region" aria-label="Toplu işlem">
            <strong>{selected.size} etiket seçildi</strong>
            <div className={styles.bulkActions}>
              <button
                type="button"
                className={styles.bulkBtn}
                disabled={busy || selected.size < 2}
                onClick={() => {
                  setMergeOpen(true);
                  setMergeTarget([...selected][0] ?? "");
                }}
              >
                Birleştir
              </button>
              <button
                type="button"
                className={styles.bulkBtn}
                disabled={busy}
                onClick={() => void featureSelected(true)}
              >
                Öne çıkar
              </button>
              <button
                type="button"
                className={styles.bulkBtnDanger}
                disabled={busy}
                onClick={() => void deleteSelected()}
              >
                Sil
              </button>
            </div>
          </div>
        ) : null}

        {mergeOpen ? (
          <div className={styles.mergeDialog} role="dialog" aria-modal="true">
            <p>
              Hedef etiket (kaynaklar buraya taşınır, eski slug’lara 301, kaynak
              silinir — loglanır):
            </p>
            <select
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              aria-label="Birleştirme hedefi"
            >
              {[...selected].map((id) => {
                const t = rows.find((r) => r.id === id);
                return (
                  <option key={id} value={id}>
                    {t?.name ?? id} ({t?.articleCount ?? 0} haber)
                  </option>
                );
              })}
            </select>
            <div className={styles.mergeActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setMergeOpen(false)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={busy}
                onClick={() => void confirmMerge()}
              >
                Onayla ve birleştir
              </button>
            </div>
          </div>
        ) : null}

        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        {tab === "similar" ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Etiket A</th>
                  <th>Etiket B</th>
                  <th>Benzerlik</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pairs.map((p) => (
                  <tr key={`${p.a.id}-${p.b.id}`}>
                    <td>
                      <strong>{p.a.name}</strong>
                      <span className={styles.slug}>/{p.a.slug}</span>
                      <span className={styles.meta}>{p.a.articleCount} haber</span>
                    </td>
                    <td>
                      <strong>{p.b.name}</strong>
                      <span className={styles.slug}>/{p.b.slug}</span>
                      <span className={styles.meta}>{p.b.articleCount} haber</span>
                    </td>
                    <td>{Math.round(p.score * 100)}%</td>
                    <td className={styles.pairActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={busy}
                        onClick={() => void mergePair(p.a.id, p.b.id)}
                      >
                        A→B
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={busy}
                        onClick={() => void mergePair(p.b.id, p.a.id)}
                      >
                        B→A
                      </button>
                    </td>
                  </tr>
                ))}
                {!pairs.length && !loading ? (
                  <tr>
                    <td colSpan={4} className={styles.muted}>
                      Benzer çift yok
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCol}>
                    <input
                      type="checkbox"
                      checked={
                        pageIds.length > 0 &&
                        pageIds.every((id) => selected.has(id))
                      }
                      onChange={() => toggleAll(pageIds)}
                      aria-label="Tümünü seç"
                    />
                  </th>
                  <th>Etiket</th>
                  <th>Haber</th>
                  <th>Son kullanım</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const st = statusLabel(t);
                  return (
                    <tr
                      key={t.id}
                      className={selected.has(t.id) ? styles.rowSel : undefined}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggle(t.id)}
                          aria-label={`${t.name} seç`}
                        />
                      </td>
                      <td>
                        <strong>{t.name}</strong>
                        <span className={styles.slug}>
                          /etiket/{t.slug}
                        </span>
                        {t.similarHint ? (
                          <span className={styles.similar}>
                            Benzer etiket · {t.similarHint}
                          </span>
                        ) : null}
                      </td>
                      <td>{t.articleCount ?? 0}</td>
                      <td>{relativeTr(t.lastUsedAt)}</td>
                      <td>
                        <span
                          className={
                            st.kind === "feat"
                              ? styles.badgeFeat
                              : st.kind === "noindex"
                                ? styles.badgeNoindex
                                : styles.badgeOk
                          }
                        >
                          {st.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && !loading ? (
                  <tr>
                    <td colSpan={5} className={styles.muted}>
                      Kayıt yok
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        <footer className={styles.foot}>
          <p className={styles.muted}>
            {meta?.rareHint ??
              "Az kullanılan etiketleri birleştirin veya temizleyin"}
            {" · "}
            slug:{" "}
            <code className={styles.inlineCode}>
              {tagSlugFromName("örnek etiket")}
            </code>
          </p>
          {meta && meta.totalPages > 1 ? (
            <div className={styles.pager}>
              <button
                type="button"
                disabled={page <= 1 || busy}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ←
              </button>
              <span>
                {start}–{end} / {meta.total}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages || busy}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          ) : meta ? (
            <span className={styles.muted}>
              {start}–{end} / {meta.total}
            </span>
          ) : null}
        </footer>
      </AdminPage>
    </AdminShell>
  );
}
