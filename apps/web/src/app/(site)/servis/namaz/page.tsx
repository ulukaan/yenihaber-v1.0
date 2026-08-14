import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import {
  ServiceShell,
} from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Namaz Vakitleri",
  description:
    "Düzce ve Türkiye illeri için güncel namaz vakitleri, sıradaki vakit ve bölge karşılaştırması.",
};

type Props = {
  searchParams: Promise<{ il?: string }>;
};

const REGION = ["duzce", "bolu", "sakarya", "zonguldak", "istanbul", "ankara"];

const FAQS = [
  {
    q: "Vakitler hangi kaynağa göre hesaplanıyor?",
    a: "Diyanet İşleri Başkanlığı metodolojisine uyumlu API verisi kullanılır. Bilgi amaçlıdır; resmî duyurular için Diyanet kaynaklarını esas alın.",
  },
  {
    q: "Neden bir il seçmeliyim?",
    a: "Güneşin doğuş ve batışına göre vakitler değişir. İl merkezi koordinatları baz alınır; ilçelerde birkaç dakikalık fark olabilir.",
  },
  {
    q: "Sıradaki vakit nasıl hesaplanır?",
    a: "Günün imsak–yatsı aralığında henüz gelmemiş ilk vakit “sıradaki” olarak işaretlenir. Tüm vakitler geçtiyse ertesi gün imsak gösterilebilir.",
  },
];

