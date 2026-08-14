"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { AdPublic } from "@yenihaber/shared";
import { AdRenderer } from "./ad-renderer";
import styles from "./masthead-ad.module.css";

type Props = {
  ad: AdPublic;
  className?: string;
};

/**
 * Masthead reklam — açılışta görünür.
 * Bir kez kilitlenince bu sayfada gizlenir; rota değişince veya
 * sekme kapanıp tekrar açılınca kilit düşer.
 */
export function MastheadAdReveal({ ad, className }: Props) {
  const pathname = usePathname() || "/";
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [pathname]);

  if (locked) return null;

  return (
    <div
      data-ad-slot="masthead"
      className={[styles.wrap, styles.open, className].filter(Boolean).join(" ")}
    >
      <div id="masthead-ad-panel" className={styles.panel}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.lockBtn}
            onClick={() => setLocked(true)}
            aria-label="Reklamı bu sayfada gizle"
            title="Bu sayfada gizle"
          >
            <X size={14} strokeWidth={2.4} aria-hidden />
            <span>Kapat</span>
          </button>
        </div>
        <AdRenderer ad={ad} slotCode="masthead" />
      </div>
    </div>
  );
}
