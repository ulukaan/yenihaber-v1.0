import type { Metadata } from "next";
import Link from "next/link";
import { getWeather, weatherAdvice } from "@/lib/weather";
import { ServiceShell } from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Hava Durumu — Düzce",
  description:
    "Düzce anlık hava durumu, saatlik ve 7 günlük tahmin, UV, yağış ve günlük öneriler.",
};

const FAQS = [
  {
    q: "Veri kaynağı nedir?",
    a: "Açık veri sağlayıcısı Open-Meteo üzerinden Düzce koordinatları (yaklaşık 40.84°N, 31.16°E) kullanılır. Yerel istasyon farkı olabilir.",
  },
  {
    q: "Ne sıklıkla güncellenir?",
    a: "Sayfa yaklaşık 30 dakikada bir yenilenebilir. Anlık ani değişiklikler için meteoroloji radarlarını takip edin.",
  },
  {
    q: "UV indeksi ne anlama gelir?",
    a: "Yüksek UV’de (özellikle 6+) uzun süre açıkta kalırken güneş koruyucu ve gölge önerilir.",
  },
];

/** Hava durumu — anlık, saatlik, 7 gün, öneriler */
export default async function WeatherServicePage() {
  const w = await getWeather();
  const todayPrecip = w.daily[0]?.precip ?? 0;
  const tips = weatherAdvice(w.now.temp, w.now.code, todayPrecip);
  const updated = new Date(w.updatedAt).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const comfort =
    w.now.temp >= 18 && w.now.temp <= 26 && w.now.humidity < 70
      ? "Konforlu"
      : w.now.temp > 28
        ? "Sıcak"
        : w.now.temp < 8
          ? "Soğuk"
          : "Orta";

  return (
    <ServiceShell
      activeHref="/servis/hava"
      title="Hava durumu"
      lead="Düzce için anlık sıcaklık, hissedilen, nem ve rüzgâr; saatlik görünüm ve 7 günlük tahmini tek ekranda."
      meta={`${w.city} · Kaynak: ${w.source} · Güncelleme: ${updated}`}
      aside={
        <>
          <div className={s.panel}>
            <h2>Konfor</h2>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
              {comfort}
            </p>
            <p>
              Nem %{w.now.humidity} · Rüzgâr {w.now.wind} km/s
            </p>
          </div>
          <div className={s.panel}>
            <h2>Bugün (min / max)</h2>
            {w.daily[0] ? (
              <p>
                <strong>
                  {w.daily[0].tMin}° / {w.daily[0].tMax}°
                </strong>
                <br />
                {w.daily[0].desc}
                <br />
                Yağış: {w.daily[0].precip.toFixed(1)} mm · UV{" "}
                {w.daily[0].uv.toFixed(1)}
              </p>
            ) : (
              <p>—</p>
            )}
          </div>
          <div className={s.panel}>
            <h2>İlgili</h2>
            <p>
              <Link href="/servis/namaz">Namaz vakitleri</Link>
            </p>
            <p>
              <Link href="/servis/nobetci-eczane">Nöbetçi eczane</Link>
            </p>
            <p>
              <Link href="/kategori/gundem">Gündem haberleri</Link>
            </p>
          </div>
        </>
      }
    >
      {w.error ? (
        <p className={s.alert} role="status">
          {w.error}
        </p>
      ) : null}

      <div className={s.heroStat}>
        <div>
          <p className={s.heroLabel}>{w.city}</p>
          <p className={s.heroBig}>
            {w.now.temp}
            <span className={s.heroBigUnit}>°C</span>
          </p>
        </div>
        <div>
          <p className={s.heroSub}>{w.now.desc}</p>
          <p className={s.heroMeta}>
            <span>Hissedilen {w.now.feels}°</span>
            <span>Nem %{w.now.humidity}</span>
            <span>Rüzgâr {w.now.wind} km/s</span>
          </p>
        </div>
      </div>

      <ul className={s.statGrid}>
        <li>
          <span>Sıcaklık</span>
          <strong>{w.now.temp}°</strong>
        </li>
        <li>
          <span>Hissedilen</span>
          <strong>{w.now.feels}°</strong>
        </li>
        <li>
          <span>Nem</span>
          <strong>%{w.now.humidity}</strong>
        </li>
        <li>
          <span>Rüzgâr</span>
          <strong>{w.now.wind} km/s</strong>
        </li>
        <li>
          <span>Bugün max</span>
          <strong>{w.daily[0]?.tMax ?? "—"}°</strong>
        </li>
        <li>
          <span>Bugün min</span>
          <strong>{w.daily[0]?.tMin ?? "—"}°</strong>
        </li>
        <li>
          <span>Yağış</span>
          <strong>{(w.daily[0]?.precip ?? 0).toFixed(1)} mm</strong>
        </li>
        <li>
          <span>UV max</span>
          <strong>{(w.daily[0]?.uv ?? 0).toFixed(1)}</strong>
        </li>
      </ul>

      {w.hourly.length > 0 ? (
        <section className={s.section}>
          <h2>Saatlik görünüm</h2>
          <div className={s.hourScroll} role="list">
            {w.hourly.map((h) => (
              <div key={h.time} className={s.hour} role="listitem">
                <time dateTime={h.time}>{h.hourLabel}</time>
                <strong>{h.temp}°</strong>
                <span>{h.desc}</span>
                <span>%{h.precipProb} yağış</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {w.daily.length > 0 ? (
        <section className={s.section}>
          <h2>7 günlük tahmin</h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Gün</th>
                  <th>Durum</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Yağış</th>
                  <th>UV</th>
                </tr>
              </thead>
              <tbody>
                {w.daily.map((d, i) => (
                  <tr key={d.date}>
                    <td>
                      <strong>
                        {i === 0 ? "Bugün" : d.dateLabel}
                      </strong>
                    </td>
                    <td>{d.desc}</td>
                    <td>{d.tMin}°</td>
                    <td>{d.tMax}°</td>
                    <td>{d.precip.toFixed(1)} mm</td>
                    <td>{d.uv.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className={s.section}>
        <h2>Günün önerileri</h2>
        <ul className={s.tips}>
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
          <li>
            Düzce çevresi vadilerde sabah sis / nem birikimi görülebilir; yola
            çıkmadan kısa vadeli saate bakın.
          </li>
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
