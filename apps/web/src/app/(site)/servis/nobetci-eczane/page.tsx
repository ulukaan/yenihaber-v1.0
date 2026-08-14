import type { Metadata } from "next";
import Link from "next/link";
import {
  getDutyPharmacies,
  pharmacyMapUrl,
  pharmacyPhoneLabel,
  pharmacyTelHref,
} from "@/lib/pharmacy";
import { ServiceShell } from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";
import ph from "@/styles/pharmacy.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Nöbetçi Eczane — Düzce",
  description:
    "Düzce ili ve ilçelerinde bugün nöbetçi eczaneler: adres, telefon, harita ve ilçe listesi.",
};

type PageProps = {
  searchParams: Promise<{ ilce?: string }>;
};

const TIPS = [
  "Gece nöbetlerinde kapı zili / nöbet telefonunu kullanın; vitrinde nöbet listesi asılı olabilir.",
  "Reçeteli ilaçlarda kimlik ve reçete belgelerini yanınızda bulundurun.",
  "Acil tıbbi durumlarda 112’yi arayın — eczane acil servis yerine geçmez.",
  "Liste saatlik güncellenir; doğrulama için eczaneyi aramanız önerilir.",
];

const FAQS = [
  {
    q: "Liste ne sıklıkla güncellenir?",
    a: "Veri kaynağına göre saatte bir yenilenebilir. Şüphe durumunda ilgili eczaneyi telefonla teyit edin.",
  },
  {
    q: "İlçe filtresi nasıl çalışır?",
    a: "Üstteki ilçe etiketlerinden birini seçerek yalnızca o ilçedeki nöbetçi eczaneleri görürsünüz. “Tümü” tüm Düzce kaydını getirir.",
  },
  {
    q: "Harita linki neden yok?",
    a: "Bazı kayıtlarda koordinat gelmeyebilir. Bu durumda adresi harita uygulamanızda aratabilirsiniz.",
  },
];

