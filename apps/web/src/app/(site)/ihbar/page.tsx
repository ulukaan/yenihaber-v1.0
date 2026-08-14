import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Phone, Shield } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { resolveCorporate } from "@/lib/corporate";
import { IhbarForm } from "./ihbar-form";
import styles from "./ihbar.module.css";

export const metadata: Metadata = {
  title: "İhbar hattı",
  description:
    "Düzce Radikal haber ihbar hattı. Olay, belge veya yerel haber ipucunuzu güvenle iletin. Anonim bildirim mümkün.",
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

/** Haber ihbar sayfası — form + WhatsApp */
export default async function IhbarPage() {
  const settings = await getSiteSettings().catch(
    () => ({}) as Record<string, string>,
  );
  const c = resolveCorporate(settings);
  const tipRaw =
    c.whatsappTip ||
    c.contactPhone ||
    process.env.NEXT_PUBLIC_TIP_PHONE ||
    "";
  const digits = normalizePhone(tipRaw) || "905551112233";
  const tipTel = `+${digits}`;
  const tipWa = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Merhaba, ${c.siteName} ihbar hattına yazıyorum. Konu: `,
  )}`;
  const phoneDisplay = formatTrPhone(digits);
  const tipTitle =
    settings["footer.tipTitle"]?.trim() || "İhbar hattı";
  const tipBody =
    settings["footer.tipBody"]?.trim() ||
    "Olay, belge veya yerel haber ipucu için yazın. Kaynağınız isterseniz gizli tutulur.";

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={`yh-container ${styles.heroInner}`}>
          <nav className={styles.crumb} aria-label="Sayfa konumu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden>/</span>
            <span>İhbar</span>
          </nav>
          <p className={styles.brand}>{c.siteName}</p>
          <p className={styles.kicker}>Haber masası</p>
          <h1 className={styles.title}>{tipTitle}</h1>
          <p className={styles.lead}>{tipBody}</p>
          <ul className={styles.trust}>
            <li>
              <Shield size={14} strokeWidth={2} aria-hidden />
              Anonim mümkün
            </li>
            <li>
              <Shield size={14} strokeWidth={2} aria-hidden />
              Kaynak gizliliği
            </li>
            <li>
              <MessageCircle size={14} strokeWidth={2} aria-hidden />
              Form veya WhatsApp
            </li>
          </ul>
        </div>
      </header>

      <div className={`yh-container ${styles.layout}`}>
        <section className={styles.formCard} aria-labelledby="ihbar-form-title">
          <h2 id="ihbar-form-title">İhbar formu</h2>
          <p className={styles.formHint}>
            Kısa ve net yazın. Fotoğraf veya belge için WhatsApp tercih
            edilir.
          </p>
          <IhbarForm toEmail={c.contactEmail} siteName={c.siteName} />
        </section>

        <aside className={styles.aside} aria-label="Hızlı iletişim">
          <div className={`${styles.panel} ${styles.panelAccent}`}>
            <h2>WhatsApp ihbar</h2>
            <p>
              Acil veya görsel içeren ihbarlar için doğrudan yazın.
              Numara: {phoneDisplay}
            </p>
            <div className={styles.ctaRow}>
              <a
                className={styles.cta}
                href={tipWa}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} strokeWidth={2} aria-hidden />
                WhatsApp ile yaz
              </a>
              <a className={styles.ctaGhost} href={`tel:${tipTel}`}>
                <Phone size={16} strokeWidth={2} aria-hidden />
                Ara
              </a>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>Nasıl işler?</h2>
            <ol className={styles.steps}>
              <li>Olayı ve yeri net yazın.</li>
              <li>İsterseniz anonim kalın.</li>
              <li>Editör ekibi değerlendirir.</li>
            </ol>
          </div>

          <div className={styles.panel}>
            <h2>Diğer</h2>
            <p>
              Genel soru veya düzeltme için{" "}
              <Link href="/iletisim">iletişim</Link> sayfasını kullanın.
            </p>
            <p>
              <Link href="/kvkk">KVKK metni</Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
