import type { Metadata } from "next";
import Link from "next/link";
import styles from "../yasal.module.css";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "Düzce Radikal web sitesi kullanım koşulları ve sorumluluk sınırları.",
};

/** Kullanım koşulları */
export default function TermsPage() {
  return (
    <div className={`yh-container ${styles.page}`}>
      <article className={styles.card}>
        <h1>Kullanım Koşulları</h1>
        <p>
          Siteyi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
          Koşullar güncellenebilir; yayım tarihinden itibaren geçerlidir.
        </p>

        <h2>Hizmet</h2>
        <p>
          Düzce Radikal, haber ve bilgilendirme amaçlı içerik yayınlar. Canlı
          servis özetleri (döviz, hava vb.) bilgilendirme niteliğindedir; yatırım
          veya tıbbi tavsiye sayılmaz.
        </p>

        <h2>İçerik ve fikri mülkiyet</h2>
        <ul>
          <li>Yayınlanan metin, görsel ve marka unsurları korunur.</li>
          <li>Kaynak gösterilmeden alıntı veya kopyalama yasaktır.</li>
          <li>Ticari kullanım için yazılı izin gerekir.</li>
        </ul>

        <h2>Kullanıcı katkıları</h2>
        <p>
          Yorum ve form alanlarında yasadışı, nefret içeren, hakaret veya spam
          içerik yasaktır. Yönetim moderasyon ve kaldırma hakkını saklı tutar.
        </p>

        <h2>Hesaplar</h2>
        <p>
          Üyelik oluşturursanız kimlik bilgilerinizin doğruluğundan ve şifre
          güvenliğinden siz sorumlusunuz.
        </p>

        <h2>Sorumluluk sınırı</h2>
        <p>
          Site kesintisiz ve hatasız hizmet taahhüt etmez. Üçüncü taraf
          bağlantılardan Düzce Radikal sorumlu tutulamaz.
        </p>

        <h2>Uygulanacak hukuk</h2>
        <p>
          Türkiye Cumhuriyeti kanunları ve yetkili mahkemeler geçerlidir.
          Sorular için <Link href="/iletisim">iletişim</Link> sayfasını kullanın.
        </p>

        <p className={styles.metaNote}>Son güncelleme: 10 Ağustos 2026</p>

        <p className={styles.actions}>
          <Link href="/gizlilik">Gizlilik</Link>
          <Link href="/kvkk">KVKK</Link>
          <Link href="/">Ana sayfa</Link>
        </p>
      </article>
    </div>
  );
}
