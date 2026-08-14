"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";
import type { AdAdminRow, AdCreateInput, AdStatus } from "@yenihaber/shared";
import {
  PAGE_LABELS,
  slotsByPage,
  type AdDevice,
  type AdSlotDef,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import { ImageFileField } from "@/components/image-file-field/image-file-field";
import styles from "./ads.module.css";

type Draft = {
  name: string;
  advertiser: string;
  slotCode: string;
  type: AdCreateInput["type"];
  imageUrl: string;
  imageUrlMobile: string;
  targetUrl: string;
  htmlCode: string;
  adsenseSlotId: string;
  device: AdDevice;
  startAt: string;
  endAt: string;
  weight: number;
  status: AdStatus;
};

function emptyDraft(): Draft {
  return {
    name: "",
    advertiser: "",
    slotCode: "home-billboard",
    type: "image",
    imageUrl: "",
    imageUrlMobile: "",
    targetUrl: "",
    htmlCode: "",
    adsenseSlotId: "",
    device: "all",
    startAt: "",
    endAt: "",
    weight: 1,
    status: "active",
  };
}

function toLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR");
}

export type AdsPanelProps = { archived: boolean };

export function AdsPanel({ archived }: AdsPanelProps) {
  const [items, setItems] = useState<AdAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const groups = useMemo(() => slotsByPage(), []);

  const selectedSlot: AdSlotDef | null = useMemo(() => {
    for (const list of Object.values(groups)) {
      const found = list.find((s) => s.code === draft.slotCode);
      if (found) return found;
    }
    return null;
  }, [groups, draft.slotCode]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.ads.list({
        status: archived ? "archived" : undefined,
        q: q.trim() || undefined,
      });
      setItems(
        archived
          ? res.data.filter((a) => a.status === "archived")
          : res.data.filter((a) => a.status !== "archived"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [archived, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const archiveCount = useMemo(
    () => items.filter((a) => a.status === "archived").length,
    [items],
  );

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
    setOk("");
    setError("");
  }

  function openEdit(ad: AdAdminRow) {
    setEditingId(ad.id);
    setDraft({
      name: ad.name,
      advertiser: ad.advertiser ?? "",
      slotCode: ad.slotCode,
      type: ad.type,
      imageUrl: ad.imageUrl ?? "",
      imageUrlMobile: ad.imageUrlMobile ?? "",
      targetUrl: ad.targetUrl ?? "",
      htmlCode: ad.htmlCode ?? "",
      adsenseSlotId: ad.adsenseSlotId ?? "",
      device: ad.device,
      startAt: toLocal(ad.startAt),
      endAt: toLocal(ad.endAt),
      weight: ad.weight,
      status: ad.status,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  function localToIso(v: string): string | null {
    if (!v.trim()) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  async function saveDraft() {
    if (draft.name.trim().length < 2) {
      setError("Reklam adı zorunlu");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: AdCreateInput = {
        name: draft.name.trim(),
        advertiser: draft.advertiser.trim() || null,
        slotCode: draft.slotCode,
        type: draft.type,
        imageUrl: draft.imageUrl.trim() || null,
        imageUrlMobile: draft.imageUrlMobile.trim() || null,
        targetUrl: draft.targetUrl.trim() || null,
        htmlCode: draft.htmlCode.trim() || null,
        adsenseSlotId: draft.adsenseSlotId.trim() || null,
        device: draft.device,
        startAt: localToIso(draft.startAt),
        endAt: localToIso(draft.endAt),
        weight: draft.weight,
        status: archived ? "archived" : draft.status,
      };
      if (editingId) {
        await adminApi.ads.update(editingId, body);
      } else {
        await adminApi.ads.create(body);
      }
      setOk("Kaydedildi");
      closeForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: AdStatus) {
    setTogglingId(id);
    setError("");
    try {
      await adminApi.ads.update(id, { status });
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi");
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function toggleActive(ad: AdAdminRow) {
    if (ad.status === "archived") return;
    const next: AdStatus = ad.status === "active" ? "paused" : "active";
    await setStatus(ad.id, next);
  }

  async function remove(id: string) {
    if (!window.confirm("Bu reklam silinsin mi?")) return;
    try {
      await adminApi.ads.remove(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    }
  }

  function deviceIcons(d: AdDevice) {
    if (d === "desktop")
      return (
        <span className={styles.device} title="Masaüstü">
          <Monitor size={16} aria-hidden />
        </span>
      );
    if (d === "mobile")
      return (
        <span className={styles.device} title="Mobil">
          <Smartphone size={16} aria-hidden />
        </span>
      );
    return (
      <span className={styles.device} title="Tümü">
        <Monitor size={16} aria-hidden />
        <Smartphone size={16} aria-hidden />
      </span>
    );
  }

  function slotLabel(code: string) {
    for (const list of Object.values(groups)) {
      const s = list.find((x) => x.code === code);
      if (s) return s.name;
    }
    return code;
  }

  return (
    <AdminShell>
      <AdminPage
        title={archived ? "Arşivlenmiş Reklamlar" : "Reklam Kampanyaları"}
        subtitle="Alan kodları sabittir (ad-slots). Aktif yoksa sitede boş kutu basılmaz."
        wide
        actions={
          !archived ? (
            <AdminButton variant="primary" onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Yeni reklam
            </AdminButton>
          ) : (
            <AdminButton href="/ads" variant="ghost">
              Aktif reklamlara dön
            </AdminButton>
          )
        }
      >
        {formOpen ? (
          <div className={styles.formCard}>
            <strong>
              {editingId ? "Reklamı düzenle" : "Yeni reklam"}
            </strong>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Reklam adı</span>
                <input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({ ...draft, name: e.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Reklamveren</span>
                <input
                  value={draft.advertiser}
                  onChange={(e) =>
                    setDraft({ ...draft, advertiser: e.target.value })
                  }
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                <span>Alan (tek kaynak)</span>
                <select
                  value={draft.slotCode}
                  onChange={(e) =>
                    setDraft({ ...draft, slotCode: e.target.value })
                  }
                >
                  {Object.entries(groups).map(([page, slots]) => (
                    <optgroup
                      key={page}
                      label={PAGE_LABELS[page as keyof typeof PAGE_LABELS]}
                    >
                      {slots.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name} — {s.sizes.desktop ?? s.sizes.mobile}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedSlot ? (
                  <small className={styles.hint}>
                    {selectedSlot.note} · önerilen:{" "}
                    {selectedSlot.sizes.desktop ?? "—"} /{" "}
                    {selectedSlot.sizes.mobile ?? "—"}
                  </small>
                ) : null}
              </label>
              <label className={styles.field}>
                <span>Tip</span>
                <select
                  value={draft.type}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      type: e.target.value as Draft["type"],
                    })
                  }
                >
                  <option value="image">Görsel</option>
                  <option value="html">HTML / embed</option>
                  <option value="adsense">AdSense</option>
                  <option value="video">Video</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Cihaz</span>
                <select
                  value={draft.device}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      device: e.target.value as AdDevice,
                    })
                  }
                >
                  <option value="all">Tümü</option>
                  <option value="desktop">Masaüstü</option>
                  <option value="mobile">Mobil</option>
                </select>
              </label>
              {draft.type === "image" ? (
                <>
                  <div className={`${styles.field} ${styles.full}`}>
                    <ImageFileField
                      label="Görsel"
                      value={draft.imageUrl}
                      onChange={(url) => setDraft({ ...draft, imageUrl: url })}
                      kind="genel"
                      onError={setError}
                    />
                  </div>
                  <div className={styles.field}>
                    <ImageFileField
                      label="Mobil görsel"
                      value={draft.imageUrlMobile}
                      onChange={(url) =>
                        setDraft({ ...draft, imageUrlMobile: url })
                      }
                      kind="genel"
                      onError={setError}
                    />
                  </div>
                  <label className={styles.field}>
                    <span>Hedef URL</span>
                    <input
                      value={draft.targetUrl}
                      onChange={(e) =>
                        setDraft({ ...draft, targetUrl: e.target.value })
                      }
                    />
                  </label>
                </>
              ) : null}
              {draft.type === "html" ? (
                <label className={`${styles.field} ${styles.full}`}>
                  <span>HTML kodu</span>
                  <textarea
                    rows={4}
                    value={draft.htmlCode}
                    onChange={(e) =>
                      setDraft({ ...draft, htmlCode: e.target.value })
                    }
                  />
                </label>
              ) : null}
              {draft.type === "adsense" ? (
                <label className={styles.field}>
                  <span>AdSense slot id</span>
                  <input
                    value={draft.adsenseSlotId}
                    onChange={(e) =>
                      setDraft({ ...draft, adsenseSlotId: e.target.value })
                    }
                  />
                </label>
              ) : null}
              {draft.type === "video" ? (
                <label className={styles.field}>
                  <span>Video URL</span>
                  <input
                    value={draft.targetUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, targetUrl: e.target.value })
                    }
                  />
                </label>
              ) : null}
              <label className={styles.field}>
                <span>Başlangıç</span>
                <input
                  type="datetime-local"
                  value={draft.startAt}
                  onChange={(e) =>
                    setDraft({ ...draft, startAt: e.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Bitiş</span>
                <input
                  type="datetime-local"
                  value={draft.endAt}
                  onChange={(e) =>
                    setDraft({ ...draft, endAt: e.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Ağırlık (1–20)</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={draft.weight}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      weight: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Durum</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      status: e.target.value as AdStatus,
                    })
                  }
                >
                  <option value="active">Aktif</option>
                  <option value="paused">Duraklatıldı</option>
                  <option value="archived">Arşiv</option>
                </select>
              </label>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={closeForm}
              >
                İptal
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={saving}
                onClick={() => void saveDraft()}
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}

        <div className={styles.toolbar}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara…"
            aria-label="Reklam ara"
          />
          {!archived ? (
            <Link href="/ads/arsiv" className={styles.btnDanger}>
              <Archive size={16} aria-hidden />
              Arşiv
            </Link>
          ) : null}
        </div>

        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cihaz</th>
                <th>Ad</th>
                <th>Alan</th>
                <th>Tip</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Gör.</th>
                <th>Tık.</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{deviceIcons(a.device)}</td>
                  <td>
                    <strong>{a.name}</strong>
                    {a.advertiser ? (
                      <div className={styles.muted}>{a.advertiser}</div>
                    ) : null}
                  </td>
                  <td title={a.slotCode}>{slotLabel(a.slotCode)}</td>
                  <td>{a.type}</td>
                  <td>{formatDt(a.startAt)}</td>
                  <td>{formatDt(a.endAt)}</td>
                  <td>{a.impressions}</td>
                  <td>{a.clicks}</td>
                  <td>
                    {a.status === "archived" ? (
                      <span className={styles.statusOff}>Arşiv</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.switch}
                        role="switch"
                        aria-checked={a.status === "active"}
                        aria-label={
                          a.status === "active"
                            ? `${a.name} açık — kapat`
                            : `${a.name} kapalı — aç`
                        }
                        disabled={togglingId === a.id}
                        data-on={a.status === "active" ? "1" : "0"}
                        onClick={() => void toggleActive(a)}
                      >
                        <span className={styles.switchKnob} aria-hidden />
                        <span className={styles.switchLabel}>
                          {togglingId === a.id
                            ? "…"
                            : a.status === "active"
                              ? "Açık"
                              : "Kapalı"}
                        </span>
                      </button>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.btnSmall}
                        onClick={() => openEdit(a)}
                      >
                        Düzenle
                      </button>
                      {a.status !== "archived" ? (
                        <button
                          type="button"
                          className={styles.btnSmall}
                          onClick={() => void setStatus(a.id, "archived")}
                        >
                          Arşivle
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.btnSmall}
                          onClick={() => void setStatus(a.id, "active")}
                        >
                          Aktifleştir
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnSmall}
                        aria-label="Sil"
                        onClick={() => void remove(a.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !items.length ? (
          <AdminEmpty
            title={archived ? "Arşivde reklam yok" : "Henüz reklam yok"}
            description={
              archived
                ? "Arşivlenen kampanyalar burada listelenir."
                : "Yeni bir kampanya eklemek için «Yeni reklam»a tıklayın."
            }
          />
        ) : null}
      </AdminPage>
    </AdminShell>
  );
}
