"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { adminApi } from "@/lib/api";
import {
  DEFAULT_COMMERCIAL,
  parseCommercial,
  type CommercialSettings,
} from "@/lib/corporate-settings";
import styles from "../kurumsal.module.css";

/** Ticari ünvan, vergi ve sicil bilgileri */
export default function TicariBilgilerPage() {
  const [form, setForm] = useState<CommercialSettings>(DEFAULT_COMMERCIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.settings
      .get()
      .then((s) => setForm(parseCommercial(s)))
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof CommercialSettings>(
    key: K,
    value: CommercialSettings[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.legalName.trim().length < 2 || form.displayName.trim().length < 2) {
      setError("Ticari ünvan ve bilinen isim zorunlu");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminApi.settings.update({
        legalName: form.legalName.trim(),
        displayName: form.displayName.trim(),
        siteName: form.displayName.trim(),
        taxOffice: form.taxOffice.trim(),
        taxNo: form.taxNo.trim(),
        tradeRegistry: form.tradeRegistry.trim(),
        mersis: form.mersis.trim(),
      });
      setMessage("Ticari bilgiler kaydedildi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <form onSubmit={onSubmit}>
        <AdminPage
          title="Ticari Bilgiler"
          subtitle="Ticari ünvan, vergi ve sicil kayıtları"
          actions={
            <div className={styles.actions}>
              <AdminButton href="/dashboard" variant="ghost">
                İptal
              </AdminButton>
              <AdminButton
                type="submit"
                variant="primary"
                disabled={saving || loading}
              >
                <Check size={16} aria-hidden />
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

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Ticari Bilgileri Düzenle</h2>
          <div className={styles.formGrid}>
            <div className={styles.row}>
              <label htmlFor="legalName">
                Ticari Ünvan <em>*</em>
              </label>
              <input
                id="legalName"
                value={form.legalName}
                onChange={(e) => set("legalName", e.target.value)}
                required
              />
            </div>
            <div className={styles.row}>
              <label htmlFor="displayName">
                Bilinen İsim <em>*</em>
              </label>
              <input
                id="displayName"
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                required
              />
            </div>
            <div className={styles.row}>
              <label htmlFor="taxOffice">Vergi Dairesi</label>
              <input
                id="taxOffice"
                value={form.taxOffice}
                onChange={(e) => set("taxOffice", e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <label htmlFor="taxNo">Vergi No</label>
              <input
                id="taxNo"
                value={form.taxNo}
                onChange={(e) => set("taxNo", e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <label htmlFor="tradeRegistry">Ticaret Sicil Numarası</label>
              <input
                id="tradeRegistry"
                value={form.tradeRegistry}
                onChange={(e) => set("tradeRegistry", e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <label htmlFor="mersis">Mersis Numarası</label>
              <input
                id="mersis"
                value={form.mersis}
                onChange={(e) => set("mersis", e.target.value)}
              />
            </div>
          </div>
        </div>
        </AdminPage>
      </form>
    </AdminShell>
  );
}
