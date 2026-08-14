"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  ApiArticle,
  MansetCardView,
  MansetLayoutId,
  MansetSettings,
} from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import styles from "./manset-stage.module.css";

export type MansetStageProps = {
  items?: MansetCardView[];
  featured?: ApiArticle[];
  layout?: MansetLayoutId;
  mainItems?: ApiArticle[];
  sideItems?: ApiArticle[];
  settings?: Partial<MansetSettings>;
};

function toCards(
  items: MansetCardView[] | undefined,
  main: ApiArticle[],
  side: ApiArticle[],
): MansetCardView[] {
  if (items?.length) return items;
  return [...main, ...side].map((article, i) => ({
    article,
    slot: i + 1,
    headlineTitle: article.headlineTitle?.trim() || article.title,
    kicker: article.category.name,
    spot: article.excerpt,
    badge: article.isBreaking
      ? {
          text: "Son dakika",
          color: "#EF233C",
          expiresAt: article.breakingUntil,
        }
      : null,
    showSpot: i === 0,
  }));
}

function articleToCard(article: ApiArticle, slot: number): MansetCardView {
  return {
    article,
    slot,
    headlineTitle: article.headlineTitle?.trim() || article.title,
    kicker: article.category.name,
    spot: article.excerpt,
    badge: article.isBreaking
      ? {
          text: "Son dakika",
          color: "#EF233C",
          expiresAt: article.breakingUntil,
        }
      : null,
    showSpot: false,
  };
}

function coverOf(card: MansetCardView, wide = true) {
  const a = card.article;
  if (wide) return a.coverImage169 || a.coverImage || a.coverImage11;
  return a.coverImage || a.coverImage169 || a.coverImage11;
}

/**
 * Editöryel manşet: büyük sürgü + sağda öne çıkan (manşet tekrarı yok)
 */
export function MansetStage({
  items,
  featured = [],
  mainItems = [],
  sideItems = [],
  settings,
}: MansetStageProps) {
  const limit = settings?.desktopLimit ?? settings?.mainLimit ?? 12;
  const slides = toCards(items, mainItems, sideItems).slice(0, limit);
  const slideIds = new Set(slides.map((c) => c.article.id));

  const featuredSide = featured
    .filter((a) => !slideIds.has(a.id))
    .slice(0, 4)
    .map((a, i) => articleToCard(a, 100 + i));

  if (!slides.length) {
    return (
      <div className={styles.empty}>
        Manşet için haber seçilmedi. Admin → Manşet’ten ekleyip Yayınla’ya
        basın.
      </div>
    );
  }

  return (
    <EditorialStage
      slides={slides}
      featured={featuredSide}
      settings={settings}
    />
  );
}

