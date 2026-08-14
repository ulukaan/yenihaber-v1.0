"use client";

import { ExternalLink } from "lucide-react";
import styles from "./elections.module.css";

function fmt(n: number) {
  return n.toLocaleString("tr-TR");
}

function fmtPct(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

type Props = {
  electionName: string;
  electionStatus: string;
  featuredName: string | null;
  featuredStar: boolean;
  stats: {
    open: number;
    total: number;
    pct: number;
    votes: number;
  };
  siteUrl: string;
};

/** /secim üst bar + istatistik şeridi önizlemesi */
export function ElectionPreviewChrome({
  electionName,
  electionStatus,
  featuredName,
  featuredStar,
  stats,
  siteUrl,
}: Props) {
  return (
    <div className={styles.previewChrome} aria-label="Seçim Merkezi önizleme">
      <div className={styles.previewTop}>
        <div className={styles.previewBrand}>
          <span className={styles.previewMark}>DR</span>
          <div>
            <strong>{electionName}</strong>
            <em>Seçim Merkezi</em>
          </div>
        </div>
        <div className={styles.previewActions}>
          {electionStatus === "live" ? (
            <span className={styles.livePill}>CANLI</span>
          ) : (
            <span className={styles.draftPill}>
              {electionStatus === "closed" ? "BİTTİ" : "TASLAK"}
            </span>
          )}
          <a
            className={styles.openSite}
            href={`${siteUrl}/secim`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} aria-hidden />
            Siteyi aç
          </a>
        </div>
      </div>
      <div className={styles.previewStats}>
        <p>
          Açılan sandık:{" "}
          <strong>
            {fmt(stats.open)} / %{fmtPct(stats.pct)}
          </strong>
        </p>
        <p>
          Kullanılan oy: <strong>{fmt(stats.votes)}</strong>
        </p>
        <p>
          Geçerli oy: <strong>{fmt(stats.votes)}</strong>
        </p>
        <p>
          Sandık oranı: <strong>%{fmtPct(stats.pct)}</strong>
        </p>
        <p>
          Toplam sandık: <strong>{fmt(stats.total)}</strong>
        </p>
      </div>
      <p className={styles.previewHint}>
        Üst bar: <strong>{featuredName ?? "—"}</strong>
        {featuredStar ? " ★" : ""}
      </p>
    </div>
  );
}

export const RACE_TYPE_LABEL: Record<string, string> = {
  baskanlik: "Belediye başkanlığı",
  meclis: "Belediye meclisi",
  il_genel: "İl genel meclisi",
  cumhurbaskanligi: "Cumhurbaşkanlığı",
  milletvekili: "Milletvekili",
  muhtarlik: "Muhtarlık",
};

export function formatVotes(n: number) {
  return n.toLocaleString("tr-TR");
}

export function formatPct(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
