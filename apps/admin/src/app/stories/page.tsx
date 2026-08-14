"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ApiStory, StoryKind, StoryStatus } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { adminApi } from "@/lib/api";
import styles from "./stories.module.css";

type FormState = {
  title: string;
  kind: StoryKind;
  mediaUrl: string;
  posterUrl: string;
  linkUrl: string;
  status: StoryStatus;
  expiresAt: string;
};

const empty = (): FormState => ({
  title: "",
  kind: "durum",
  mediaUrl: "",
  posterUrl: "",
  linkUrl: "",
  status: "draft",
  expiresAt: "",
});

/** Hikaye paneli — durum & short */
export default function StoriesAdminPage() {
  const [items, setItems] = useState<ApiStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState<FormState>(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.stories.adminList();
      setItems(res.data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File, target: "media" | "poster") {
    setBusy(true);
    setError("");
    try {
      const res = await adminApi.stories.upload(file);
      if (target === "media") {
        setForm((f) => ({
          ...f,
          mediaUrl: res.url,
          kind: res.kind === "video" ? "short" : f.kind,
          posterUrl: f.posterUrl || (res.kind === "image" ? res.url : f.posterUrl),
        }));
      } else {
        setForm((f) => ({ ...f, posterUrl: res.url }));
      }
      setOk("Dosya yüklendi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(s: ApiStory) {
    setEditId(s.id);
    setForm({
      title: s.title,
      kind: s.kind,
      mediaUrl: s.mediaUrl,
      posterUrl: s.posterUrl ?? "",
      linkUrl: s.linkUrl ?? "",
      status: s.status,
      expiresAt: s.expiresAt
        ? new Date(s.expiresAt).toISOString().slice(0, 16)
        : "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(empty());
  }

  async function save() {
    if (!form.title.trim() || !form.mediaUrl.trim()) {
      setError("Başlık ve medya zorunlu");
      return;
    }
    setBusy(true);
    setError("");
    setOk("");
    try {
      const payload = {
        title: form.title.trim(),
        kind: form.kind,
        mediaUrl: form.mediaUrl.trim(),
        posterUrl: form.posterUrl.trim() || null,
        linkUrl: form.linkUrl.trim() || null,
        status: form.status,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : null,
      };
      if (editId) {
        await adminApi.stories.update(editId, payload);
        setOk("Güncellendi");
      } else {
        await adminApi.stories.create(payload);
        setOk("Eklendi");
      }
      cancelEdit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu hikaye silinsin mi?")) return;
    setBusy(true);
    try {
      await adminApi.stories.remove(id);
      if (editId === id) cancelEdit();
      await load();
      setOk("Silindi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const a = next[index]!;
    next[index] = next[j]!;
    next[j] = a;
    setItems(next);
    setBusy(true);
    try {
      await adminApi.stories.reorder({ ids: next.map((x) => x.id) });
      setOk("Sıra kaydedildi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sıra kaydedilemedi");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: StoryStatus) {
    setBusy(true);
    try {
      await adminApi.stories.update(id, { status });
      await load();
      setOk(status === "active" ? "Yayında" : "Durum güncellendi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <AdminPage
        title="Hikayeler"
        subtitle="Ana sayfada reklam ile kategori şeritleri arasında görünen durum ve short’lar. Yayınlananlar varsayılan 24 saat sonra düşer."
        wide
        actions={
          <AdminButton
            variant="primary"
            disabled={busy}
            onClick={() => {
              cancelEdit();
              setForm(empty());
            }}
          >
            <Plus size={18} aria-hidden />
            Yeni
          </AdminButton>
        }
      >
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}

        <div className={styles.grid}>
          <section className={styles.form} aria-label="Hikaye formu">
            <h2>{editId ? "Düzenle" : "Yeni hikaye"}</h2>

            <label>
              Başlık
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                maxLength={80}
                placeholder="Örn. Canlı yayın"
              />
            </label>

            <fieldset className={styles.kindRow}>
              <legend>Tür</legend>
              <label>
                <input
                  type="radio"
                  name="kind"
                  checked={form.kind === "durum"}
                  onChange={() => setForm((f) => ({ ...f, kind: "durum" }))}
                />
                Durum (görsel)
              </label>
              <label>
                <input
                  type="radio"
                  name="kind"
                  checked={form.kind === "short"}
                  onChange={() => setForm((f) => ({ ...f, kind: "short" }))}
                />
                Short (dikey video)
              </label>
            </fieldset>

            <div className={styles.uploadRow}>
              <label className={styles.fileBtn}>
                {form.kind === "short" ? "Video seç" : "Görsel seç"}
                <input
                  type="file"
                  accept={
                    form.kind === "short"
                      ? "video/mp4,video/webm,image/*"
                      : "image/*"
                  }
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file, "media");
                    e.target.value = "";
                  }}
                />
              </label>
              <label className={styles.fileBtn}>
                Kapak seç
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file, "poster");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {form.mediaUrl || form.posterUrl ? (
              <p className={styles.muted}>
                {form.mediaUrl ? "Medya yüklendi. " : ""}
                {form.posterUrl ? "Kapak yüklendi." : ""}
              </p>
            ) : (
              <p className={styles.muted}>Dosya seçerek yükleyin.</p>
            )}

            <label>
              Tıklanınca link (opsiyonel)
              <input
                value={form.linkUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkUrl: e.target.value }))
                }
                placeholder="https://…"
              />
            </label>

            <label>
              Durum
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as StoryStatus,
                  }))
                }
              >
                <option value="draft">Taslak</option>
                <option value="active">Yayında</option>
                <option value="archived">Arşiv</option>
              </select>
            </label>

            <label>
              Bitiş (boş = yayında +24 saat)
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </label>

            {(form.posterUrl || form.mediaUrl) && form.kind === "durum" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.preview}
                src={form.posterUrl || form.mediaUrl}
                alt=""
              />
            ) : null}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.primary}
                disabled={busy}
                onClick={() => void save()}
              >
                {editId ? "Kaydet" : "Ekle"}
              </button>
              {editId ? (
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy}
                  onClick={cancelEdit}
                >
                  İptal
                </button>
              ) : null}
            </div>
          </section>

          <section className={styles.list} aria-label="Hikaye listesi">
            <h2>Şerit sırası</h2>
            {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}
            <ul className={styles.rows}>
              {items.map((s, i) => (
                <li key={s.id} className={styles.row}>
                  <div
                    className={styles.thumb}
                    style={{
                      backgroundImage: `url(${s.posterUrl || s.mediaUrl})`,
                    }}
                    aria-hidden
                  />
                  <div className={styles.meta}>
                    <strong>{s.title}</strong>
                    <span>
                      {s.kind === "short" ? "Short" : "Durum"} · {s.status}
                      {s.expiresAt
                        ? ` · bitiş ${new Date(s.expiresAt).toLocaleString("tr-TR")}`
                        : ""}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.icon}
                      disabled={busy || i === 0}
                      aria-label="Yukarı"
                      onClick={() => void move(i, -1)}
                    >
                      <ArrowUp size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={styles.icon}
                      disabled={busy || i === items.length - 1}
                      aria-label="Aşağı"
                      onClick={() => void move(i, 1)}
                    >
                      <ArrowDown size={16} aria-hidden />
                    </button>
                    {s.status !== "active" ? (
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() => void setStatus(s.id, "active")}
                      >
                        Yayınla
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() => void setStatus(s.id, "archived")}
                      >
                        Kapat
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={busy}
                      onClick={() => startEdit(s)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      disabled={busy}
                      aria-label="Sil"
                      onClick={() => void remove(s.id)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
              {!loading && !items.length ? (
                <li className={styles.muted}>Henüz hikaye yok.</li>
              ) : null}
            </ul>
          </section>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
