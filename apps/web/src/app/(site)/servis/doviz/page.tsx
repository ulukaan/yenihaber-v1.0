import type { Metadata } from "next";
import Link from "next/link";
import { getMarkets } from "@/lib/markets";
import { getFuelPrices } from "@/lib/fuel";
import { ServiceShell } from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Döviz ve Piyasa",
  description:
    "Dolar, euro, sterlin, altın, kripto ve yakıt özeti — Düzce Radikal piyasa paneli.",
};

const FAQS = [
  {
    q: "Kurlar yatırım tavsiyesi midir?",
    a: "Hayır. Gösterilen değerler bilgilendirme amaçlıdır; yatırım, döviz veya emtia kararı için profesyonel danışmanlık ve birincil piyasa kaynaklarını kullanın.",
  },
  {
    q: "Alış / satış farkı neden görünebilir?",
    a: "Bazı kaynaklar tek orta kur, bazıları alış-satış verir. Ekrandaki sütunlar kaynağın sağladığı alanlarla sınırlıdır.",
  },
  {
    q: "Yakıt fiyatları yerel mi?",
    a: "Ulusal pompa ortalaması yansıtılabilir; Düzce istasyon fiyatları markaya göre değişir.",
  },
];

function changeClass(up: boolean, change?: string | null): string {
  const c = change ?? "";
  if (!c || c === "—" || c === "0" || c === "0%") {
    return s.flat ?? "";
  }
  return (up ? s.up : s.down) ?? "";
}

