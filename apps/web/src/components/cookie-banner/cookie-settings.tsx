"use client";

import { useEffect, useState } from "react";
import {
  acceptNecessaryOnly,
  readCookieConsent,
  saveCustomCookies,
  type CookiePrefs,
  DEFAULT_PREFS,
} from "@/lib/cookie-consent";
import styles from "./cookie-settings.module.css";

/**
 * /cerez#ayarlar — kategori bazlı tercih paneli
 */
export function CookieSettings() {
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = readCookieConsent();
    if (c) setPrefs(c.prefs);
  }, []);

  function persist(next: CookiePrefs) {
    saveCustomCookies({
      functional: next.functional,
      analytics: next.analytics,
    });
    setPrefs(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section
      id="ayarlar"
      className={styles.box}
      aria-labelledby="cookie-settings-title"
    >
      <h2 id="cookie-settings-title">Çerez ayarları</h2>
      <p className={styles.lead}>
        Zorunlu çerezler site çalışması için açıktır. Diğer kategorileri
        istediğiniz gibi yönetebilirsiniz.
      </p>

      <ul className={styles.list}>
        <li className={styles.row}>
          <div>
            <strong>Zorunlu</strong>
            <span>Oturum, güvenlik, yük dengeleme</span>
          </div>
          <span className={styles.locked} aria-label="Her zaman açık">
            Açık
          </span>
        </li>
        <li className={styles.row}>
          <div>
            <strong>İşlevsel</strong>
            <span>Tema, tercih ve okuma ayarları</span>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={prefs.functional}
              aria-label="İşlevsel çerezler"
              onChange={(e) =>
                setPrefs((p) => ({ ...p, functional: e.target.checked }))
              }
            />
            <span>{prefs.functional ? "Açık" : "Kapalı"}</span>
          </label>
        </li>
        <li className={styles.row}>
          <div>
            <strong>Ölçüm</strong>
            <span>Anonim kullanım istatistikleri (varsa)</span>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={prefs.analytics}
              aria-label="Ölçüm çerezleri"
              onChange={(e) =>
                setPrefs((p) => ({ ...p, analytics: e.target.checked }))
              }
            />
            <span>{prefs.analytics ? "Açık" : "Kapalı"}</span>
          </label>
        </li>
      </ul>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            acceptNecessaryOnly();
            setPrefs(DEFAULT_PREFS);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2500);
          }}
        >
          Yalnızca zorunlu
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => persist(prefs)}
        >
          Tercihleri kaydet
        </button>
      </div>
      {saved ? (
        <p className={styles.ok} role="status">
          Tercihleriniz kaydedildi.
        </p>
      ) : null}
    </section>
  );
}
