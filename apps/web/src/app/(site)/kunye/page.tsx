import type { Metadata } from "next";
import Link from "next/link";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import corp from "@/components/corporate-page/corporate-page.module.css";
import { getSiteSettings } from "@/lib/site-settings";
import { placeLine, resolveCorporate } from "@/lib/corporate";

export const metadata: Metadata = {
  title: "Künye",
  description: "Düzce Radikal yayın künyesi, iletişim ve yasal bilgiler.",
};

/** Yayın künyesi — kurumsal ayarlardan tek kaynak */
export default async function ImprintPage() {
  const settings = await getSiteSettings().catch(() => ({} as Record<string, string>));
  const c = resolveCorporate(settings);
  const place = placeLine(c);

  return (
    <CorporatePage
      activeHref="/kunye"
      title="Künye"
      lead={c.tagline}
      aside={
        <>
          <div className={corp.panel}>
            <h2>İletişim</h2>
            <p className={corp.panelStrong}>{c.contactEmail}</p>
            {c.contactPhone ? (
              <p className={corp.panelStrong}>{c.contactPhone}</p>
            ) : null}
            <p>{place}</p>
            <div className={corp.ctaRow}>
              <Link className={corp.cta} href="/iletisim">
                İletişim
              </Link>
              <Link className={corp.ctaGhost} href="/reklam">
                Reklam
              </Link>
            </div>
          </div>
          <div className={corp.panel}>
            <h2>Yasal</h2>
            <p>
              <Link href="/kvkk">KVKK aydınlatma metni</Link>
            </p>
            <p>
              <Link href="/gizlilik">Gizlilik politikası</Link>
            </p>
            <p>
              <Link href="/kullanim-kosullari">Kullanım koşulları</Link>
            </p>
          </div>
        </>
      }
    >
      <dl className={corp.dl}>
        <div>
          <dt>Yayın adı</dt>
          <dd>{c.siteName}</dd>
        </div>
        {c.legalName ? (
          <div>
            <dt>Ticari ünvan</dt>
            <dd>{c.legalName}</dd>
          </div>
        ) : null}
        {c.imtiyazSahibi ? (
          <div>
            <dt>İmtiyaz sahibi</dt>
            <dd>{c.imtiyazSahibi}</dd>
          </div>
        ) : null}
        {c.sorumluMudur ? (
          <div>
            <dt>Sorumlu müdür</dt>
            <dd>{c.sorumluMudur}</dd>
          </div>
        ) : null}
        <div>
          <dt>Yayın türü</dt>
          <dd>{c.yayinTuru}</dd>
        </div>
        <div>
          <dt>Yayın periyodu</dt>
          <dd>{c.yayinPeriyodu}</dd>
        </div>
        <div>
          <dt>Yayın dili</dt>
          <dd>Türkçe</dd>
        </div>
        <div>
          <dt>Yayın yeri</dt>
          <dd>{place}</dd>
        </div>
        {c.uetsAddress ? (
          <div>
            <dt>UETS / KEP</dt>
            <dd>{c.uetsAddress}</dd>
          </div>
        ) : null}
        {c.hostingProvider ? (
          <div>
            <dt>Yer sağlayıcı</dt>
            <dd>{c.hostingProvider}</dd>
          </div>
        ) : null}
        {c.taxOffice || c.taxNo ? (
          <div>
            <dt>Vergi</dt>
            <dd>{[c.taxOffice, c.taxNo].filter(Boolean).join(" · ")}</dd>
          </div>
        ) : null}
        <div>
          <dt>Editoryal iletişim</dt>
          <dd>
            <a href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>
          </dd>
        </div>
        <div>
          <dt>Web adresi</dt>
          <dd>
            <a href={c.siteUrl} rel="noopener noreferrer">
              {c.siteUrl.replace(/^https?:\/\//, "")}
            </a>
          </dd>
        </div>
      </dl>

      {c.kunyeEntries.length ? (
        <>
          <h2>Künye</h2>
          <dl className={corp.dl}>
            {c.kunyeEntries.map((r, i) => (
              <div key={`${r.department}-${i}`}>
                <dt>{r.department || "—"}</dt>
                <dd>
                  {r.detail}
                  {r.email ? (
                    <>
                      {" · "}
                      <a href={`mailto:${r.email}`}>{r.email}</a>
                    </>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className={corp.lead}>
          Künye satırları panelden henüz doldurulmamış.{" "}
          <strong>Kurumsal → Künye İşlemleri</strong> bölümünden sorumlu müdür,
          yayıncı ve iletişim bilgilerini ekleyin.
        </p>
      )}

      <h2>Yayın ilkeleri</h2>
      <ul className={corp.legalList}>
        <li>Doğruluk, hız ve yerellik önceliklidir.</li>
        <li>Düzeltme ve cevap hakları dikkate alınır.</li>
        <li>Haber ile reklam / sponsorlu içerik net biçimde ayrılır.</li>
        <li>Okuyucu katkıları moderasyon kurallarına tabidir.</li>
      </ul>
    </CorporatePage>
  );
}
