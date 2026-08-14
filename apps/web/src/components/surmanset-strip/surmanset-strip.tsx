"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { ApiArticle } from "@yenihaber/shared";
import { categoryThemeColor } from "@/lib/category-theme";
import styles from "./surmanset-strip.module.css";

export type SurmansetStripProps = {
  items: ApiArticle[];
  title?: string;
};

const ASPECT_W = 1286;
const ASPECT_H = 330;
const AUTOPLAY_MS = 7000;
const FALLBACK_PANEL = "#c4122f";

function coverOf(article: ApiArticle) {
  return (
    article.coverImage169 ||
    article.coverImage ||
    article.coverImage43 ||
    article.coverImage11
  );
}

function headlineOf(article: ApiArticle) {
  return article.headlineTitle?.trim() || article.title;
}

function panelColorOf(article: ApiArticle): string {
  const c = categoryThemeColor(article.category.color);
  return c.startsWith("#") ? c : FALLBACK_PANEL;
}

/**
 * Anasayfa sürmanşet — kategori renkli diyagonal panel + numaralı hover sürgü
 */
export function SurmansetStrip({
  items,
  title = "Sürmanşet",
}: SurmansetStripProps) {
  const list = items.filter(Boolean).slice(0, 15);
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);
  const tickRef = useRef(0);

  const count = list.length;
  const active = list[index];

  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
      tickRef.current = 0;
    },
    [count],
  );

  const canHoverPreview = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);


  useEffect(() => {
    if (count <= 1) return;

    const id = setInterval(() => {
      if (pausedRef.current) return;
      tickRef.current += 100;
      if (tickRef.current >= AUTOPLAY_MS) {
        setIndex((i) => (i + 1) % count);
        tickRef.current = 0;
      }
    }, 100);

    return () => clearInterval(id);
  }, [count]);

  if (!active) return null;

  const cover = coverOf(active);
  const headline = headlineOf(active);
  const panelColor = panelColorOf(active);

  return (
    <section
      className={styles.wrap}
      aria-labelledby="surmanset-title"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
        tickRef.current = 0;
      }}
    >
      <h2 id="surmanset-title" className={styles.srOnly}>
        {title}
      </h2>

      <div
        className={styles.frame}
        style={
          {
            ["--sm-aspect-w" as string]: ASPECT_W,
            ["--sm-aspect-h" as string]: ASPECT_H,
            ["--sm-panel" as string]: panelColor,
          } as CSSProperties
        }
      >
        <Link
          href={`/haber/${active.slug}`}
          className={styles.media}
          aria-label={headline}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={active.id}
              src={cover}
              alt=""
              width={ASPECT_W}
              height={ASPECT_H}
              decoding="async"
            />
          ) : (
            <span className={styles.ph} aria-hidden />
          )}
        </Link>

        <div className={styles.panel}>
          <span className={styles.panelPattern} aria-hidden />
          <Link href={`/haber/${active.slug}`} className={styles.headline}>
            {headline}
          </Link>

          {count > 1 ? (
            <ol className={styles.tabs} aria-label="Sürmanşet sırası">
              {list.map((item, i) => {
                const on = i === index;
                return (
                  <li key={item.id} className={styles.tabItem}>
                    <button
                      type="button"
                      className={on ? styles.tabOn : styles.tab}
                      onMouseEnter={() => {
                        if (canHoverPreview()) go(i);
                      }}
                      onFocus={() => {
                        if (canHoverPreview()) go(i);
                      }}
                      onClick={() => go(i)}
                      aria-label={`${i + 1}. sürmanşet: ${headlineOf(item)}`}
                      aria-current={on ? "true" : undefined}
                    >
                      {i + 1}
                    </button>
                    {on ? <span className={styles.caret} aria-hidden /> : null}
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </div>
    </section>
  );
}
