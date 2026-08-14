import { CloudSun } from "lucide-react";
import { weather } from "@/lib/live-data";
import { getMarkets } from "@/lib/markets";
import { getPrayerTimes } from "@/lib/prayer";
import { PrayerCityPicker } from "./prayer-city-picker";
import { FxRotator } from "./fx-rotator";
import { MarketsDesktopSlots } from "./markets-desktop-slots";
import styles from "./service-strip.module.css";

const iconProps = {
  size: 15,
  strokeWidth: 2,
  absoluteStrokeWidth: false,
  "aria-hidden": true as const,
};

/**
 * Servis bandı — Hava · Namaz · Döviz / Altın / Kripto (eşzamanlı 5 sn)
 */
export async function ServiceStrip() {
  const [markets, prayer] = await Promise.all([
    getMarkets(),
    getPrayerTimes("duzce").catch(() => null),
  ]);

  return (
    <section className={styles.wrap} aria-label="Günlük servisler">
      <div className={`yh-container ${styles.inner}`}>
        <div className={styles.item}>
          <span className={styles.mark} aria-hidden>
            <CloudSun {...iconProps} />
          </span>
          <div className={styles.copy}>
            <span className={styles.label}>{weather.city}</span>
            <strong className={styles.value}>{weather.temp}°</strong>
          </div>
        </div>

        <PrayerCityPicker initial={prayer} />

        <div className={styles.mobileFx}>
          <FxRotator items={markets.fx} intervalMs={5000} />
        </div>

        <MarketsDesktopSlots
          fx={markets.fx}
          gold={markets.gold}
          crypto={markets.crypto}
          intervalMs={5000}
        />
      </div>
    </section>
  );
}