function EditorialStage({
  slides,
  featured,
  settings,
}: {
  slides: MansetCardView[];
  featured: MansetCardView[];
  settings?: Partial<MansetSettings>;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchX = useRef<number | null>(null);
  const emergency = Boolean(settings?.emergency);
  const autoplay =
    settings?.autoplay !== false && !emergency && slides.length > 1;
  const sec = (settings?.autoplaySec ?? 6) * 1000;
  const active = slides[index] ?? slides[0]!;
  const showAuthor = settings?.showAuthor !== false;
  const rel = formatRelative(active.article.publishedAt);
  const catColor =
    active.article.category.color?.trim() || "var(--yh-accent, #ef233c)";

  const go = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
      setProgress(0);
    },
    [slides.length],
  );

  const canHoverPreview = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);


  useEffect(() => {
    if (!autoplay || paused) return;
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / sec);
      setProgress(t);
      if (t >= 1) {
        go(index + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoplay, paused, index, sec, go]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!document.querySelector("[data-manset-vitrin]")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <section
      className={styles.stage}
      aria-label="Manşet"
      data-manset-vitrin
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.board}>
        <div
          className={styles.heroCol}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            if (start == null || slides.length < 2) return;
            const dx = (e.changedTouches[0]?.clientX ?? start) - start;
            if (Math.abs(dx) < 48) return;
            go(dx < 0 ? index + 1 : index - 1);
          }}
        >
          <div className={styles.heroFrame}>
            <Link
              href={`/haber/${active.article.slug}`}
              className={styles.hero}
              style={{ ["--manset-accent" as string]: catColor }}
            >
              <span className={styles.heroMedia} aria-hidden>
                {coverOf(active) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={active.article.id}
                    src={coverOf(active)!}
                    alt=""
                    width={1200}
                    height={750}
                  />
                ) : (
                  <span className={styles.ph} />
                )}
                <span className={styles.heroShade} />
              </span>

              <span className={styles.heroCopy}>
                <h2 className={styles.heroTitle}>{active.headlineTitle}</h2>
                <span className={styles.meta}>
                  {active.badge ? (
                    <span
                      className={styles.badge}
                      style={{ background: active.badge.color }}
                    >
                      {active.badge.text}
                    </span>
                  ) : null}
                  <span className={styles.kicker}>{active.kicker}</span>
                  <time dateTime={active.article.publishedAt ?? undefined}>
                    {rel || "Az önce"}
                  </time>
                  {showAuthor && active.article.author?.name ? (
                    <span className={styles.metaAuthor}>
                      {active.article.author.name}
                    </span>
                  ) : null}
                </span>
              </span>
              {autoplay ? (
                <span className={styles.progress} aria-hidden>
                  <i style={{ transform: `scaleX(${progress})` }} />
                </span>
              ) : null}
            </Link>

            {slides.length > 1 ? (
              <div
                className={styles.controls}
                data-count={slides.length > 8 ? "many" : "few"}
              >
                <button
                  type="button"
                  className={styles.navBtn}
                  aria-label="Önceki manşet"
                  onClick={() => go(index - 1)}
                >
                  ‹
                </button>
                <ol className={styles.dots} aria-label="Manşet slaytları">
                  {slides.map((c, i) => (
                    <li key={c.article.id}>
                      <button
                        type="button"
                        className={i === index ? styles.dotOn : styles.dot}
                        aria-label={`${i + 1}. manşet: ${c.headlineTitle}`}
                        aria-current={i === index ? "true" : undefined}
                        title={c.headlineTitle}
                        onMouseEnter={() => {
                          if (canHoverPreview()) go(i);
                        }}
                        onFocus={() => {
                          if (canHoverPreview()) go(i);
                        }}
                        onClick={() => go(i)}
                      >
                        <span className={styles.dotNum} aria-hidden>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {i === index ? (
                          <span
                            className={styles.dotPulse}
                            aria-hidden
                            style={{
                              animationDuration: `${settings?.autoplaySec ?? 6}s`,
                            }}
                          />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className={styles.navBtn}
                  aria-label="Sonraki manşet"
                  onClick={() => go(index + 1)}
                >
                  ›
                </button>
                <span className={styles.pos} aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                  <i>/</i>
                  {String(slides.length).padStart(2, "0")}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {featured.length ? (
          <aside className={styles.sideCol} aria-label="Öne çıkan">
            <p className={styles.sideLabel}>Öne çıkan</p>
            <ul className={styles.side}>
              {featured.map((c, i) => {
                const thumb = coverOf(c, false);
                return (
                  <li key={c.article.id}>
                    <Link
                      href={`/haber/${c.article.slug}`}
                      className={styles.sideItem}
                    >
                      <span className={styles.sideIndex} aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.sideBody}>
                        <em className={styles.sideKicker}>{c.kicker}</em>
                        <strong className={styles.sideTitle}>
                          {c.headlineTitle}
                        </strong>
                      </span>
                      <span className={styles.sideThumb} aria-hidden>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" width={120} height={80} />
                        ) : (
                          <span className={styles.ph} />
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
