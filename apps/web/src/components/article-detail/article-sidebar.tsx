import Link from "next/link";
import type {
  ApiArticle,
  ApiCategory,
  ApiMarketItem,
  ApiPoll,
  ApiPrayer,
} from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import { Copy } from "@/lib/copy";
import { SitePollCard } from "@/components/poll-card/poll-card";
import styles from "./article-sidebar.module.css";

export type ArticleSidebarWeather = {
  city: string;
  temp: number;
  desc: string;
};

export type ArticleSidebarFuelItem = {
  name: string;
  price: string;
};

/** Sunucuda bir kez yüklenir; her haber satırında yeniden çizilir. */
export type ArticleSidebarData = {
  breaking: ApiArticle[];
  mostRead: ApiArticle[];
  categories: ApiCategory[];
  quotes: {
    usd?: ApiMarketItem;
    eur?: ApiMarketItem;
    gold?: ApiMarketItem;
  };
  weather: ArticleSidebarWeather;
  prayer: Pick<ApiPrayer, "city" | "next"> | null;
  fuel: ArticleSidebarFuelItem[];
  /** Genel aktif anket */
  generalPoll?: ApiPoll | null;
};

export type ArticleSidebarProps = {
  data: ArticleSidebarData;
  currentArticleId: string;
  categorySlug?: string;
  /** Çoklu instance için benzersiz başlık id’si */
  instanceId: string;
};

/**
 * Haber yan paneli — sticky değil; her makale bloğu ile birlikte akar.
 */
export function ArticleSidebar({
  data,
  currentArticleId,
  categorySlug,
  instanceId,
}: ArticleSidebarProps) {
  const uid = instanceId.slice(0, 12);
  const breaking = data.breaking
    .filter((a) => a.id !== currentArticleId)
    .slice(0, 5);
  const popular = data.mostRead
    .filter((a) => a.id !== currentArticleId)
    .slice(0, 5);
  const { usd, eur, gold } = data.quotes;
  const { weather, prayer, fuel, categories } = data;
  const generalPoll = data.generalPoll ?? null;

  const idLive = `rail-live-${uid}`;
  const idPop = `rail-pop-${uid}`;
  const idData = `rail-data-${uid}`;
  const idSvc = `rail-svc-${uid}`;
  const idBulten = `rail-bulten-${uid}`;

  return (
    <aside className={styles.rail} aria-label="Yan panel">
      <section className={styles.block} aria-labelledby={idLive}>
        <div className={styles.blockHead}>
          <h2 id={idLive}>
            <i className={styles.liveDot} aria-hidden />
            Son dakika
          </h2>
          <Link href="/son-dakika">{Copy.seeAll}</Link>
        </div>
        <ul className={styles.liveList}>
          {breaking.length ? (
            breaking.map((item) => (
              <li key={item.id}>
                <Link href={`/haber/${item.slug}`}>
                  <span className={styles.liveBar} aria-hidden />
                  <span className={styles.liveTitle}>{item.title}</span>
                  {item.publishedAt ? (
                    <time dateTime={item.publishedAt}>
                      {formatRelative(item.publishedAt)}
                    </time>
                  ) : null}
                </Link>
              </li>
            ))
          ) : (
            <li className={styles.muted}>Güncel son dakika yok.</li>
          )}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby={idPop}>
        <div className={styles.blockHead}>
          <h2 id={idPop}>Çok okunanlar</h2>
        </div>
        <ol className={styles.popList}>
          {popular.map((item, i) => (
            <li key={item.id}>
              <Link href={`/haber/${item.slug}`} className={styles.popItem}>
                <span className={styles.popRank} aria-hidden>
                  {i + 1}
                </span>
                {item.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverImage} alt="" className={styles.popImg} />
                ) : (
                  <span className={styles.popImgPh} aria-hidden />
                )}
                <span className={styles.popText}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.category.name}
                    {item.publishedAt
                      ? ` · ${formatRelative(item.publishedAt)}`
                      : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {generalPoll ? (
        <div className={styles.pollWrap}>
          <SitePollCard poll={generalPoll} variant="rail" />
        </div>
      ) : null}

      <section className={styles.block} aria-labelledby={idData}>
        <div className={styles.blockHead}>
          <h2 id={idData}>Güncel</h2>
          <Link href="/servis/doviz">Piyasa</Link>
        </div>

        <div className={styles.quoteGrid}>
          {usd ? (
            <div className={styles.quote}>
              <span>USD</span>
              <strong>{usd.value}</strong>
              <em className={usd.up ? styles.up : styles.down}>{usd.change}</em>
            </div>
          ) : null}
          {eur ? (
            <div className={styles.quote}>
              <span>EUR</span>
              <strong>{eur.value}</strong>
              <em className={eur.up ? styles.up : styles.down}>{eur.change}</em>
            </div>
          ) : null}
          {gold ? (
            <div className={styles.quote}>
              <span>ALTIN</span>
              <strong>{gold.value}</strong>
              <em className={gold.up ? styles.up : styles.down}>
                {gold.change}
              </em>
            </div>
          ) : null}
        </div>

        <div className={styles.infoRow}>
          <Link href="/servis/hava" className={styles.infoCard}>
            <span className={styles.infoLabel}>Hava · {weather.city}</span>
            <strong>
              {weather.temp}° <small>{weather.desc}</small>
            </strong>
          </Link>
          <Link href="/servis/namaz" className={styles.infoCard}>
            <span className={styles.infoLabel}>
              Namaz · {prayer?.city.name ?? "Düzce"}
            </span>
            <strong>
              {prayer ? prayer.next.time : "—"}
              <small>{prayer ? prayer.next.label : "Vakit"}</small>
            </strong>
          </Link>
        </div>

        {fuel.length ? (
          <ul className={styles.fuelRow} aria-label="Akaryakıt">
            {fuel.slice(0, 3).map((f) => (
              <li key={f.name}>
                <span>{f.name}</span>
                <b>
                  {f.price}
                  <small> ₺</small>
                </b>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.block} aria-labelledby={idSvc}>
        <div className={styles.blockHead}>
          <h2 id={idSvc}>Servisler</h2>
        </div>
        <div className={styles.svcGrid}>
          <Link href="/servis/nobetci-eczane">Eczane</Link>
          <Link href="/servis/namaz">Namaz</Link>
          <Link href="/servis/hava">Hava</Link>
          <Link href="/servis/doviz">Döviz</Link>
        </div>
        {categories.length ? (
          <div className={styles.cats} aria-label="Kategoriler">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/kategori/${c.slug}`}
                className={
                  c.slug === categorySlug ? styles.catOn : styles.cat
                }
              >
                {c.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.bulten} aria-labelledby={idBulten}>
        <h2 id={idBulten}>Günaydın manşetleri</h2>
        <p>Her sabah kutunuzda, spam yok.</p>
        <Link href="/#bulten" className={styles.bultenBtn}>
          E-bültene abone ol
        </Link>
      </section>
    </aside>
  );
}
