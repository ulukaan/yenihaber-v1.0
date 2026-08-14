"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HeaderSearch } from "./header-search";
import styles from "./header-utils.module.css";

/** Header sağ araçlar: ara, canlı (YouTube), tema, üyelik */
export type HeaderUtilsProps = {
  /** Admin ayarları: liveYouTubeUrl — boşsa Canlı TV gizlenir */
  liveYouTubeUrl?: string;
};

export function HeaderUtils({ liveYouTubeUrl = "" }: HeaderUtilsProps) {
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const liveUrl = liveYouTubeUrl.trim();

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const stored = localStorage.getItem("yh-theme");
    const next = stored === "dark";
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("yh-theme", next ? "dark" : "light");
  }

  return (
    <>
      <HeaderSearch open={searchOpen} onClose={closeSearch} />
      <div className={styles.utils}>
        <button
          type="button"
          className={styles.item}
          aria-label="Ara"
          aria-expanded={searchOpen}
          aria-haspopup="dialog"
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon />
          <span>Ara</span>
        </button>
        {liveUrl ? (
          <a
            href={liveUrl}
            className={styles.item}
            aria-label="Canlı TV"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LiveIcon />
            <span>Canlı TV</span>
          </a>
        ) : null}
        <button
          type="button"
          className={styles.item}
          onClick={toggleTheme}
          aria-label={dark ? "Açık tema" : "Koyu tema"}
        >
          <ThemeIcon />
          <span>Tema</span>
        </button>
        <Link href="/giris" className={styles.item} aria-label="Üyelik">
          <UserIcon />
        </Link>
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function LiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M17 10l4-2v8l-4-2v-4z" fill="currentColor" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a9 9 0 1 0 9 9c0-.5-.04-1-.12-1.48A7 7 0 0 1 12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c1.5-3.5 4.2-5 8-5s6.5 1.5 8 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