/** Nöbetçi eczane — ilçe filtre, kart listesi, acil ve SSS */
export default async function PharmacyServicePage({ searchParams }: PageProps) {
  const { ilce: rawIlce } = await searchParams;
  const activeDistrict = rawIlce?.trim() || "";
  const data = await getDutyPharmacies(activeDistrict || null);
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const total = data.items.length;
  const districtCount = data.districts.length;
  const withPhone = data.items.filter((i) => i.phone).length;
  const withMap = data.items.filter((i) => pharmacyMapUrl(i)).length;

  return (
    <ServiceShell
      activeHref="/servis/nobetci-eczane"
      title="Nöbetçi eczane"
      lead="Düzce ve ilçelerinde bugün nöbetçi eczaneler. Adres, telefon ve harita ile hızlı ulaşım; ilçe filtresi ile daraltın."
      meta={`${data.cityLabel}${activeDistrict ? ` · ${activeDistrict}` : " · tüm ilçeler"} · ${today}`}
      aside={
        <>
          <div className={s.panel}>
            <h2>Özet</h2>
            <p>
              <strong>{total}</strong> eczane listede
            </p>
            <p>
              <strong>{districtCount}</strong> ilçe kaydı
            </p>
            <p>
              Telefonlu: <strong>{withPhone}</strong>
            </p>
            <p>
              Haritalı: <strong>{withMap}</strong>
            </p>
          </div>
          <div className={s.panel}>
            <h2>Acil</h2>
            <p>Tıbbi acil durumda eczane beklemeden arayın.</p>
            <div className={s.ctaRow}>
              <a className={s.cta} href="tel:112">
                112 Acil
              </a>
              <a className={s.ctaGhost} href="tel:184">
                184 SABİM
              </a>
            </div>
          </div>
          <div className={s.panel}>
            <h2>Diğer servisler</h2>
            <p>
              <Link href="/servis/namaz">Namaz vakitleri</Link>
            </p>
            <p>
              <Link href="/servis/hava">Hava durumu</Link>
            </p>
            <p>
              <Link href="/servis/doviz">Döviz & piyasa</Link>
            </p>
          </div>
        </>
      }
      disclaimer={`Kaynak: ${data.source}. Liste bilgilendirme amaçlıdır; Eczacı Odası / resmi kayıtlardan teyit edin.`}
    >
      {data.error ? (
        <p className={s.alert} role="alert">
          {data.error}
        </p>
      ) : null}

      <ul className={s.statGrid} aria-label="Liste özeti">
        <li>
          <span>Bugün</span>
          <strong>{total}</strong>
        </li>
        <li>
          <span>İlçe</span>
          <strong>{districtCount || "—"}</strong>
        </li>
        <li>
          <span>Telefon</span>
          <strong>{withPhone}</strong>
        </li>
        <li>
          <span>Harita</span>
          <strong>{withMap}</strong>
        </li>
      </ul>

      {data.districts.length > 0 ? (
        <section className={s.section} aria-label="İlçe seçimi">
          <h2>İlçe filtresi</h2>
          <nav className={ph.filters}>
            <Link
              href="/servis/nobetci-eczane"
              className={!activeDistrict ? ph.filterActive : ph.filter}
              prefetch={false}
            >
              Tümü
            </Link>
            {data.districts.map((d) => {
              const selected =
                activeDistrict.localeCompare(d.name, "tr", {
                  sensitivity: "accent",
                }) === 0;
              return (
                <Link
                  key={d.name}
                  href={`/servis/nobetci-eczane?ilce=${encodeURIComponent(d.name)}`}
                  className={selected ? ph.filterActive : ph.filter}
                  prefetch={false}
                >
                  {d.name}
                  <span className={ph.count}>{d.pharmacyNumber}</span>
                </Link>
              );
            })}
          </nav>
        </section>
      ) : null}

      <section className={s.section}>
        <h2>
          {activeDistrict
            ? `${activeDistrict} nöbetçi eczaneleri`
            : "Tüm nöbetçi eczaneler"}
        </h2>

        {!data.error && data.items.length === 0 ? (
          <p className={s.empty}>
            Bu seçim için nöbetçi eczane kaydı bulunamadı. “Tümü”nü deneyin veya
            daha sonra yenileyin.
          </p>
        ) : null}

        {data.items.length > 0 ? (
          <ul className={ph.list}>
            {data.items.map((item, idx) => {
              const map = pharmacyMapUrl(item);
              return (
                <li
                  key={`${item.name}-${item.phone}-${item.district}-${idx}`}
                  className={ph.card}
                >
                  <div className={ph.cardTop}>
                    <h3 className={ph.name}>{item.name}</h3>
                    {item.district ? (
                      <span className={ph.dist}>{item.district}</span>
                    ) : null}
                  </div>
                  {item.address ? (
                    <p className={ph.address}>{item.address}</p>
                  ) : (
                    <p className={ph.address}>Adres bilgisi kayıtlarda yok.</p>
                  )}
                  <div className={ph.actions}>
                    {item.phone ? (
                      <a
                        href={pharmacyTelHref(item.phone)}
                        className={ph.action}
                        aria-label={`${item.name} telefon`}
                      >
                        Ara · {pharmacyPhoneLabel(item.phone)}
                      </a>
                    ) : null}
                    {map ? (
                      <a
                        href={map}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ph.actionSecondary}
                        aria-label={`${item.name} haritada aç`}
                      >
                        Haritada aç
                      </a>
                    ) : null}
                    {item.address ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${item.name} ${item.address} ${item.district} Düzce`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ph.actionSecondary}
                      >
                        Adres ara
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className={s.section}>
        <h2>Kullanım ipuçları</h2>
        <ul className={s.tips}>
          {TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className={s.section}>
        <h2>Sık sorulanlar</h2>
        <div className={s.faq}>
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </ServiceShell>
  );
}
