import type { Metadata } from "next";
import Link from "next/link";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import corp from "@/components/corporate-page/corporate-page.module.css";
import { publicApi } from "@/lib/api";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "Düzce Radikal 6698 sayılı KVKK kapsamında kişisel verilerin korunması aydınlatma metni.",
};

const toc = [
  { id: "veri-sorumlusu", label: "Veri sorumlusu" },
  { id: "islenen-veriler", label: "İşlenen veriler" },
  { id: "amac", label: "Amaç ve hukuki sebep" },
  { id: "aktarim", label: "Aktarım ve saklama" },
  { id: "haklar", label: "Haklarınız" },
  { id: "basvuru", label: "Başvuru" },
] as const;

/** KVKK aydınlatma metni */
export default async function KvkkPage() {
  let email = "kvkk@duzceradikal.com";
  try {
    const settings = await publicApi.settings.get();
    const contact = settings.contactEmail?.trim();
    if (contact) {
      const replaced = contact.replace(/^iletisim@/i, "kvkk@");
      email = replaced.includes("@") ? replaced : contact;
    }
  } catch {
    // varsayılan
  }

  return (
    <CorporatePage
      activeHref="/kvkk"
      title="KVKK Aydınlatma Metni"
      lead="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bülten, iletişim, üyelik ve site kullanımında işlenen veriler hakkında bilgilendirme."
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
            <Link href="/gizlilik">Gizlilik politikası</Link>
          </p>
          <p>
            <Link href="/cerez">Çerez politikası</Link>
          </p>
        </div>
      }
    >
      <div className={corp.docMeta}>
        <span>
          <strong>Yürürlük:</strong> 10 Ağustos 2026
        </span>
        <span>
          <strong>Kapsam:</strong> Web sitesi, bülten, iletişim
        </span>
      </div>

      <section id="veri-sorumlusu" className={corp.section}>
        <h2>1. Veri sorumlusu</h2>
        <p>
          Kişisel verileriniz bakımından veri sorumlusu{" "}
          <strong>Düzce Radikal</strong> (yayın yeri: Düzce, Türkiye)
          sıfatıyla hareket etmektedir.
        </p>
        <p>
          KVKK başvuruları:{" "}
          <a href={`mailto:${email}`}>{email}</a> ·{" "}
          <Link href="/iletisim">İletişim formu</Link>
        </p>
      </section>

      <section id="islenen-veriler" className={corp.section}>
        <h2>2. İşlenen kişisel veriler</h2>
        <ul className={corp.legalList}>
          <li>
            <strong>Kimlik / iletişim:</strong> ad-soyad (isteğe bağlı), e-posta,
            telefon (ihbar hattı üzerinden iletilirse)
          </li>
          <li>
            <strong>Bülten:</strong> e-posta, açık rıza ve onay zamanı, abonelik
            durumu
          </li>
          <li>
            <strong>Hesap (varsa):</strong> ad, e-posta, oturum ve güvenlik
            kayıtları
          </li>
          <li>
            <strong>İçerik katkısı:</strong> yorum metni, kullanıcı adı / takma ad
          </li>
          <li>
            <strong>Teknik:</strong> tarayıcı / cihaz özeti, güvenlik ve
            performans için sınırlı günlükler, IP özeti (hash)
          </li>
        </ul>
      </section>

      <section id="amac" className={corp.section}>
        <h2>3. İşleme amaçları ve hukuki sebepler</h2>
        <ul className={corp.legalList}>
          <li>
            Haber ve dijital yayın hizmetinin sunulması (sözleşmenin ifası /
            meşru menfaat)
          </li>
          <li>
            E-bülten aboneliği — yalnızca <strong>açık rıza</strong>; çift onay
            (double opt-in) ile aktifleşir
          </li>
          <li>
            İletişim ve ihbar taleplerinin yanıtlanması (açık rıza / meşru menfaat)
          </li>
          <li>
            Güvenlik, spam ve kötüye kullanımın önlenmesi (meşru menfaat)
          </li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
        <p>
          Bülten listesine eklenmeden önce e-posta adresinize onay bağlantısı
          gönderilir. Onay vermeden abone yapılmazsınız; istediğiniz zaman
          abonelikten çıkabilirsiniz.
        </p>
      </section>

      <section id="aktarim" className={corp.section}>
        <h2>4. Aktarım, saklama ve güvenlik</h2>
        <p>
          Kişisel verileriniz satılmaz veya pazarlama listelerine
          devredilmez. Yalnızca barındırma, e-posta gönderimi, güvenlik veya
          yasal zorunluluk hallerinde, amaçla sınırlı olarak hizmet
          sağlayıcılar veya yetkili mercilerle paylaşılabilir.
        </p>
        <p>
          Veriler, işleme amacının gerektirdiği süre ve yasal saklama
          yükümlülükleri boyunca tutulur. Abonelikten çıkmanız veya silme
          talebiniz halinde mümkün olan en kısa sürede silinir veya
          anonimleştirilir.
        </p>
        <p>
          Teknik ve idari tedbirlerle yetkisiz erişim, kayıp ve değişikliğe
          karşı korunma sağlanır.
        </p>
      </section>

      <section id="haklar" className={corp.section}>
        <h2>5. KVKK md. 11 kapsamındaki haklarınız</h2>
        <ul className={corp.legalList}>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde / yurt dışında aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>
            KVKK’nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini
            veya yok edilmesini isteme
          </li>
          <li>Otomatik sistemler ile analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
          <li>
            Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın
            giderilmesini talep etme
          </li>
        </ul>
      </section>

      <section id="basvuru" className={corp.section}>
        <h2>6. Başvuru yöntemi</h2>
        <p>
          Haklarınıza ilişkin taleplerinizi kimliğinizi teyit edecek bilgilerle
          birlikte{" "}
          <a href={`mailto:${email}`}>{email}</a> adresine veya{" "}
          <Link href="/iletisim">iletişim formu</Link> üzerinden
          iletebilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır;
          işlemin ayrıca bir maliyeti gerektirmesi hâlinde Kişisel Verileri
          Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
        </p>
        <p>
          Ayrıntılı site gizlilik ve çerez uygulamaları için{" "}
          <Link href="/gizlilik">gizlilik politikası</Link> ile{" "}
          <Link href="/cerez">çerez politikasına</Link> bakınız.
        </p>
      </section>
    </CorporatePage>
  );
}
