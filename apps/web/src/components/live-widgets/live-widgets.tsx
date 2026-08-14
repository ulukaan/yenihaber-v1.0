import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import { Copy } from "@/lib/copy";
import {
  fixtures,
  fuelPrices as fuelPricesFallback,
  liveScores,
  marketBorsa,
  marketFx,
  marketGold,
  prayerTimes,
  standings,
  weather,
  type FuelPrice,
  type MarketItem,
} from "@/lib/live-data";
import { getFuelPrices } from "@/lib/fuel";
import styles from "./live-widgets.module.css";

export type LiveWidgetsProps = {
  /** Canlı haber akışı (son dakika) */
  liveNews?: ApiArticle[];
  /** Hangi bloklar gösterilsin */
  show?: LiveWidgetId[];
  /** Yerleşim: dikey yığın / ızgaralar / yatay band */
  layout?: "stack" | "grid2" | "grid3" | "grid4" | "band";
  /** Çoklu kullanımda id çakışmasını önler */
  idPrefix?: string;
  /** Alt disclaimer gizle */
  hideDisclaimer?: boolean;
  className?: string;
  /** Dışarıdan akaryakıt (yoksa ulusal API) */
  fuelPrices?: FuelPrice[];
};

export type LiveWidgetId =
  | "news"
  | "scores"
  | "standings"
  | "fixtures"
  | "prayer"
  | "weather"
  | "fx"
  | "gold"
  | "borsa"
  | "fuel";

const defaultShow: LiveWidgetId[] = [
  "news",
  "scores",
  "standings",
  "fixtures",
  "weather",
  "prayer",
  "fx",
  "gold",
  "borsa",
  "fuel",
];

function has(show: LiveWidgetId[], id: LiveWidgetId) {
  return show.includes(id);
}

function MarketRows({ items }: { items: MarketItem[] }) {
  return (
    <ul className={styles.marketList}>
      {items.map((item) => (
        <li key={item.label}>
          <span className={styles.mLabel}>{item.label}</span>
          <strong className={styles.mValue}>{item.value}</strong>
          <span className={item.up ? styles.up : styles.down}>{item.change}</span>
        </li>
      ))}
    </ul>
  );
}

