"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import adStyles from "@/components/ads/ad-slot.module.css";
import styles from "../../app/(site)/site-layout.module.css";

/** Seçim Merkezi — tam sayfa, site chrome + reklam yok */
export function useElectionFullscreen(): boolean {
  const path = usePathname() || "";
  return path === "/secim" || path.startsWith("/secim/");
}

/** @deprecated alias */
export const useElectionNoAds = useElectionFullscreen;

/** Header / servis / son dakika / footer / reklam — /secim’de yok */
export function SiteAdsGate({ children }: { children: ReactNode }) {
  if (useElectionFullscreen()) return null;
  return <>{children}</>;
}

export const SiteChromeGate = SiteAdsGate;

/** Ana içerik: /secim’de ray yok, kenardan kenara */
export function SiteMainShell({
  children,
  leftRail,
  rightRail,
}: {
  children: ReactNode;
  leftRail: ReactNode;
  rightRail: ReactNode;
}) {
  const full = useElectionFullscreen();

  if (full) {
    return (
      <main id="icerik" className={`${styles.main} ${styles.secimMain}`}>
        {children}
      </main>
    );
  }

  return (
    <div className={adStyles.railsLayout}>
      <aside
        className={`${adStyles.railHide} ${adStyles.railSticky}`}
        aria-label="Sol reklam"
      >
        {leftRail}
      </aside>
      <main id="icerik" className={styles.main}>
        {children}
      </main>
      <aside
        className={`${adStyles.railHide} ${adStyles.railSticky}`}
        aria-label="Sağ reklam"
      >
        {rightRail}
      </aside>
    </div>
  );
}

/** Ana sayfa seçim şeridi — /secim’de gereksiz */
export function SiteElectionStripGate({ children }: { children: ReactNode }) {
  if (useElectionFullscreen()) return null;
  return <>{children}</>;
}