/** Namaz vakitleri — il seçimi, zaman çizelgesi, bölge karşılaştırması */
export default async function PrayerServicePage({ searchParams }: Props) {
  const sp = await searchParams;
  let cities: { slug: string; name: string }[] = [];
  let defaultCity = "duzce";
  try {
    const list = await publicApi.prayer.cities();
    cities = list.cities;
    defaultCity = list.defaultCity || "duzce";
  } catch {
    cities = [{ slug: "duzce", name: "Düzce" }];
  }

  const citySlug = (sp.il?.trim() || defaultCity).toLowerCase();
  const validSlug = cities.some((c) => c.slug === citySlug)
    ? citySlug
    : defaultCity;

  let prayer: Awaited<ReturnType<typeof publicApi.prayer.get>> | null = null;
  try {
    prayer = await publicApi.prayer.get(validSlug);
  } catch {
    prayer = null;
  }

  const regionSlugs = REGION.filter((slug) =>
    cities.some((c) => c.slug === slug),
  ).slice(0, 6);

  const regionTimes = await Promise.all(
    regionSlugs.map(async (slug) => {
      try {
        const p = await publicApi.prayer.get(slug);
        return {
          slug,
          name: p.city.name,
          ogle: p.times.ogle,
          aksam: p.times.aksam,
          yatsi: p.times.yatsi,
        };
      } catch {
        return null;
      }
    }),
  );

  const rows = prayer
    ? [
        { k: "İmsak", v: prayer.times.imsak, key: "imsak" },
        { k: "Güneş", v: prayer.times.gunes, key: "gunes" },
        { k: "Öğle", v: prayer.times.ogle, key: "ogle" },
        { k: "İkindi", v: prayer.times.ikindi, key: "ikindi" },
        { k: "Akşam", v: prayer.times.aksam, key: "aksam" },
        { k: "Yatsı", v: prayer.times.yatsi, key: "yatsi" },
      ]
    : [];

  const nextKey = prayer?.next?.key;
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const popular = cities
    .filter((c) => REGION.includes(c.slug) || c.slug === validSlug)
    .slice(0, 12);
  const chips = popular.length ? popular : cities.slice(0, 12);

  return (
    <ServiceShell
      activeHref="/servis/namaz"
      title="Namaz vakitleri"
      lead="Günün imsak, güneş, öğle, ikindi, akşam ve yatsı saatleri. İl seçerek vakitleri görüntüleyin; sıradaki vakit vurgulanır."
      meta={
        prayer
          ? `${prayer.city.name} · ${prayer.date || today} · Kaynak: ${prayer.source}`
          : today
      }
      aside={
        <>
          <div className={s.panel}>
            <h2>Sıradaki vakit</h2>
            {prayer?.next ? (
              <>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                  {prayer.next.time}
                </p>
                <p>
                  <strong>{prayer.next.label}</strong> — {prayer.city.name}
                </p>
              </>
            ) : (
              <p>Veri alınamadı.</p>
            )}
          </div>
          <div className={s.panel}>
            <h2>Hızlı erişim</h2>
            <p>
              <Link href="/servis/hava">Hava durumu</Link>
            </p>
            <p>
              <Link href="/servis/nobetci-eczane">Nöbetçi eczane</Link>
            </p>
            <p>
              <Link href="/servis/doviz">Döviz & piyasa</Link>
            </p>
          </div>
          <div className={s.panel}>
            <h2>Not</h2>
            <ul>
              <li>İl merkezi baz alınır</li>
              <li>Yaz/kış saati uygulaması API’de yansır</li>
              <li>Sayfa saatte bir yenilenebilir</li>
            </ul>
          </div>
        </>
      }
    >
      <section className={s.section} aria-label="İl seçimi">
        <h2>İl seçin</h2>
        <div className={s.cityBar}>
          {chips.map((c) => (
            <Link
              key={c.slug}
              href={`/servis/namaz?il=${encodeURIComponent(c.slug)}`}
              className={c.slug === validSlug ? s.chipOn : s.chip}
              prefetch={false}
            >
              {c.name}
            </Link>
          ))}
        </div>
        {cities.length > chips.length ? (
          <p style={{ fontSize: "0.85rem", color: "#777" }}>
            Diğer iller için link örneği:{" "}
            <code>/servis/namaz?il=izmir</code>
          </p>
        ) : null}
      </section>

      {prayer ? (
        <div className={s.heroStat}>
          <div>
            <p className={s.heroLabel}>Sıradaki</p>
            <p className={s.heroBig}>
              {prayer.next?.time ?? "—"}
            </p>
          </div>
          <div>
            <p className={s.heroSub}>{prayer.next?.label ?? "Vakit"}</p>
            <p className={s.heroMeta}>
              <span>{prayer.city.name}</span>
              <span>{prayer.date}</span>
            </p>
          </div>
        </div>
      ) : (
        <p className={s.alert} role="alert">
          Namaz vakitleri şu an alınamadı. Lütfen kısa süre sonra tekrar
          deneyin.
        </p>
      )}

      {rows.length ? (
        <section className={s.section}>
          <h2>Günün vakitleri — kart</h2>
          <ul className={s.cardGrid}>
            {rows.map((r) => (
              <li
                key={r.key}
                className={r.key === nextKey ? s.cardOn : s.card}
              >
                <span>{r.k}</span>
                <strong>{r.v}</strong>
                {r.key === nextKey ? <small>Sıradaki</small> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rows.length ? (
        <section className={s.section}>
          <h2>Zaman çizelgesi</h2>
          <ul className={s.timeline}>
            {rows.map((r) => (
              <li
                key={r.key}
                className={r.key === nextKey ? s.timelineNext : undefined}
              >
                <span className={s.tlLabel}>{r.k}</span>
                <span className={s.tlHint}>
                  {r.key === nextKey ? "Sıradaki vakit" : "Günün saati"}
                </span>
                <strong>{r.v}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {regionTimes.some(Boolean) ? (
        <section className={s.section}>
          <h2>Bölge karşılaştırması</h2>
          <p>
            Öğle, akşam ve yatsı — yakın illerdeki farkı hızlıca görün.
          </p>
          <ul className={s.compareGrid}>
            {regionTimes.filter(Boolean).map((r) =>
              r ? (
                <li key={r.slug} className={s.compare}>
                  <h3>
                    {r.name}
                    {r.slug === validSlug ? (
                      <>
                        {" "}
                        <span className={s.badge}>Seçili</span>
                      </>
                    ) : null}
                  </h3>
                  <dl>
                    <div>
                      <dt>Öğle</dt>
                      <dd>{r.ogle}</dd>
                    </div>
                    <div>
                      <dt>Akşam</dt>
                      <dd>{r.aksam}</dd>
                    </div>
                    <div>
                      <dt>Yatsı</dt>
                      <dd>{r.yatsi}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/servis/namaz?il=${r.slug}`}
                    className={s.chip}
                    prefetch={false}
                    style={{ justifyContent: "center" }}
                  >
                    Bu ili aç
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

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
