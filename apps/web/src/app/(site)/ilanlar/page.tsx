import type { Metadata } from "next";
import Link from "next/link";
import {
  PAID_LISTING_KIND_LABELS,
  type ApiPaidListing,
  type PaidListingKind,
} from "@yenihaber/shared";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import corp from "@/components/corporate-page/corporate-page.module.css";
import { publicApi } from "@/lib/api";
import { getSiteSettings } from "@/lib/site-settings";
import { resolveCorporate } from "@/lib/corporate";
import styles from "./ilanlar.module.css";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Ücretli İlanlar",
  description:
    "Düzce Radikal’de vefat, taziye, tebrik ve duyuru ilanı yayınlatın. WhatsApp ile hızlı başvuru.",
};

function digitsPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("90") && d.length >= 12) return d;
  if (d.startsWith("0") && d.length === 11) return `90${d.slice(1)}`;
  if (d.length === 10) return `90${d}`;
  return d;
}

/** Ücretli ilan listesi + WhatsApp sipariş CTA */
export default async function IlanlarPage() {
  let items: ApiPaidListing[] = [];
  try {
    const res = await publicApi.listings.list();
    items = res.data;
  } catch {
    items = [];
  }

  const settings = await getSiteSettings().catch(
    () => ({}) as Record<string, string>,
  );
  const c = resolveCorporate(settings);
  const waDigits =
    digitsPhone(c.whatsappTip) ||
    digitsPhone(c.contactPhone) ||
    digitsPhone(settings["social.whatsapp"] ?? "");
  const waText = encodeURIComponent(
    "Merhaba, Düzce Radikal’de ücretli ilan (vefat / taziye / duyuru) vermek istiyorum.",
  );
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${waText}`
    : `mailto:${c.contactEmail}?subject=${encodeURIComponent("Ücretli ilan talebi")}`;

  const byKind = items.reduce(
    (acc, row) => {
      acc[row.kind] = (acc[row.kind] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<PaidListingKind, number>>,
  );

  return (
    <CorporatePage
      activeHref="/ilanlar"
      title="Ücretli ilanlar"
      lead="Vefat, taziye, teşekkür, tebrik ve duyurularınızı Düzce Radikal’de yayınlatın. Başvuru WhatsApp veya e-posta ile."
      aside={
        <>
          <div className={corp.panel}>
            <h2>İlan ver</h2>
            <p>
              Metninizi hazırlayın; yayın süresi ve ücret için yazın. Aynı gün
              yayına alınabilir.
            </p>
            <div className={corp.ctaRow}>
              <a className={corp.cta} href={waHref}>
                {waDigits ? "WhatsApp ile yaz" : "E-posta gönder"}
              </a>
              <Link className={corp.ctaGhost} href="/iletisim">
                Form
              </Link>
            </div>
          </div>
          <div className={corp.panel}>
            <h2>Türler</h2>
            <ul>
              {(
                Object.keys(PAID_LISTING_KIND_LABELS) as PaidListingKind[]
              ).map((k) => (
                <li key={k}>
                  {PAID_LISTING_KIND_LABELS[k]}
                  {byKind[k] ? ` · ${byKind[k]}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className={corp.panel}>
            <h2>Ücretsiz vefat</h2>
            <p>
              Belediye MEBİS kayıtları{" "}
              <Link href="/servis/vefat">Vefat ilanları</Link> sayfasında.
            </p>
          </div>
        </>
      }
    >
      {items.length === 0 ? (
        <p className={styles.empty}>
          Şu an yayında ücretli ilan yok. İlan vermek için WhatsApp’tan yazın.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((row) => (
            <li key={row.id}>
              <article className={styles.card} data-featured={row.featured || undefined}>
                <div className={styles.meta}>
                  <span className={styles.kind}>
                    {PAID_LISTING_KIND_LABELS[row.kind]}
                  </span>
                  {row.featured ? (
                    <span className={styles.feat}>Öne çıkan</span>
                  ) : null}
                </div>
                <h2 className={styles.title}>
                  <Link href={`/ilanlar/${row.slug}`}>{row.title}</Link>
                </h2>
                {row.personName ? (
                  <p className={styles.person}>{row.personName}</p>
                ) : null}
                {row.body ? (
                  <p className={styles.excerpt}>
                    {row.body.length > 220
                      ? `${row.body.slice(0, 220).trim()}…`
                      : row.body}
                  </p>
                ) : null}
                <Link className={styles.more} href={`/ilanlar/${row.slug}`}>
                  İlanı oku
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </CorporatePage>
  );
}
