import type { Metadata } from "next";
import Link from "next/link";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import corp from "@/components/corporate-page/corporate-page.module.css";
import { getSiteSettings } from "@/lib/site-settings";
import { placeLine, resolveCorporate } from "@/lib/corporate";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Düzce Radikal haber merkezi iletişim bilgileri, ihbar hattı ve mesaj formu.",
};

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  return `90${digits}`;
}

function formatTrPhone(digits90: string): string {
  const local = digits90.startsWith("90") ? digits90.slice(2) : digits90;
  const with0 = local.startsWith("0") ? local : `0${local}`;
  return with0.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
}

/** Kurumsal iletişim — künye/footer ile aynı kaynak */
export default async function ContactPage() {
  const settings = await getSiteSettings().catch(() => ({} as Record<string, string>));
  const c = resolveCorporate(settings);
  const tipRaw =
    c.whatsappTip ||
    c.contactPhone ||
    process.env.NEXT_PUBLIC_TIP_PHONE ||
    "";
  const digits = normalizePhone(tipRaw) || "905551112233";
  const tipTel = `+${digits}`;
  const tipWa = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Merhaba, ${c.siteName}’e yazıyorum. `,
  )}`;
  const phoneDisplay = formatTrPhone(digits);
  const place = placeLine(c);

  return (
    <CorporatePage
      activeHref="/iletisim"
      title="İletişim"
      lead="Haber ipucu, düzeltme, genel soru veya reklam talebiniz için doğrudan haber merkezine ulaşın."
      aside={
        <>
          <div className={corp.panel}>
            <h2>İhbar hattı</h2>
            <p>
              Olay, belge veya yerel haber için yazın. Kaynağınız isterseniz
              gizli tutulur.
            </p>
            <div className={corp.ctaRow}>
              <Link className={corp.cta} href="/ihbar">
                İhbar formu
              </Link>
              <a
                className={corp.ctaGhost}
                href={tipWa}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
          <div className={corp.panel}>
            <h2>Diğer</h2>
            <p>
              <Link href="/reklam">Reklam teklifi</Link>
            </p>
            <p>
              <Link href="/kvkk">KVKK metni</Link>
            </p>
            <p>
              <Link href="/kunye">Künye</Link>
            </p>
          </div>
        </>
      }
    >
      <div className={corp.infoGrid}>
        <a className={corp.infoCard} href={`mailto:${c.contactEmail}`}>
          <span className={corp.infoLabel}>E-posta</span>
          <span className={corp.infoValue}>{c.contactEmail}</span>
          <span className={corp.infoHint}>Yanıt için tercih edilen kanal</span>
        </a>
        <a className={corp.infoCard} href={`tel:${tipTel}`}>
          <span className={corp.infoLabel}>Telefon</span>
          <span className={corp.infoValue}>{phoneDisplay}</span>
          <span className={corp.infoHint}>Haber masası</span>
        </a>
        <a
          className={corp.infoCard}
          href={tipWa}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={corp.infoLabel}>WhatsApp</span>
          <span className={corp.infoValue}>{phoneDisplay}</span>
          <span className={corp.infoHint}>İhbar hattı</span>
        </a>
        <div className={corp.infoCard}>
          <span className={corp.infoLabel}>Adres</span>
          <span className={corp.infoValue}>{place}</span>
          <span className={corp.infoHint}>{c.siteName}</span>
        </div>
      </div>

      <h2>Mesaj gönder</h2>
      <ContactForm toEmail={c.contactEmail} />
    </CorporatePage>
  );
}
