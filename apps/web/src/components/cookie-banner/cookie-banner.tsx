"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  acceptAllCookies,
  readCookieConsent,
} from "@/lib/cookie-consent";
import styles from "./cookie-banner.module.css";

/**
 * Alt çerez paneli — kabul veya ayarlar sayfasına yönlendirme.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!readCookieConsent());
    function onChange() {
      setOpen(!readCookieConsent());
    }
    window.addEventListener("yh-cookie-consent", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("yh-cookie-consent", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="cookie-banner-title" className={styles.title}>
            Çerez kullanımı
          </h2>
          <p id="cookie-banner-desc" className={styles.text}>
            Sizlere daha iyi hizmet sunabilmek adına sitemizde çerez
            konumlandırmaktayız. Kişisel verileriniz, KVKK ve GDPR kapsamında
            toplanıp işlenir. Detaylı bilgi almak için{" "}
            <Link href="/kvkk" className={styles.link}>
              Aydınlatma Metnimizi
            </Link>{" "}
            inceleyebilirsiniz.
          </p>
        </div>
        <div className={styles.actions}>
          <Link
            href="/cerez#ayarlar"
            className={styles.secondary}
            aria-label="Çerez ayarlarına git"
          >
            Çerez Ayarlarına Git
          </Link>
          <button
            type="button"
            className={styles.primary}
            aria-label="Tüm çerezleri kabul et"
            onClick={() => {
              acceptAllCookies();
              setOpen(false);
            }}
          >
            Tüm Çerezleri Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
