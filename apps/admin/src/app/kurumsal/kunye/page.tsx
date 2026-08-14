"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { adminApi } from "@/lib/api";
import {
  DEFAULT_BIK_IMPRINT,
  parseBikImprint,
  parseKunye,
  uid,
  type BikImprintSettings,
  type KunyeEntry,
} from "@/lib/corporate-settings";
import styles from "../kurumsal.module.css";

const DEPTS = [
  "Tüzel Kişi Temsilcisi",
  "Yayıncı",
  "Genel Yayın Yönetimi",
  "İletişim Telefonu",
  "Kurumsal E-Posta",
  "Reklam Ajansı",
  "Yer Sağlayıcı Ticaret Unvanı",
  "Yer Sağlayıcı Adresi",
  "Diğer",
];

/** BİK künye alanları + serbest satırlar — sitede /kunye */
export default function KunyeIslemleriPage() {
  const [imprint, setImprint] =
    useState<BikImprintSettings>(DEFAULT_BIK_IMPRINT);
  const [rows, setRows] = useState<KunyeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.settings
      .get()
      .then((s) => {
        setImprint(parseBikImprint(s));
        setRows(parseKunye(s));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function setImp<K extends keyof BikImprintSettings>(
    key: K,
    value: BikImprintSettings[K],
  ) {
    setImprint((f) => ({ ...f, [key]: value }));
  }

  function update(id: string, patch: Partial<KunyeEntry>) {
    setRows((list) =>
      list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((list) => [
      ...list,
      {
        id: uid(),
        detail: "",
        department: "Diğer",
        email: "",
        sortOrder: list.length + 1,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((list) => list.filter((r) => r.id !== id));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = rows.map((r, i) => ({
        ...r,
        sortOrder: Number(r.sortOrder) || i + 1,
        detail: r.detail.trim(),
        department: r.department.trim(),
        email: r.email.trim(),
      }));
      await adminApi.settings.update({
        imtiyazSahibi: imprint.imtiyazSahibi.trim(),
        sorumluMudur: imprint.sorumluMudur.trim(),
        uetsAddress: imprint.uetsAddress.trim(),
        yayinPeriyodu: imprint.yayinPeriyodu.trim(),
        hostingProvider: imprint.hostingProvider.trim(),
        yayinTuru: imprint.yayinTuru.trim() || "İnternet haber sitesi",
        kunyeEntries: JSON.stringify(payload),
      });
      setRows(payload.sort((a, b) => a.sortOrder - b.sortOrder));
      setMessage("Künye kaydedildi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <AdminPage
        title="Künye İşlemleri"
        subtitle="BİK / resmi yayın künyesi — imtiyaz sahibi, sorumlu müdür, UETS"
        actions={
          <div className={styles.actions}>
            <AdminButton variant="ghost" onClick={addRow}>
              <Plus size={16} aria-hidden />
              Yeni künye satırı
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={saving || loading}
              onClick={() => void save()}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </AdminButton>
          </div>
        }
      >
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}
        {message ? <p className={styles.ok}>{message}</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <section className={styles.form} aria-labelledby="bik-imprint">
          <h2 id="bik-imprint" className={styles.sectionTitle}>
            BİK zorunlu alanlar
          </h2>
          <p className={styles.muted}>
            Bu alanlar /kunye sayfasında sabit gösterilir. UETS adresini Kuruma
            bildirilenle aynı tutun.
          </p>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>İmtiyaz sahibi</span>
              <input
                value={imprint.imtiyazSahibi}
                onChange={(e) => setImp("imtiyazSahibi", e.target.value)}
                disabled={loading}
                autoComplete="organization"
              />
            </label>
            <label className={styles.field}>
              <span>Sorumlu müdür</span>
              <input
                value={imprint.sorumluMudur}
                onChange={(e) => setImp("sorumluMudur", e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </label>
            <label className={styles.field}>
              <span>UETS / KEP adresi</span>
              <input
                value={imprint.uetsAddress}
                onChange={(e) => setImp("uetsAddress", e.target.value)}
                disabled={loading}
                placeholder="ornek@hs01.kep.tr"
              />
            </label>
            <label className={styles.field}>
              <span>Yayın periyodu</span>
              <input
                value={imprint.yayinPeriyodu}
                onChange={(e) => setImp("yayinPeriyodu", e.target.value)}
                disabled={loading}
              />
            </label>
            <label className={styles.field}>
              <span>Yayın türü</span>
              <input
                value={imprint.yayinTuru}
                onChange={(e) => setImp("yayinTuru", e.target.value)}
                disabled={loading}
              />
            </label>
            <label className={styles.field}>
              <span>Yer sağlayıcı</span>
              <input
                value={imprint.hostingProvider}
                onChange={(e) => setImp("hostingProvider", e.target.value)}
                disabled={loading}
                placeholder="Hosting firması unvanı"
              />
            </label>
          </div>
        </section>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ad / Detay</th>
                <th>Departman</th>
                <th>E-posta</th>
                <th style={{ width: 80 }}>Sıra</th>
                <th style={{ width: 56 }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      value={r.detail}
                      onChange={(e) => update(r.id, { detail: e.target.value })}
                      aria-label="Detay"
                    />
                  </td>
                  <td>
                    <select
                      value={r.department}
                      onChange={(e) =>
                        update(r.id, { department: e.target.value })
                      }
                      aria-label="Departman"
                    >
                      {DEPTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="email"
                      value={r.email}
                      onChange={(e) => update(r.id, { email: e.target.value })}
                      aria-label="E-posta"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={r.sortOrder}
                      onChange={(e) =>
                        update(r.id, {
                          sortOrder: Number(e.target.value) || 1,
                        })
                      }
                      aria-label="Sıra"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      style={{ minHeight: 36, padding: "0 10px" }}
                      aria-label="Satırı sil"
                      onClick={() => removeRow(r.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <p className={styles.muted}>Henüz ek künye satırı yok.</p>
        ) : null}
      </AdminPage>
    </AdminShell>
  );
}
