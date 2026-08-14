import type { Metadata } from "next";
import Link from "next/link";
import { ServiceShell, SERVICE_NAV } from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";
import { getMarkets } from "@/lib/markets";
import { getPrayerTimes } from "@/lib/prayer";
import { getDutyPharmacies } from "@/lib/pharmacy";
import { getVefatNotices } from "@/lib/vefat";
import { getWeather } from "@/lib/weather";
import { getCinema } from "@/lib/cinema";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Servisler",
  description:
    "Düzce Radikal servisleri: namaz vakitleri, nöbetçi eczane, vefat ilanları, hava durumu, döviz ve vizyon.",
};

const DESCS: Record<string, string> = {
  "/servis/namaz":
    "İl bazlı imsak–yatsı, sıradaki vakit ve bölge karşılaştırması.",
  "/servis/nobetci-eczane":
    "Düzce ve ilçelerinde bugün nöbetçi eczaneler, telefon ve harita.",
  "/servis/vefat":
    "MEBİS kaynaklı vefat ve cenaze duyuruları — günlük liste.",
  "/servis/hava":
    "Anlık sıcaklık, saatlik ve 7 günlük tahmin, UV ve öneriler.",
  "/servis/doviz":
    "Döviz, altın, kripto ve yakıt panelleri — bilgilendirme amaçlı.",
  "/servis/vizyon":
    "Vizyondaki filmler — poster sürgüsü ve Beyazperde bağlantıları.",
};

/** Servisler ana dizin — özet kartlar + canlı parçalar */
export default async function ServicesIndexPage() {
  const [prayer, weather, markets, pharmacy, vefat, cinema] = await Promise.all([
    getPrayerTimes("duzce").catch(() => null),
    getWeather(),
    getMarkets(),
    getDutyPharmacies(null),
    getVefatNotices(),
    getCinema(),
  ]);

  const usd =
    markets.fx.find((x) => /USD/i.test(x.code + x.label)) ?? markets.fx[0];

  const previews: Record<string, string> = {
    "/servis/namaz": prayer
      ? `${prayer.city.name}: sıradaki ${prayer.next.label} ${prayer.next.time}`
      : "Vakitler yükleniyor…",
    "/servis/nobetci-eczane": `${pharmacy.items.length} eczane · ${pharmacy.cityLabel}`,
    "/servis/vefat": vefat.error
      ? "Kaynak geçici olarak yanıt vermiyor"
      : `${vefat.items.length} duyuru · MEBİS`,
    "/servis/hava": `${weather.city} ${weather.now.temp}° · ${weather.now.desc}`,
    "/servis/doviz": usd
      ? `${usd.label} ${usd.value} (${usd.change || "—"})`
      : "Piyasa verisi",
    "/servis/vizyon": cinema.films.length
      ? `${cinema.films.length} film · Beyazperde`
      : "Vizyon listesi yükleniyor…",
  };

  return (
    <ServiceShell
      activeHref="/servis"
      title="Servisler"
      lead="Günlük yaşam için Düzce odaklı yardımcılar: namaz, eczane, vefat, hava ve piyasa — tek yerden."
      meta="Veriler periyodik yenilenir · bilgilendirme amaçlıdır"
    >
      <ul className={s.compareGrid}>
        {SERVICE_NAV.map((item) => (
          <li key={item.href} className={s.compare}>
            <h3>
              <Link
                href={item.href}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {item.label}
              </Link>
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#555" }}>
              {DESCS[item.href]}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.92rem",
                fontWeight: 750,
                color: "#121212",
              }}
            >
              {previews[item.href]}
            </p>
            <Link
              href={item.href}
              className={s.cta}
              style={{ justifySelf: "start", marginTop: 4 }}
              prefetch={false}
            >
              Aç
            </Link>
          </li>
        ))}
      </ul>

      <section className={s.section}>
        <h2>Neden burada?</h2>
        <ul className={s.tips}>
          <li>
            Haber okurken namaz, eczane, hava ve kura hızlı geçiş — ayrı site
            aramaya gerek yok.
          </li>
          <li>
            Kaynak notları ve yenileme sıklığı her sayfada belirtilir.
          </li>
          <li>
            Resmî prosedürler için kurumların birincil kanallarını kullanın.
          </li>
        </ul>
      </section>
    </ServiceShell>
  );
}
