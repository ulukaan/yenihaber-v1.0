import type { Metadata } from "next";
import Link from "next/link";
import { getCinema } from "@/lib/cinema";
import { CinemaRailView } from "@/components/cinema-rail/cinema-rail-view";
import { ServiceShell } from "@/components/service-page/service-shell";
import s from "@/components/service-page/service-shell.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Vizyondaki Filmler",
  description:
    "Türkiye vizyonundaki filmler — poster, vizyon tarihi ve Beyazperde bağlantıları.",
};

/** Vizyon servis sayfası — tam liste + şerit */
export default async function CinemaServicePage() {
  const data = await getCinema();
  const updated = new Date(data.updatedAt).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ServiceShell
      activeHref="/servis/vizyon"
      title="Vizyondaki filmler"
      lead="Sinemalarda gösterimde olan filmler — poster ve kısa bilgi. Detay için Beyazperde sayfasına gidersiniz."
      meta={`Kaynak: Beyazperde · Güncelleme: ${updated}${data.error ? ` · ${data.error}` : ""}`}
      aside={
        <div className={s.panel}>
          <h2>Kaynak</h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#555" }}>
            Liste{" "}
            <a
              href={data.listUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Beyazperde vizyon
            </a>{" "}
            sayfasından alınır; bilgilendirme amaçlıdır.
          </p>
        </div>
      }
    >
      {data.films.length ? (
        <>
          <CinemaRailView
            films={data.films}
            moreHref={data.listUrl}
            moreLabel="Beyazperde →"
            title="Şu an vizyonda"
          />

          <section className={s.section}>
            <h2>Tüm liste</h2>
            <ul className={s.compareGrid}>
              {data.films.map((film) => (
                <li key={film.id} className={s.compare}>
                  <h3>
                    <a
                      href={film.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {film.title}
                    </a>
                  </h3>
                  {film.date || film.duration ? (
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#555" }}>
                      {[film.date, film.duration].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {film.description ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        color: "#444",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {film.description}
                    </p>
                  ) : null}
                  <a
                    href={film.url}
                    className={s.cta}
                    style={{ justifySelf: "start", marginTop: 4 }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Detay
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className={s.empty}>
          Vizyon listesi şu an yüklenemedi.{" "}
          <Link href="/servis">Servislere dön</Link>
        </p>
      )}
    </ServiceShell>
  );
}
