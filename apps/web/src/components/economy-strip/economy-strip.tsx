import type { ApiMarketItem } from "@yenihaber/shared";
import { getFuelPrices } from "@/lib/fuel";
import { getMarkets } from "@/lib/markets";
import styles from "./economy-strip.module.css";

type Quote = {
  id: string;
  code: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
};

function changeClass(up: boolean, change: string): string {
  if (!change || change === "—") return styles.flat ?? "";
  return (up ? styles.up : styles.down) ?? "";
}

function pick(
  list: ApiMarketItem[],
  match: (c: string) => boolean,
): ApiMarketItem | undefined {
  return list.find((x) => match(x.code.toUpperCase()));
}

function toQuote(
  item: ApiMarketItem | undefined,
  id: string,
  code: string,
  label: string,
): Quote | null {
  if (!item) return null;
  return {
    id,
    code: item.code || code,
    label: item.label || label,
    value: item.value,
    change: item.change || "—",
    up: item.up,
  };
}

/**
 * Ekonomi şeridi — sade piyasa özeti + akaryakıt.
 */
export async function EconomyStrip() {
  const [markets, fuel] = await Promise.all([getMarkets(), getFuelPrices()]);

  const items = (
    [
      toQuote(pick(markets.fx, (c) => c.includes("USD")), "usd", "USD", "Dolar"),
      toQuote(
        pick(markets.fx, (c) => c.includes("EUR")) ?? markets.fx[1],
        "eur",
        "EUR",
        "Euro",
      ),
      toQuote(markets.gold[0], "xau", "XAU", "Gram altın"),
      toQuote(markets.crypto[0], "btc", "BTC", "Bitcoin"),
    ].filter(Boolean) as Quote[]
  );

  return (
    <section className={styles.wrap} aria-label="Piyasa özeti">
      <header className={styles.head}>
        <div className={styles.headLeft}>
          <span className={styles.bar} aria-hidden />
          <div>
            <h2 className={styles.title}>Piyasa</h2>
            <p className={styles.sub}>Döviz, altın ve kripto özeti</p>
          </div>
        </div>
        <span className={styles.live}>
          <i className={styles.liveDot} aria-hidden />
          Güncel
        </span>
      </header>

      <div className={styles.body}>
        <ul className={styles.markets}>
          {items.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.code}>{item.code}</span>
                <span className={changeClass(item.up, item.change)}>
                  {item.change && item.change !== "—" ? item.change : "—"}
                </span>
              </div>
              <span className={styles.label}>{item.label}</span>
              <strong className={styles.value}>{item.value}</strong>
            </li>
          ))}
        </ul>

        <aside className={styles.fuel} aria-label="Akaryakıt fiyatları">
          <div className={styles.fuelHead}>
            <span className={styles.fuelKicker}>Akaryakıt</span>
            <span className={styles.fuelPlace}>{fuel.place}</span>
          </div>
          <ul className={styles.fuelList}>
            {fuel.items.map((f) => (
              <li key={f.name}>
                <span>{f.name}</span>
                <b>
                  {f.price}
                  <small> {f.unit}</small>
                </b>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
