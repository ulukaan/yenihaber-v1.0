import type { Metadata } from "next";
import Link from "next/link";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import corp from "@/components/corporate-page/corporate-page.module.css";
import { publicApi } from "@/lib/api";

export const metadata: Metadata = {
  title: "Reklam",
  description:
    "Düzce Radikal reklam alanları, medya kiti ve iş birliği teklifleri.",
};

const surfaces = [
  {
    title: "Ana sayfa",
    desc: "Manşet altı ve kategori rayı görünürlüğü — yüksek trafik.",
  },
  {
    title: "Haber detay",
    desc: "Gövde içi (mid-content) ve yan kolon; uzun okuma süresi.",
  },
  {
    title: "Mobil şerit",
    desc: "Servis bandı ve liste görünümleri — hedefe yönelik gösterim.",
  },
  {
    title: "E-bülten",
    desc: "Açık rızalı abonelere günde tek mail içinde sponsor alanı.",
  },
  {
    title: "Sponsorlu içerik",
    desc: "Editoryal etiketli özel dosya ve marka hikâyesi formatı.",
  },
  {
    title: "Yerel kampanya",
    desc: "Düzce / ilçe odaklı paketler ve dönemsel kampanyalar.",
  },
] as const;

/** Reklam ve iş birliği */
export default async function AdsPage() {
  let email = "reklam@duzceradikal.com";
  try {
    const settings = await publicApi.settings.get();
    const contact = settings.contactEmail?.trim();
    if (contact) {
      const replaced = contact.replace(/^iletisim@/i, "reklam@");
      email = replaced.includes("@") ? replaced : contact;
    }
  } catch {
    // varsayılan
  }

  const mailHref = `mailto:${email}?subject=${encodeURIComponent(
    "Reklam teklifi — Düzce Radikal",
  )}`;

  return (
    <CorporatePage
      activeHref="/reklam"
      title="Reklam"
      lead="Düzce ve bölgede takip edilen bir haber platformunda markanızı doğru okuyucuya taşıyın."
      aside={
        <>
          <div className={corp.panel}>
            <h2>Teklif alın</h2>
            <p className={corp.panelStrong}>{email}</p>
            <p>
              Medya kiti, fiyat listesi ve müsaitlik için yazın. Konu satırına
              “Reklam” yazmanız yeterlidir.
            </p>
            <div className={corp.ctaRow}>
              <a className={corp.cta} href={mailHref}>
                E-posta gönder
              </a>
              <Link className={corp.ctaGhost} href="/iletisim">
                Form
              </Link>
            </div>
          </div>
          <div className={corp.panel}>
            <h2>Süreç</h2>
            <p>1. Brief ve hedef kitle</p>
            <p>2. Alan + tarih teklifi</p>
            <p>3. Materyal onayı ve yayın</p>
          </div>
        </>
      }
    >
      <h2>Yayın yüzeyleri</h2>
      <ul className={corp.surfaceGrid}>
        {surfaces.map((s) => (
          <li key={s.title} className={corp.surface}>
            <strong>{s.title}</strong>
            <span>{s.desc}</span>
          </li>
        ))}
      </ul>

      <h2>Yayın ilkeleri</h2>
      <ul className={corp.legalList}>
        <li>İçerik ve reklam net ayrılır; okuyucu yanıltılmaz.</li>
        <li>Yasalara ve yayın ilkelerine aykırı reklam kabul edilmez.</li>
        <li>Sponsorlu metinler açıkça “sponsorlu” etiketiyle belirtilir.</li>
        <li>Fiyat ve envanter talebe ve döneme göre güncellenir.</li>
      </ul>

      <h2>Kimler için</h2>
      <p>
        Yerel işletmeler, kurumlar, etkinlikler ve ulusal markaların Düzce
        odaklı kampanyaları. Siyasi reklam ve yasal kısıtlı kategoriler ayrıca
        değerlendirilir.
      </p>

      <p>
        Genel sorular için{" "}
        <Link href="/iletisim">iletişim</Link> sayfasını da kullanabilirsiniz.
      </p>
    </CorporatePage>
  );
}
