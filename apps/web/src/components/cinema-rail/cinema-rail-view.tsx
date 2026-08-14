"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import type { ApiCinemaFilm } from "@yenihaber/shared";
import styles from "./cinema-rail.module.css";

export type CinemaRailViewProps = {
  films: ApiCinemaFilm[];
  moreHref?: string;
  moreLabel?: string;
  title?: string;
};

/**
 * Vizyondaki filmler — yatay poster sürgüsü (referans: koyu şerit)
 */
export function CinemaRailView({
  films,
  moreHref = "/servis/vizyon",
  moreLabel = "Diğer filmler →",
  title = "Vizyondaki filmler",
}: CinemaRailViewProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.72, 560);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  if (!films.length) return null;

  return (
    <section className={styles.wrap} aria-labelledby="cinema-rail-title">
      <div className={styles.head}>
        <h2 id="cinema-rail-title" className={styles.title}>
          {title}
        </h2>
        {moreHref.startsWith("http") ? (
          <a
            href={moreHref}
            className={styles.more}
            target="_blank"
            rel="noopener noreferrer"
          >
            {moreLabel}
          </a>
        ) : (
          <Link href={moreHref} className={styles.more} prefetch={false}>
            {moreLabel}
          </Link>
        )}
      </div>

      <div className={styles.track}>
        <button
          type="button"
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={() => scrollBy(-1)}
          aria-label="Önceki filmler"
        >
          ‹
        </button>

        <ul ref={scrollerRef} className={styles.list}>
          {films.map((film) => (
            <li key={film.id} className={styles.item}>
              <a
                href={film.url}
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
                title={film.title}
              >
                <span className={styles.poster}>
                  {film.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={film.poster}
                      alt=""
                      width={310}
                      height={420}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className={styles.ph} aria-hidden />
                  )}
                </span>
                <span className={styles.name}>{film.title}</span>
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`${styles.nav} ${styles.navNext}`}
          onClick={() => scrollBy(1)}
          aria-label="Sonraki filmler"
        >
          ›
        </button>
      </div>
    </section>
  );
}
