"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  PAID_LISTING_KIND_LABELS,
  PAID_LISTING_STATUS_LABELS,
  type ApiPaidListing,
  type PaidListingCreateInput,
  type PaidListingKind,
  type PaidListingStatus,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import { siteHref } from "@/lib/public-env";
import { ImageFileField } from "@/components/image-file-field/image-file-field";
import styles from "./ilanlar.module.css";

type FormState = {
  kind: PaidListingKind;
  title: string;
  body: string;
  personName: string;
  imageUrl: string;
  contactName: string;
  contactPhone: string;
  customerNote: string;
  priceTry: string;
  durationDays: string;
  status: PaidListingStatus;
  featured: boolean;
  startAt: string;
  endAt: string;
};

const empty = (): FormState => ({
  kind: "vefat",
  title: "",
  body: "",
  personName: "",
  imageUrl: "",
  contactName: "",
  contactPhone: "",
  customerNote: "",
  priceTry: "750",
  durationDays: "7",
  status: "draft",
  featured: false,
  startAt: "",
  endAt: "",
});

function toLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromForm(f: FormState): PaidListingCreateInput {
  return {
    kind: f.kind,
    title: f.title.trim(),
    body: f.body,
    personName: f.personName,
    imageUrl: f.imageUrl,
    contactName: f.contactName,
    contactPhone: f.contactPhone,
    customerNote: f.customerNote,
    priceTry: Math.max(0, Number.parseInt(f.priceTry, 10) || 0),
    durationDays: Math.max(1, Number.parseInt(f.durationDays, 10) || 7),
    status: f.status,
    featured: f.featured,
    startAt: f.startAt || null,
    endAt: f.endAt || null,
  };
}

