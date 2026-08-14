"use client";

import { API_BASE } from "@/lib/public-env";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiArticle } from "@yenihaber/shared";
import { createApiClient } from "@yenihaber/api-client";
import { ArticleBody } from "./article-body";
import { ArticleNextGate } from "./article-next";
import {
  ArticleSidebar,
  type ArticleSidebarData,
} from "./article-sidebar";
import styles from "./article-stream.module.css";

const client = createApiClient({
  baseUrl: API_BASE,
});

export type ArticleStreamProps = {
  initial: ApiArticle;
  nextSlugs: string[];
  siteUrl?: string;
  related?: ApiArticle[];
  tipMailto?: string;
  sidebar: ArticleSidebarData;
  viewCountMinShow?: number;
};

const MAX_INLINE = 3;

/**
 * Her haber: içerik + yan panel birlikte kayar.
 * En fazla 3 haber; sonra «Daha fazla haber».
 */
export function ArticleStream({
  initial,
  nextSlugs,
  siteUrl = "",
  related = [],
  tipMailto,
  sidebar,
  viewCountMinShow = 500,
}: ArticleStreamProps) {
  const [items, setItems] = useState<ApiArticle[]>([initial]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSlug, setActiveSlug] = useState(initial.slug);

  const [capReached, setCapReached] = useState(false);

  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const queueRef = useRef([...nextSlugs]);
  const seenRef = useRef(new Set([initial.slug]));
  const lastSlugRef = useRef(initial.slug);
  const activeRef = useRef(initial.slug);
  const gateRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const itemsLenRef = useRef(1);

  const last = items[items.length - 1]!;
  itemsLenRef.current = items.length;

  const appendArticle = useCallback((article: ApiArticle) => {
    if (seenRef.current.has(article.slug)) return false;
    if (itemsLenRef.current >= MAX_INLINE) {
      setCapReached(true);
      return false;
    }
    seenRef.current.add(article.slug);
    lastSlugRef.current = article.slug;
    setItems((prev) => {
      if (prev.length >= MAX_INLINE) {
        setCapReached(true);
        return prev;
      }
      const next = [...prev, article];
      if (next.length >= MAX_INLINE) setCapReached(true);
      return next;
    });
    pendingRef.current = null;
    return true;
  }, []);

  const resolveNextSlug = useCallback(async (): Promise<string | null> => {
    const pending = pendingRef.current;
    if (pending && !seenRef.current.has(pending)) return pending;

    while (queueRef.current.length > 0) {
      const slug = queueRef.current.shift()!;
      if (!seenRef.current.has(slug)) return slug;
    }

    try {
      const n = await client.neighbors.get(lastSlugRef.current);
      const slug = n.next?.slug ?? null;
      if (slug && !seenRef.current.has(slug)) return slug;
    } catch {
      // ignore
    }
    return null;
  }, []);

  const loadNext = useCallback(async () => {
    if (loadingRef.current || doneRef.current) return;
    if (!userScrolledRef.current) return;
    if (itemsLenRef.current >= MAX_INLINE) {
      setCapReached(true);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    try {
      let guard = 0;
      while (guard < 5) {
        guard += 1;
        if (itemsLenRef.current >= MAX_INLINE) {
          setCapReached(true);
          break;
        }
        const slug = await resolveNextSlug();
        if (!slug) {
          doneRef.current = true;
          setDone(true);
          break;
        }
        try {
          const article = await client.articles.getBySlug(slug);
          if (appendArticle(article)) break;
          if (itemsLenRef.current >= MAX_INLINE) break;
        } catch {
          // sonrakini dene
        }
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [appendArticle, resolveNextSlug]);

  const tryLoadFromGate = useCallback(() => {
    if (window.scrollY > 100) userScrolledRef.current = true;
    if (
      !userScrolledRef.current ||
      loadingRef.current ||
      doneRef.current ||
      itemsLenRef.current >= MAX_INLINE
    ) {
      return;
    }
    const el = gateRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    if (r.top < vh * 0.9 && r.bottom > 0) {
      void loadNext();
    }
  }, [loadNext]);

  useEffect(() => {
    window.addEventListener("scroll", tryLoadFromGate, { passive: true });
    window.addEventListener("resize", tryLoadFromGate);
    return () => {
      window.removeEventListener("scroll", tryLoadFromGate);
      window.removeEventListener("resize", tryLoadFromGate);
    };
  }, [tryLoadFromGate, items.length]);

  useEffect(() => {
    const el = gateRef.current;
    if (!el || done || capReached) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.2) &&
          userScrolledRef.current
        ) {
          void loadNext();
        }
      },
      { root: null, rootMargin: "0px", threshold: [0, 0.2, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadNext, done, capReached, items.length, last.slug]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-article-slug]"),
    );
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top?.target) return;
        const slug = top.target.getAttribute("data-article-slug");
        const title = top.target.getAttribute("data-article-title");
        if (!slug || slug === activeRef.current) return;
        activeRef.current = slug;
        setActiveSlug(slug);
        if (title) document.title = `${title} | Düzce Radikal`;
        const path = `/haber/${slug}${window.location.search}`;
        window.history.pushState({ articleSlug: slug }, "", path);
        try {
          const w = window as Window & {
            dataLayer?: Record<string, unknown>[];
            gtag?: (...args: unknown[]) => void;
          };
          w.dataLayer?.push({
            event: "page_view",
            page_path: path,
            page_title: title || document.title,
          });
          w.gtag?.("event", "page_view", {
            page_path: path,
            page_title: title || document.title,
          });
        } catch {
          // ignore
        }
      },
      {
        root: null,
        threshold: [0.15, 0.3, 0.45],
        rootMargin: "-20% 0px -35% 0px",
      },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    function onScroll() {
      const root = rootRef.current;
      if (!root) return;
      const el = root.querySelector<HTMLElement>(
        `[data-article-slug="${activeSlug}"]`,
      );
      if (!el) {
        setProgress(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = Math.max(rect.height - vh * 0.35, 1);
      const scrolled = Math.min(Math.max(-rect.top + vh * 0.15, 0), total);
      setProgress(Math.round((scrolled / total) * 100));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeSlug, items]);

  return (
    <div className={styles.stream} ref={rootRef}>
      <div
        className={styles.progress}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Okuma ilerlemesi"
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      {items.map((article, index) => (
        <section key={article.id} className={styles.articleRow}>
          <div className={styles.mainCol}>
            <div className={styles.block}>
              <ArticleBody
                article={article}
                isPrimary={index === 0}
                siteUrl={siteUrl}
                index={index}
                related={index === 0 ? related : undefined}
                tipMailto={tipMailto}
                viewCountMinShow={viewCountMinShow}
                commentsCollapsed={index > 0}
              />

              {index === items.length - 1 && !done && !capReached ? (
                <div className={styles.gate}>
                  <ArticleNextGate
                    afterSlug={article.slug}
                    onRevealReady={(slug) => {
                      pendingRef.current = slug;
                    }}
                  />
                  <div
                    ref={gateRef}
                    className={styles.loadTrigger}
                    aria-hidden
                  />
                  {loading ? (
                    <p className={styles.loading} aria-live="polite">
                      Haber açılıyor…
                    </p>
                  ) : (
                    <p className={styles.hint}>
                      Aşağı kaydırın — sıradaki haber o zaman açılır
                    </p>
                  )}
                </div>
              ) : null}

              {index === items.length - 1 && capReached && !done ? (
                <div className={styles.moreWrap}>
                  <a
                    className={styles.moreBtn}
                    href={`/haber/${pendingRef.current || last.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      void (async () => {
                        const slug =
                          pendingRef.current ||
                          (await resolveNextSlug()) ||
                          null;
                        if (slug) window.location.href = `/haber/${slug}`;
                        else {
                          doneRef.current = true;
                          setDone(true);
                        }
                      })();
                    }}
                  >
                    Daha fazla haber
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.sideCol}>
            <ArticleSidebar
              data={sidebar}
              currentArticleId={article.id}
              categorySlug={article.category.slug}
              instanceId={article.id}
            />
          </div>
        </section>
      ))}

      {done ? (
        <p className={styles.end}>
          {items.length > 1
            ? "Akışın sonuna geldiniz"
            : "Şimdilik başka haber yok"}
        </p>
      ) : null}
    </div>
  );
}
