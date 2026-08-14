"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ApiElectionBundle, ApiElectionRace } from "@yenihaber/shared";
import {
  ElectionCenterHelp,
  ElectionRaceCard,
} from "./election-center-card";
import styles from "./election-center.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const REFRESH_SEC = 30;

function fmtPct(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtNum(n: number) {
  return n.toLocaleString("tr-TR");
}

function raceTypeLabel(t: string) {
  if (t === "baskanlik") return "Başkanlık";
  if (t === "meclis") return "Meclis";
  if (t === "il_genel") return "İl genel";
  if (t === "cumhurbaskanligi") return "Cumhurbaşkanlığı";
  if (t === "milletvekili") return "Milletvekili";
  if (t === "muhtarlik") return "Muhtarlık";
  return t;
}

type TabKey = "all" | ApiElectionRace["type"];

type Props = {
  initial: ApiElectionBundle;
  siteName?: string;
  brandLabel?: string;
  brandLogoUrl?: string | null;
};

/**
 * Seçim Merkezi — sıkı, 2 sütun, tek hiyerarşi
 */
export function ElectionCenter({
  initial,
  siteName = "",
  brandLabel = "",
  brandLogoUrl,
}: Props) {
  const [bundle, setBundle] = useState(initial);
  const [tab, setTab] = useState<TabKey>("all");
  const [secLeft, setSecLeft] = useState(REFRESH_SEC);
  const [nav, setNav] = useState<"screen" | "help">("screen");

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API}/elections/live`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ApiElectionBundle;
      if (data?.election) setBundle(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setBundle(initial);
  }, [initial]);

  useEffect(() => {
    setSecLeft(REFRESH_SEC);
    const tick = window.setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          void reload();
          return REFRESH_SEC;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [reload]);

  const races = useMemo(
    () => (bundle.races ?? []).filter(Boolean),
    [bundle.races],
  );

  const tabs = useMemo(() => [...new Set(races.map((r) => r.type))], [races]);

  const visible = useMemo(() => {
    if (tab === "all") return races;
    return races.filter((r) => r.type === tab);
  }, [races, tab]);

  const stats = useMemo(() => {
    const featured = races.find((r) => r.isFeatured) ?? races[0] ?? null;
    if (!featured) {
      return { ballotOpen: 0, ballotTotal: 0, ballotPct: 0, votes: 0 };
    }
    return {
      ballotOpen: featured.region.ballotOpen,
      ballotTotal: featured.region.ballotTotal,
      ballotPct: featured.region.ballotPct,
      votes: featured.totalVotes,
    };
  }, [races]);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/secim`;
  const enc = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(`${bundle.election.name} — Seçim Merkezi`);

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLogo} aria-label="Ana sayfa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandLogoUrl || "/brand/logo-on-dark.png"}
              alt={siteName.trim() || "Düzce Radikal"}
              width={112}
              height={40}
            />
          </Link>
          {siteName.trim() || brandLabel.trim() ? (
            <div>
              {siteName.trim() ? <strong>{siteName.trim()}</strong> : null}
              {brandLabel.trim() ? <em>{brandLabel.trim()}</em> : null}
            </div>
          ) : null}
        </div>

        <nav className={styles.topNav} aria-label="Seçim menü">
          <button
            type="button"
            className={nav === "screen" ? styles.topNavOn : styles.topNavBtn}
            onClick={() => setNav("screen")}
          >
            Sonuçlar
          </button>
          <Link href="/ara?q=se%C3%A7im" className={styles.topNavBtn}>
            Haberler
          </Link>
          <button
            type="button"
            className={nav === "help" ? styles.topNavOn : styles.topNavBtn}
            onClick={() => setNav("help")}
          >
            Yardım
          </button>
        </nav>

        <div className={styles.topRight}>
          <div className={styles.countdown} aria-live="polite">
            <span>Yenileme</span>
            <strong>
              {String(secLeft).padStart(2, "0")}
              <small>sn</small>
            </strong>
          </div>
          <div className={styles.share} aria-label="Paylaş">
            <a
              className={styles.shareFb}
              href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Fb />
            </a>
            <a
              className={styles.shareX}
              href={`https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
            >
              <X />
            </a>
            <a
              className={styles.shareWa}
              href={`https://wa.me/?text=${encodeURIComponent(`${bundle.election.name} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <Wa />
            </a>
            <button
              type="button"
              className={styles.shareIg}
              aria-label="Instagram için linki kopyala"
              title="Linki kopyala"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
            >
              <Ig />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.statsBar} aria-label="Sandık özeti">
        <div className={styles.statCell}>
          <span>Açılan sandık</span>
          <strong>{fmtNum(stats.ballotOpen)}</strong>
        </div>
        <div className={styles.statCell}>
          <span>Açılma oranı</span>
          <strong>%{fmtPct(stats.ballotPct)}</strong>
        </div>
        <div className={styles.statCell}>
          <span>Geçerli oy</span>
          <strong>{fmtNum(stats.votes)}</strong>
        </div>
        <div className={styles.statCell}>
          <span>Toplam sandık</span>
          <strong>{fmtNum(stats.ballotTotal)}</strong>
        </div>
      </div>

      <main className={styles.main}>
        {nav === "help" ? (
          <ElectionCenterHelp
            refreshSec={REFRESH_SEC}
            onBack={() => setNav("screen")}
          />
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.mainHead}>
                <h1>{bundle.election.name}</h1>
                <span
                  className={styles.liveBadge}
                  data-live={bundle.election.status === "live" ? "1" : "0"}
                >
                  {bundle.election.status === "live"
                    ? "Canlı"
                    : bundle.election.status === "closed"
                      ? "Bitti"
                      : "Taslak"}
                </span>
              </div>

              <div className={styles.tabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "all"}
                  className={tab === "all" ? styles.tabOn : styles.tab}
                  onClick={() => setTab("all")}
                >
                  Tümü
                </button>
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={tab === t ? styles.tabOn : styles.tab}
                    onClick={() => setTab(t)}
                  >
                    {raceTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={styles.cards}
              data-count={visible.length === 1 ? "1" : "many"}
            >
              {visible.map((race) => (
                <ElectionRaceCard key={race.id} race={race} />
              ))}
              {!visible.length ? (
                <p className={styles.empty}>Bu sekmede yarış yok.</p>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Fb() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function X() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.727-8.851L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function Wa() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Ig() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