/** Döviz, altın, kripto ve yakıt paneli */
export default async function MarketsServicePage() {
  const [markets, fuel] = await Promise.all([
    getMarkets(),
    getFuelPrices(),
  ]);

  const usd =
    markets.fx.find((x) => /USD|DOLAR/i.test(x.code + x.label)) ??
    markets.fx[0];
  const eur =
    markets.fx.find((x) => /EUR|EURO/i.test(x.code + x.label)) ??
    markets.fx[1];
  const gold = markets.gold[0];
  const btc = markets.crypto[0];

  const updated = markets.updatedAt
    ? new Date(markets.updatedAt).toLocaleString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <ServiceShell
      activeHref="/servis/doviz"
      title="Döviz & piyasa"
      lead="Döviz kurları, altın, kripto ve yakıt özeti. Anlık piyasa hissi için paneller; karar vermeden önce birincil kaynakları kontrol edin."
      meta={`Kaynak: ${markets.source} · Güncelleme: ${updated}`}
      aside={
        <>
          <div className={s.panel}>
            <h2>Öne çıkan</h2>
            {usd ? (
              <p>
                USD <strong>{usd.value}</strong>{" "}
                <span className={changeClass(usd.up, usd.change)}>
                  {usd.change || "—"}
                </span>
              </p>
            ) : null}
            {eur ? (
              <p>
                EUR <strong>{eur.value}</strong>{" "}
                <span className={changeClass(eur.up, eur.change)}>
                  {eur.change || "—"}
                </span>
              </p>
            ) : null}
            {gold ? (
              <p>
                Altın <strong>{gold.value}</strong>
              </p>
            ) : null}
            {btc ? (
              <p>
                BTC <strong>{btc.value}</strong>
              </p>
            ) : null}
          </div>
          <div className={s.panel}>
            <h2>Uyarı</h2>
            <p>
              Bu sayfa yatırım, vergi veya alım-satım tavsiyesi içermez.
              Banka / aracı kurum / borsa verilerini esas alın.
            </p>
          </div>
          <div className={s.panel}>
            <h2>Diğer</h2>
            <p>
              <Link href="/kategori/ekonomi">Ekonomi haberleri</Link>
            </p>
            <p>
              <Link href="/servis/hava">Hava durumu</Link>
            </p>
            <p>
              <Link href="/servis">Tüm servisler</Link>
            </p>
          </div>
        </>
      }
      disclaimer="Piyasa verileri gecikmeli veya yuvarlanmış olabilir. Yatırım tavsiyesi değildir."
    >
      <div className={s.heroStat}>
        <div>
          <p className={s.heroLabel}>{usd?.label ?? "USD"}</p>
          <p className={s.heroBig}>{usd?.value ?? "—"}</p>
        </div>
        <div>
          <p className={s.heroSub}>Gösterge kur paneli</p>
          <p className={s.heroMeta}>
            <span className={changeClass(Boolean(usd?.up), usd?.change ?? "")}>
              {usd?.change || "—"}
            </span>
            <span>{markets.source}</span>
            <span>{updated}</span>
          </p>
        </div>
      </div>

      <ul className={s.statGrid}>
        {[usd, eur, gold, btc].filter(Boolean).map((item) =>
          item ? (
            <li key={`${item.code}-${item.label}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </li>
          ) : null,
        )}
      </ul>

      <section className={s.section}>
        <h2>Döviz kurları</h2>
        {markets.fx.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Para birimi</th>
                  <th>Fiyat</th>
                  <th>Değişim</th>
                  <th>Alış</th>
                  <th>Satış</th>
                </tr>
              </thead>
              <tbody>
                {markets.fx.map((r) => (
                  <tr key={`fx-${r.code}-${r.label}`}>
                    <td>
                      <strong>{r.label}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>
                        {r.code}
                      </div>
                    </td>
                    <td>{r.value}</td>
                    <td className={changeClass(r.up, r.change)}>
                      {r.change || "—"}
                    </td>
                    <td>{r.buy ?? "—"}</td>
                    <td>{r.sell ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={s.empty}>Döviz satırı yok.</p>
        )}
      </section>

      <section className={s.section}>
        <h2>Altın ve kıymetli maden</h2>
        {markets.gold.length ? (
          <ul className={s.cardGrid}>
            {markets.gold.map((r) => (
              <li key={`au-${r.code}-${r.label}`} className={s.card}>
                <span>{r.label}</span>
                <strong style={{ fontSize: "1.1rem" }}>{r.value}</strong>
                <small className={changeClass(r.up, r.change)}>
                  {r.change || "—"}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty}>Altın verisi yok.</p>
        )}
      </section>

      <section className={s.section}>
        <h2>Kripto</h2>
        {markets.crypto.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Varlık</th>
                  <th>Fiyat</th>
                  <th>Değişim</th>
                </tr>
              </thead>
              <tbody>
                {markets.crypto.map((r) => (
                  <tr key={`cr-${r.code}-${r.label}`}>
                    <td>
                      <strong>{r.label}</strong>
                    </td>
                    <td>{r.value}</td>
                    <td className={changeClass(r.up, r.change)}>
                      {r.change || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={s.empty}>Kripto verisi yok.</p>
        )}
      </section>

      <section className={s.section}>
        <h2>Yakıt (pompa referansı)</h2>
        <p>
          {fuel.place} · Kaynak: {fuel.source}
          {fuel.updatedAt
            ? ` · ${new Date(fuel.updatedAt).toLocaleDateString("tr-TR")}`
            : ""}
        </p>
        <ul className={s.cardGrid}>
          {fuel.items.map((f) => (
            <li key={f.name} className={s.card}>
              <span>{f.name}</span>
              <strong style={{ fontSize: "1.15rem" }}>{f.price}</strong>
              <small>{f.unit}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.section}>
        <h2>Nasıl okunur?</h2>
        <ul className={s.tips}>
          <li>
            Yeşil / kırmızı değişim günlük veya anlık getiri hissini gösterir;
            yüzde formatı kaynağa göre değişir.
          </li>
          <li>
            Altın gram, çeyrek, ons gibi birimler karıştırılmamalıdır — satır
            etiketine bakın.
          </li>
          <li>
            Hafta sonu ve tatilde döviz piyasası sığ olabilir; hareketler yanıltıcı
            olabilir.
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
