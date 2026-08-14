import type { Metadata } from "next";
import Link from "next/link";
import {
  PAID_LISTING_KIND_LABELS,
  type ApiPaidListing,
} from "@yenihaber/shared";
import { getVefatNotices } from "@/lib/vefat";
import { publicApi } from "@/lib/server-api";
import { ServiceShell } from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";
import v from "@/styles/vefat.module.css";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Vefat İlanları — Düzce",
  description:
    "Düzce’de bugün vefat edenler ve cenaze duyuruları. Kaynak: Düzce Belediyesi MEBİS; ücretli ilanlar Düzce Radikal.",
};

const TIPS = [
  "Liste belediye MEBİS kaydına göredir; resmi işlemler için mezarlıklar müdürlüğünü arayın.",
  "Cenaze saati ve camii duyuruda yazar; değişiklik olabilir — aile / imam teyidi alın.",
  "Yol tarifi ve kabir konumu için MEBİS sayfasındaki harita bağlantılarını kullanın.",
  "Ücretli taziye / vefat ilanı için /ilanlar sayfasından veya WhatsApp’tan başvurun.",
];

/** Vefat ilanları — MEBİS + ücretli blok */
export default async function VefatServicePage() {
  const [data, paid, taziye] = await Promise.all([
    getVefatNotices(),
    publicApi.listings
      .list({ kind: "vefat" })
      .then((r) => r.data)
      .catch(() => [] as ApiPaidListing[]),
    publicApi.listings
      .list({ kind: "taziye" })
      .then((r) => r.data)
      .catch(() => [] as ApiPaidListing[]),
  ]);
  const paidBlock = [...paid, ...taziye];
  const total = data.items.length;

  return (
    <ServiceShell
      activeHref="/servis/vefat"
      title="Vefat ilanları"
      lead="Düzce Belediyesi MEBİS kaydına göre güncel vefat ve cenaze duyuruları. Resmî işlem ve doğrulama için birincil kaynak MEBİS’tir."
      meta={`${data.dateLabel} · ${total} kayıt`}
      aside={
        <>
          <div className={s.panel}>
            <h2>Özet</h2>
            <p>
              <strong>{total}</strong> duyuru
            </p>
            <p>{data.dateLabel}</p>
            <p>
              Kaynak:{" "}
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {data.sourceLabel}
              </a>
            </p>
          </div>
          <div className={s.panel}>
            <h2>Ücretli ilan</h2>
            <p>Taziye, teşekkür ve çerçeveli vefat ilanı yayınlatın.</p>
            <p>
              <Link href="/ilanlar">İlan ver →</Link>
            </p>
          </div>
          <div className={s.panel}>
            <h2>İletişim</h2>
            <p>Mezarlıklar Müdürlüğü</p>
            <p>
              <a href="tel:+903805239224">0 380 523 92 24</a>
            </p>
            <p>
              <a href="mailto:Mebis@Duzce.Bel.Tr">Mebis@Duzce.Bel.Tr</a>
            </p>
          </div>
          <div className={s.panel}>
            <h2>Notlar</h2>
            <ul>
              {TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </>
      }
      disclaimer="Veriler Düzce Belediyesi MEBİS’ten alınır; bilgilendirme amaçlıdır. Cenaze saati, yer ve defin işlemleri için resmi kurum / aile bilgisini doğrulayın."
    >
      {paidBlock.length > 0 ? (
        <section className={v.paid} aria-label="Ücretli ilanlar">
          <h2 className={v.paidTitle}>Ücretli ilanlar</h2>
          <ul className={v.list}>
            {paidBlock.map((row) => (
              <li key={row.id}>
                <article className={v.card} data-paid="1">
                  <p className={v.paidKind}>
                    {PAID_LISTING_KIND_LABELS[row.kind]}
                  </p>
                  <h3 className={v.name}>
                    <Link href={`/ilanlar/${row.slug}`}>{row.title}</Link>
                  </h3>
                  {row.personName ? (
                    <p className={v.meta}>
                      <span>
                        <strong>{row.personName}</strong>
                      </span>
                    </p>
                  ) : null}
                  {row.body ? (
                    <p className={v.announcement}>
                      {row.body.length > 180
                        ? `${row.body.slice(0, 180).trim()}…`
                        : row.body}
                    </p>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={v.summary}>
        <div className={v.stat}>
          <strong>{total}</strong>
          <span>Bugünkü kayıt</span>
        </div>
        <div className={v.stat}>
          <strong>MEBİS</strong>
          <span>Resmî kaynak</span>
        </div>
        <div className={v.stat}>
          <strong>~30 dk</strong>
          <span>Önbellek süresi</span>
        </div>
      </div>

      {data.error ? <p className={v.error}>{data.error}</p> : null}

      {total === 0 && !data.error ? (
        <p className={v.empty}>
          Bu tarih için listelenmiş vefat kaydı yok.{" "}
          <Link href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
            MEBİS’te kontrol edin
          </Link>
          .
        </p>
      ) : null}

      {total > 0 ? (
        <ul className={v.list}>
          {data.items.map((item) => (
            <li key={`${item.fullName}-${item.burialDate}-${item.address}`}>
              <article className={v.card}>
                <h2 className={v.name}>{item.fullName}</h2>
                <p className={v.meta}>
                  {item.fatherName ? (
                    <span>
                      Baba: <strong>{item.fatherName}</strong>
                    </span>
                  ) : null}
                  {item.motherName ? (
                    <span>
                      Anne: <strong>{item.motherName}</strong>
                    </span>
                  ) : null}
                  {item.deathDate ? (
                    <span>
                      Ölüm: <strong>{item.deathDate}</strong>
                    </span>
                  ) : null}
                  {item.burialDate ? (
                    <span>
                      Defin: <strong>{item.burialDate}</strong>
                    </span>
                  ) : null}
                </p>
                {item.announcement ? (
                  <p className={v.announcement}>{item.announcement}</p>
                ) : null}
                {item.address ? (
                  <p className={v.address}>{item.address}</p>
                ) : null}
                {item.cemetery ? (
                  <span className={v.cemetery}>{item.cemetery}</span>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      <p className={v.source}>
        Kaynak:{" "}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
          {data.sourceLabel} — Vefat Edenler
        </a>
        . Güncelleme:{" "}
        {new Date(data.fetchedAt).toLocaleString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
        .{" "}
        <Link href="/ilanlar">Ücretli ilan ver</Link>
      </p>
    </ServiceShell>
  );
}
