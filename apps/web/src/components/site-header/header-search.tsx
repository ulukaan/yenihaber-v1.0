"use client";

import { API_BASE } from "@/lib/public-env";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createApiClient } from "@yenihaber/api-client";
import type { ApiArticle, ApiAuthor } from "@yenihaber/shared";
import styles from "./header-search.module.css";

const client = createApiClient({
  baseUrl: API_BASE,
});

/** Açılış/kapanış animasyon süresi (CSS ile senkron) */
const ANIM_MS = 280;

export type HeaderSearchProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Header üstünden inen arama paneli — haber + yazar.
 * Açılış: yukarıdan kayma + fade · Kapanış: ters animasyon.
 */
export function HeaderSearch({ open, onClose }: HeaderSearchProps) {
  const inputId = useId();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [authors, setAuthors] = useState<ApiAuthor[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMounted(true);
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setEntered(true);
        return;
      }
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    if (!mounted) return;
    setEntered(false);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(
      () => {
        setMounted(false);
        setQuery("");
        setArticles([]);
        setAuthors([]);
        setError("");
        setLoading(false);
      },
      reduced ? 0 : ANIM_MS,
    );
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !entered) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, entered, onClose]);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      setArticles([]);
      setAuthors([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [artRes, authorRes] = await Promise.all([
        client.articles.list({ q, page: 1, limit: 8 }),
        client.authors.list({ q, limit: 8 }),
      ]);
      setArticles(artRes.data);
      setAuthors(authorRes);
    } catch (e) {
      setArticles([]);
      setAuthors([]);
      setError(e instanceof Error ? e.message : "Arama yapılamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !entered) return;
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query, open, entered, runSearch]);

  if (!mounted) return null;

  const q = query.trim();
  const hasResults = articles.length > 0 || authors.length > 0;
  const showEmpty = q.length >= 2 && !loading && !error && !hasResults;
  const interactive = entered && open;

  return (
    <div
      className={`${styles.root} ${entered ? styles.rootOpen : ""}`}
      role="presentation"
      aria-hidden={!interactive}
    >
      <button
        type="button"
        className={`${styles.backdrop} ${entered ? styles.backdropOpen : ""}`}
        aria-label="Aramayı kapat"
        onClick={interactive ? onClose : undefined}
        tabIndex={interactive ? 0 : -1}
      />
      <div
        className={`${styles.panel} ${entered ? styles.panelOpen : ""}`}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Site araması"
      >
        <div className={`yh-container ${styles.inner}`}>
          <form
            className={styles.form}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.length < 2) return;
              window.location.href = `/ara?q=${encodeURIComponent(q)}`;
            }}
          >
            <label htmlFor={inputId} className={styles.srOnly}>
              Haber ve yazar ara
            </label>
            <span className={styles.icon} aria-hidden>
              <SearchGlyph />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              name="q"
              className={styles.input}
              placeholder="Haber veya yazar ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
              aria-controls={panelId}
              disabled={!interactive}
            />
            {loading ? (
              <span className={styles.status} aria-live="polite">
                Aranıyor…
              </span>
            ) : null}
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Kapat"
              disabled={!interactive}
            >
              ✕
            </button>
          </form>
          <p className={styles.hint}>
            En az 2 karakter · Enter ile tüm sonuçlar
          </p>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          {showEmpty ? (
            <p className={styles.empty}>“{q}” için sonuç yok.</p>
          ) : null}

          {authors.length > 0 ? (
            <section className={styles.section} aria-label="Yazarlar">
              <h2>Yazarlar</h2>
              <ul className={styles.list}>
                {authors.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/yazar/${a.slug}`}
                      className={styles.authorRow}
                      onClick={onClose}
                    >
                      <span className={styles.avatar} aria-hidden>
                        {(a.name || "?").slice(0, 1).toLocaleUpperCase("tr-TR")}
                      </span>
                      <span className={styles.meta}>
                        <strong>{a.name}</strong>
                        <span>
                          {a.title || (a.isColumnist ? "Köşe yazarı" : "Yazar")}
                          {typeof a.articleCount === "number"
                            ? ` · ${a.articleCount} yazı`
                            : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {articles.length > 0 ? (
            <section className={styles.section} aria-label="Haberler">
              <h2>Haberler</h2>
              <ul className={styles.list}>
                {articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/haber/${article.slug}`}
                      className={styles.articleRow}
                      onClick={onClose}
                    >
                      <strong>{article.title}</strong>
                      <span>
                        {article.category?.name}
                        {article.author?.name
                          ? ` · ${article.author.name}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {q.length >= 2 ? (
                <Link
                  href={`/ara?q=${encodeURIComponent(q)}`}
                  className={styles.more}
                  onClick={onClose}
                >
                  Tüm sonuçları gör →
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
