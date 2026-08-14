import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettings } from "@/components/cookie-banner/cookie-settings";
import styles from "../yasal.module.css";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description:
    "Düzce Radikal çerez politikası — hangi çerezler, amaçları ve tercihleriniz.",
};

/** Çerez politikası + tercih paneli */
export default function CookiePage() {
  return (
    <div className={`yh-container ${styles.page}`}>
      <article className={styles.card}>
        <h1>Çerez Politikası</h1>
        <p>
          Sizlere daha iyi hizmet sunabilmek adına sitemizde çerez
          konumlandırmaktayız. Kişisel verileriniz, KVKK ve GDPR kapsamında
          toplanıp işlenir. Detaylı bilgi için{" "}
          <Link href="/kvkk">Aydınlatma Metnimizi</Link> inceleyebilirsiniz.
        </p>

        <h2>Çerez türleri</h2>
        <ul>
          <li>
            <strong>Zorunlu:</strong> oturum, güvenlik, yük dengeleme — site
            çalışması için gerekli.
          </li>
          <li>
            <strong>İşlevsel:</strong> tema, dil veya okuma tercihleri gibi
            ayarlar.
          </li>
          <li>
            <strong>Ölçüm (varsa):</strong> anonim veya toplu kullanım istatistiği.
          </li>
        </ul>

        <h2>Yönetim</h2>
        <p>
          Aşağıdaki panelden tercihlerinizi değiştirebilir veya tarayıcı
          ayarlarından çerezleri silebilirsiniz. Zorunlu çerezler engellenirse
          bazı özellikler çalışmayabilir.
        </p>

        <CookieSettings />

        <h2>Üçüncü taraflar</h2>
        <p>
          Gömülü video, harita veya analiz araçları kendi çerezlerini
          kullanabilir. Bu servislerin politikaları kendi sitelerinde yer alır.
        </p>

        <p>
          Ayrıntılı veri işleme için{" "}
          <Link href="/gizlilik">gizlilik politikası</Link> ve{" "}
          <Link href="/kvkk">KVKK metnini</Link> inceleyin.
        </p>

        <p className={styles.metaNote}>Son güncelleme: 12 Ağustos 2026</p>

        <p className={styles.actions}>
          <Link href="/gizlilik">Gizlilik</Link>
          <Link href="/">Ana sayfa</Link>
        </p>
      </article>
    </div>
  );
}
