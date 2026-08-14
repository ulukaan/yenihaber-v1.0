import { getMarkets, toStripItems } from "@/lib/markets";
import styles from "./market-strip.module.css";

/** Üst piyasa şeridi — canlidoviz döviz / altın / kripto */
export async function MarketStrip() {
  const markets = await getMarkets();
  const items = toStripItems(markets);

  return (
    <section className={styles.wrap} aria-label="Piyasa verileri">
      <div className={`yh-container ${styles.inner}`}>
        <span className={styles.label}>PİYASALAR</span>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={`${item.code}-${item.label}`}>
              <span className={styles.name}>{item.label}</span>
              <strong>{item.value}</strong>
              {item.change && item.change !== "—" ? (
                <span className={item.up ? styles.up : styles.down}>
                  {item.change}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