/** Canlı içerik widget grubu — farklı sayfa bölgelerine yerleştirilebilir */
export async function LiveWidgets({
  liveNews = [],
  show = defaultShow,
  layout = "stack",
  idPrefix = "lw",
  hideDisclaimer = false,
  className,
  fuelPrices: fuelProp,
}: LiveWidgetsProps) {
  const fuelPrices =
    fuelProp ??
    (show.includes("fuel")
      ? (await getFuelPrices()).items
      : fuelPricesFallback);

  const root =
    layout === "stack"
      ? styles.stack
      : layout === "grid2"
        ? styles.grid2
        : layout === "grid3"
          ? styles.grid3
          : layout === "grid4"
            ? styles.grid4
            : styles.band;

  const pid = idPrefix;

  return (
    <div className={`${root}${className ? ` ${className}` : ""}`}>
      {has(show, "news") ? (
        <section className={styles.box} aria-labelledby={`${pid}-news`}>
          <header className={styles.head}>
            <h2 id={`${pid}-news`}>
              <span className={styles.liveDot} aria-hidden />
              Canlı Haber Akışı
            </h2>
            <Link href="/son-dakika" className={styles.more}>
              {Copy.seeAll}
            </Link>
          </header>
          <ul className={styles.newsList}>
            {liveNews.slice(0, layout === "band" ? 3 : 5).map((item) => (
              <li key={item.id}>
                <Link href={`/haber/${item.slug}`}>
                  <span className={styles.newsTitle}>{item.title}</span>
                  <time dateTime={item.publishedAt ?? undefined}>
                    {formatRelative(item.publishedAt)}
                  </time>
                </Link>
              </li>
            ))}
            {!liveNews.length ? (
              <li className={styles.empty}>Şu an canlı akış yok</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {has(show, "scores") ? (
        <section className={styles.box} aria-labelledby={`${pid}-scores`}>
          <header className={styles.head}>
            <h2 id={`${pid}-scores`}>Canlı Skor</h2>
            <span className={styles.badgeLive}>CANLI</span>
          </header>
          <ul className={styles.scoreList}>
            {liveScores.map((m) => (
              <li key={`${m.home}-${m.away}`}>
                <span className={styles.league}>{m.league}</span>
                <div className={styles.scoreRow}>
                  <span className={styles.team}>{m.home}</span>
                  <strong className={styles.score}>
                    {m.homeScore} - {m.awayScore}
                  </strong>
                  <span className={styles.teamRight}>{m.away}</span>
                </div>
                <span className={styles.minute}>{m.minute}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {has(show, "standings") ? (
        <section className={styles.box} aria-labelledby={`${pid}-standings`}>
          <header className={styles.head}>
            <h2 id={`${pid}-standings`}>Puan Durumu</h2>
            <span className={styles.sub}>SL</span>
          </header>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Takım</th>
                <th>O</th>
                <th>P</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.team}>
                  <td>{row.pos}</td>
                  <td>{row.team}</td>
                  <td>{row.played}</td>
                  <td>
                    <strong>{row.pts}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {has(show, "fixtures") ? (
        <section className={styles.box} aria-labelledby={`${pid}-fixtures`}>
          <header className={styles.head}>
            <h2 id={`${pid}-fixtures`}>Maç Programı</h2>
            <span className={styles.sub}>Bugün</span>
          </header>
          <ul className={styles.fixtureList}>
            {fixtures.map((f) => (
              <li key={`${f.home}-${f.time}`}>
                <time className={styles.fixTime}>{f.time}</time>
                <div>
                  <p className={styles.fxMatch}>
                    {f.home} <span>–</span> {f.away}
                  </p>
                  <span className={styles.league}>{f.league}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {has(show, "weather") ? (
        <section className={`${styles.box} ${styles.weather}`} aria-labelledby={`${pid}-weather`}>
          <header className={styles.head}>
            <h2 id={`${pid}-weather`}>Hava Durumu</h2>
            <span className={styles.sub}>{weather.city}</span>
          </header>
          <div className={styles.weatherMain}>
            <strong className={styles.temp}>{weather.temp}°</strong>
            <div>
              <p className={styles.wDesc}>{weather.desc}</p>
              <p className={styles.wMeta}>Hissedilen {weather.feels}°</p>
            </div>
          </div>
          <div className={styles.wGrid}>
            <span>Nem {weather.humidity}%</span>
            <span>Rüzgâr {weather.wind}</span>
          </div>
        </section>
      ) : null}

      {has(show, "prayer") ? (
        <section className={styles.box} aria-labelledby={`${pid}-prayer`}>
          <header className={styles.head}>
            <h2 id={`${pid}-prayer`}>Namaz Vakitleri</h2>
            <span className={styles.sub}>{prayerTimes.city}</span>
          </header>
          <ul className={styles.prayerList}>
            <li>
              <span>İmsak</span>
              <strong>{prayerTimes.imsak}</strong>
            </li>
            <li>
              <span>Güneş</span>
              <strong>{prayerTimes.gunes}</strong>
            </li>
            <li>
              <span>Öğle</span>
              <strong>{prayerTimes.ogle}</strong>
            </li>
            <li>
              <span>İkindi</span>
              <strong>{prayerTimes.ikindi}</strong>
            </li>
            <li>
              <span>Akşam</span>
              <strong>{prayerTimes.aksam}</strong>
            </li>
            <li>
              <span>Yatsı</span>
              <strong>{prayerTimes.yatsi}</strong>
            </li>
          </ul>
        </section>
      ) : null}

      {has(show, "fx") ? (
        <section className={styles.box} aria-labelledby={`${pid}-fx`}>
          <header className={styles.head}>
            <h2 id={`${pid}-fx`}>Döviz</h2>
            <span className={styles.sub}>Canlı*</span>
          </header>
          <MarketRows items={marketFx} />
        </section>
      ) : null}

      {has(show, "gold") ? (
        <section className={styles.box} aria-labelledby={`${pid}-gold`}>
          <header className={styles.head}>
            <h2 id={`${pid}-gold`}>Altın</h2>
            <span className={styles.sub}>Canlı*</span>
          </header>
          <MarketRows items={marketGold} />
        </section>
      ) : null}

      {has(show, "borsa") ? (
        <section className={styles.box} aria-labelledby={`${pid}-borsa`}>
          <header className={styles.head}>
            <h2 id={`${pid}-borsa`}>Borsa</h2>
            <span className={styles.sub}>BİST</span>
          </header>
          <MarketRows items={marketBorsa} />
        </section>
      ) : null}

      {has(show, "fuel") ? (
        <section className={styles.box} aria-labelledby={`${pid}-fuel`}>
          <header className={styles.head}>
            <h2 id={`${pid}-fuel`}>Akaryakıt</h2>
            <span className={styles.sub}>Türkiye ort.</span>
          </header>
          <ul className={styles.fuelList}>
            {fuelPrices.map((f) => (
              <li key={f.name}>
                <span>{f.name}</span>
                <strong>
                  {f.price} <small>{f.unit}</small>
                </strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!hideDisclaimer ? (
        <p className={styles.disclaimer}>* Gösterim amaçlı örnek veri</p>
      ) : null}
    </div>
  );
}
