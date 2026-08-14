import type { Metadata } from "next";
import Link from "next/link";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import corp from "@/components/corporate-page/corporate-page.module.css";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "Düzce Radikal gizlilik politikası — verilerin işlenmesi, saklanması ve haklarınız.",
};

const toc = [
  { id: "kapsam", label: "Kapsam" },
  { id: "toplanan", label: "Toplanan veriler" },
  { id: "amaclar", label: "Amaçlar" },
  { id: "paylasim", label: "Paylaşım" },
  { id: "saklama", label: "Saklama" },
  { id: "haklariniz", label: "Haklarınız" },
  { id: "cerezler", label: "Çerezler" },
] as const;

/** Gizlilik politikası */
export default function PrivacyPage() {
  return (
    <CorporatePage
      activeHref="/gizlilik"
      title="Gizlilik"
      lead="Düzce Radikal web sitesi ve ilgili hizmetlerde kişisel verilerin nasıl işlendiğini özetler. Aydınlatma metniyle birlikte okunmalıdır."
      aside={
        <div className={corp.panel}>
          <h2>İçindekiler</h2>
          <ol className={corp.toc}>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
          <p style={{ marginTop: 12 }}>
            <Link href="/kvkk">KVKK metni</Link>
          </p>
          <p>
            <Link href="/cerez">Çerez politikası</Link>
          </p>
          <p>
            <Link href="/iletisim">İletişim / başvuru</Link>
          </p>
        </div>
      }
    >
      <div className={corp.docMeta}>
        <span>
          <strong>Son güncelleme:</strong> 10 Ağustos 2026
        </span>
        <span>
          <strong>Marka:</strong> Düzce Radikal
        </span>
      </div>

      <section id="kapsam" className={corp.section}>
        <h2>1. Kapsam</h2>
        <p>
          Bu politika; site gezintisi, bülten aboneliği, üyelik, iletişim formları,
          yorumlar ve servis sayfalarını kapsar. Ayrıntılı yasal metin için{" "}
          <Link href="/kvkk">KVKK Aydınlatma Metni</Link> esas alınır.
        </p>
      </section>

      <section id="toplanan" className={corp.section}>
        <h2>2. Toplanan veriler</h2>
        <ul className={corp.legalList}>
          <li>
            <strong>Bülten:</strong> e-posta, onay zamanı, rıza kaydı
          </li>
          <li>
            <strong>İletişim formu:</strong> mesaj içeriği ve isteğe bağlı ad /
            e-posta
          </li>
          <li>
            <strong>Hesap (varsa):</strong> ad, e-posta, oturum güvenliği
            kayıtları
          </li>
          <li>
            <strong>Yorumlar:</strong> metin ve isteğe bağlı isim
          </li>
          <li>
            <strong>Teknik:</strong> tarayıcı / cihaz özeti, güvenlik ve
            performans günlükleri, sınırlı IP özeti
          </li>
        </ul>
      </section>

      <section id="amaclar" className={corp.section}>
        <h2>3. İşleme amaçları</h2>
        <ul className={corp.legalList}>
          <li>Haber ve dijital hizmet sunumu</li>
          <li>Bülten ve operasyonel bildirimler (açık rıza ile)</li>
          <li>Taleplerin yanıtlanması ve okuyucu ilişkileri</li>
          <li>Güvenlik, spam ve kötüye kullanımın önlenmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
      </section>

      <section id="paylasim" className={corp.section}>
        <h2>4. Paylaşım</h2>
        <p>
          Verileriniz satılmaz veya pazarlama listelerine devredilmez. Yalnızca
          barındırma, e-posta gönderimi, güvenlik veya yasal zorunluluk
          hallerinde, amaçla sınırlı hizmet sağlayıcılar veya yetkili
          mercilerle paylaşılabilir.
        </p>
      </section>

      <section id="saklama" className={corp.section}>
        <h2>5. Saklama ve güvenlik</h2>
        <p>
          Abonelik ve hesap verileri ilişki sürdüğü sürece; yasal süreler ve
          güvenlik ihtiyaçları çerçevesinde tutulur. İsteğiniz üzerine silme
          talebi değerlendirilir. Teknik ve idari tedbirlerle yetkisiz
          erişime karşı koruma sağlanır.
        </p>
      </section>

      <section id="haklariniz" className={corp.section}>
        <h2>6. Haklarınız</h2>
        <p>
          Erişim, düzeltme, silme ve itiraz haklarınız için{" "}
          <Link href="/iletisim">iletişim</Link> kanallarını kullanın. Resmî
          aydınlatma ve başvuru usulü{" "}
          <Link href="/kvkk">KVKK metninde</Link> yer alır.
        </p>
      </section>

      <section id="cerezler" className={corp.section}>
        <h2>7. Çerezler</h2>
        <p>
          Tercih, oturum ve (varsa) ölçüm amaçlı çerezler için ayrıntılı
          açıklama{" "}
          <Link href="/cerez">çerez politikasında</Link> bulunur. Tarayıcı
          ayarlarından çerezleri yönetebilirsiniz.
        </p>
      </section>
    </CorporatePage>
  );
}