/** Ücretli ilan paneli — vefat / taziye / duyuru */
export default function IlanlarAdminPage() {
  const [items, setItems] = useState<ApiPaidListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [filter, setFilter] = useState<PaidListingStatus | "hepsi">("hepsi");
  const [form, setForm] = useState<FormState>(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listings.adminList(
        filter === "hepsi" ? undefined : { status: filter },
      );
      setItems(res.data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(row: ApiPaidListing) {
    setEditId(row.id);
    setForm({
      kind: row.kind,
      title: row.title,
      body: row.body,
      personName: row.personName ?? "",
      imageUrl: row.imageUrl ?? "",
      contactName: row.contactName ?? "",
      contactPhone: row.contactPhone ?? "",
      customerNote: row.customerNote ?? "",
      priceTry: String(row.priceTry),
      durationDays: String(row.durationDays),
      status: row.status,
      featured: row.featured,
      startAt: toLocal(row.startAt),
      endAt: toLocal(row.endAt),
    });
    setOk("");
    setError("");
  }

  function resetForm() {
    setEditId(null);
    setForm(empty());
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Başlık gerekli");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = fromForm(form);
      if (editId) {
        await adminApi.listings.update(editId, body);
        setOk("İlan güncellendi");
      } else {
        await adminApi.listings.create(body);
        setOk("İlan oluşturuldu");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    if (!window.confirm("İlan kalıcı silinsin mi?")) return;
    setBusy(true);
    try {
      await adminApi.listings.remove(id);
      if (editId === id) resetForm();
      await load();
      setOk("Silindi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function expireDue() {
    setBusy(true);
    try {
      const res = await adminApi.listings.expireDue();
      setOk(`${res.expired} ilanın süresi doldu olarak işaretlendi`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  const kindEntries = Object.entries(PAID_LISTING_KIND_LABELS) as Array<
    [PaidListingKind, string]
  >;

  return (
    <AdminShell>
      <AdminPage
        title="Ücretli ilanlar"
        subtitle="Vefat, taziye, tebrik ve duyuru ilanlarını buradan yayınlayın. Site: /ilanlar · vefat sayfasında ücretli blok."
        wide
        actions={
          <div className={styles.headActions}>
            <AdminButton variant="ghost" disabled={busy} onClick={() => void expireDue()}>
              Süresi dolanları kapat
            </AdminButton>
            <AdminButton variant="primary" disabled={busy} onClick={resetForm}>
              <Plus size={18} aria-hidden />
              Yeni ilan
            </AdminButton>
          </div>
        }
      >
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

        <div className={styles.filters} role="tablist" aria-label="Durum filtresi">
          {(
            [
              "hepsi",
              "draft",
              "active",
              "expired",
              "archived",
            ] as const
          ).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={filter === s}
              className={filter === s ? styles.tabOn : styles.tab}
              onClick={() => setFilter(s)}
            >
              {s === "hepsi" ? "Tümü" : PAID_LISTING_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          <form className={styles.form} onSubmit={(e) => void onSave(e)}>
            <h2>{editId ? "İlanı düzenle" : "Yeni ilan"}</h2>

            <label>
              Tür
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kind: e.target.value as PaidListingKind,
                  }))
                }
              >
                {kindEntries.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Başlık
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                maxLength={200}
                placeholder="Örn. Ahmet Yılmaz vefat ilanı"
              />
            </label>

            <label>
              Kişi adı (vefat / anma)
              <input
                value={form.personName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, personName: e.target.value }))
                }
                maxLength={160}
              />
            </label>

            <label>
              Metin
              <textarea
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                rows={6}
                maxLength={20_000}
                placeholder="İlan metni…"
              />
            </label>

            <ImageFileField
              label="Görsel"
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              kind="haber"
              onError={setError}
            />

            <div className={styles.row2}>
              <label>
                Müşteri adı
                <input
                  value={form.contactName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactName: e.target.value }))
                  }
                />
              </label>
              <label>
                Telefon
                <input
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPhone: e.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              İç not (müşteriye görünmez)
              <textarea
                value={form.customerNote}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerNote: e.target.value }))
                }
                rows={2}
              />
            </label>

            <div className={styles.row2}>
              <label>
                Ücret (₺)
                <input
                  type="number"
                  min={0}
                  value={form.priceTry}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceTry: e.target.value }))
                  }
                />
              </label>
              <label>
                Süre (gün)
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationDays: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className={styles.row2}>
              <label>
                Başlangıç
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startAt: e.target.value }))
                  }
                />
              </label>
              <label>
                Bitiş
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endAt: e.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              Durum
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as PaidListingStatus,
                  }))
                }
              >
                {(
                  Object.keys(PAID_LISTING_STATUS_LABELS) as PaidListingStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {PAID_LISTING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, featured: e.target.checked }))
                }
              />
              Öne çıkar
            </label>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primary} disabled={busy}>
                {editId ? "Güncelle" : "Kaydet"}
              </button>
              {editId ? (
                <button
                  type="button"
                  className={styles.ghost}
                  disabled={busy}
                  onClick={resetForm}
                >
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>

          <section className={styles.list} aria-label="İlan listesi">
            <h2>
              Liste {loading ? "…" : `(${items.length})`}
            </h2>
            {items.length === 0 && !loading ? (
              <AdminEmpty
                title="Bu filtrede ilan yok"
                description="Soldaki formu doldurarak yeni bir ücretli ilan oluşturabilirsiniz."
              />
            ) : null}
            <ul className={styles.cards}>
              {items.map((row) => (
                <li key={row.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.badge}>
                      {PAID_LISTING_KIND_LABELS[row.kind]}
                    </span>
                    <span className={styles.status}>
                      {PAID_LISTING_STATUS_LABELS[row.status]}
                    </span>
                    {row.featured ? (
                      <span className={styles.feat}>Öne çıkan</span>
                    ) : null}
                  </div>
                  <h3>{row.title}</h3>
                  {row.personName ? (
                    <p className={styles.muted}>{row.personName}</p>
                  ) : null}
                  <p className={styles.meta}>
                    {row.priceTry > 0 ? `${row.priceTry} ₺ · ` : null}
                    {row.durationDays} gün
                    {row.endAt
                      ? ` · bitiş ${new Date(row.endAt).toLocaleDateString("tr-TR")}`
                      : null}
                  </p>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={() => startEdit(row)}
                    >
                      Düzenle
                    </button>
                    <a
                      className={styles.link}
                      href={siteHref(`/ilanlar/${row.slug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sitede
                    </a>
                    <button
                      type="button"
                      className={styles.danger}
                      disabled={busy}
                      aria-label="Sil"
                      onClick={() => void onRemove(row.id)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
