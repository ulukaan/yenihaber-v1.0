"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { adminApi } from "@/lib/api";
import {
  DEFAULT_CONTACT,
  parseContact,
  type ContactSettings,
} from "@/lib/corporate-settings";
import styles from "../kurumsal.module.css";

/** İletişim e-posta, telefon, adres */
export default function IletisimBilgileriPage() {
  const [form, setForm] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.settings
      .get()
      .then((s) => setForm(parseContact(s)))
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof ContactSettings>(
    key: K,
    value: ContactSettings[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminApi.settings.update({
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        whatsappTip: form.whatsappTip.trim(),
        contactAddress: form.contactAddress.trim(),
        contactCity: form.contactCity.trim(),
        contactDistrict: form.contactDistrict.trim(),
        mapEmbedUrl: form.mapEmbedUrl.trim(),
      });
      setMessage("İletişim bilgileri kaydedildi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  }

  const mapSrc = form.mapEmbedUrl.trim();
  const isEmbed =
    mapSrc.includes("google.com/maps") || mapSrc.includes("openstreetmap");

  return (
    <AdminShell>
      <form onSubmit={onSubmit}>
        <AdminPage
          title="İletişim Bilgileri"
          subtitle="E-posta, telefon, adres ve harita"
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

        <div className={styles.split}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>İletişim Bilgileri</h2>
            <div className={styles.formGrid}>
              <div className={styles.row}>
                <label htmlFor="contactEmail">E-Posta</label>
                <input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="contactPhone">Telefon</label>
                <input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="whatsappTip">WhatsApp İhbar No</label>
                <input
                  id="whatsappTip"
                  value={form.whatsappTip}
                  onChange={(e) => set("whatsappTip", e.target.value)}
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="contactAddress">Adres</label>
                <textarea
                  id="contactAddress"
                  value={form.contactAddress}
                  onChange={(e) => set("contactAddress", e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="contactCity">İl / İlçe</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <select
                    id="contactCity"
                    value={form.contactCity}
                    onChange={(e) => set("contactCity", e.target.value)}
                    aria-label="İl"
                  >
                    <option value="Düzce">Düzce</option>
                    <option value="İstanbul">İstanbul</option>
                    <option value="Ankara">Ankara</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                  <input
                    value={form.contactDistrict}
                    onChange={(e) => set("contactDistrict", e.target.value)}
                    placeholder="İlçe"
                    aria-label="İlçe"
                  />
                </div>
              </div>
              <div className={styles.row}>
                <label htmlFor="mapEmbedUrl">Harita (embed URL)</label>
                <input
                  id="mapEmbedUrl"
                  type="url"
                  value={form.mapEmbedUrl}
                  onChange={(e) => set("mapEmbedUrl", e.target.value)}
                  placeholder="Google Maps veya OSM embed linki"
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Ulaşım Haritası</h2>
            <div style={{ padding: 16 }}>
              <div className={styles.mapBox}>
                {isEmbed ? (
                  <iframe
                    title="Ulaşım haritası"
                    src={mapSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <p>
                    {mapSrc
                      ? "Geçerli bir harita embed URL’si girin (Google Maps / OpenStreetMap)."
                      : "Harita önizlemesi burada görünür."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        </AdminPage>
      </form>
    </AdminShell>
  );
}
