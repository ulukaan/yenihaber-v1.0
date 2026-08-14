import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { NewsCard } from "@/components/news-card/news-card";
import { EconomyStrip } from "@/components/economy-strip/economy-strip";
import {
  SitePollCard,
} from "@/components/poll-card/poll-card";
import styles from "./sidebar-widgets.module.css";

export type SidebarWidgetsProps = {
  breaking: ApiArticle[];
  popular: ApiArticle[];
  context?: "default" | "sport" | "economy" | "breaking";
};

/**
 * Sağ sütun — haber odaklı.
 * Servis panelleri yalnızca bağlama göre (spor/ekonomi).
 */
export function SidebarWidgets({
  breaking,
  popular,
  context = "default",
}: SidebarWidgetsProps) {
  return (
    <div className={styles.stack}>
      <section className={styles.widget} aria-labelledby="side-breaking">
        <h2 id="side-breaking">
          <span className={styles.pulse} aria-hidden />
          Son Dakika
        </h2>
        <ul className={styles.breakingList}>
          {breaking.slice(0, 6).map((item) => (
            <li key={item.id}>
              <Link href={`/haber/${item.slug}`}>{item.title}</Link>
            </li>
          ))}
          {!breaking.length ? <li>Şu an acil akış yok</li> : null}
        </ul>
        <Link href="/son-dakika" className={styles.cta}>
          Tüm son dakika
        </Link>
      </section>

      <section className={styles.widget} aria-labelledby="side-popular">
        <h2 id="side-popular">Çok Okunanlar</h2>
        <div className={styles.popular}>
          {popular.slice(0, 5).map((item, i) => (
            <NewsCard
              key={item.id}
              article={item}
              variant="text"
              rank={i + 1}
            />
          ))}
        </div>
      </section>

      <SitePollCard variant="rail" />

      {context === "economy" ? <EconomyStrip /> : null}
      {/* Spor paneli kategori/anasayfada ana blokta; sidebar’da tekrar yok */}


      <section className={styles.newsletter} aria-labelledby="side-news">
        <h2 id="side-news">Günün bülteni</h2>
        <p>Öne çıkan haberleri her sabah e-postanıza gönderelim.</p>
        <form className={styles.form} action="/ara" method="get">
          <label className="yh-sr-only" htmlFor="newsletter-email">
            E-posta
          </label>
          <input
            id="newsletter-email"
            name="q"
            type="email"
            placeholder="ornek@eposta.com"
            required
          />
          <button type="submit">Abone ol</button>
        </form>
      </section>
    </div>
  );
}
