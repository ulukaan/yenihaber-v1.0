"use client";

import { useEffect, useState } from "react";
import type { AdPublic } from "@yenihaber/shared";
import { AdRenderer } from "./ad-renderer";
import styles from "./ad-slot.module.css";

/**
 * Mobil yapışkan alt bar — kapatma zorunlu (Google müdahaleci reklam kuralları).
 */
export function StickyBottomAd({ ad }: { ad: AdPublic }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("sticky-ad-closed") === "1") return;
    const timer = window.setTimeout(() => setVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.sticky}>
      <button
        type="button"
        className={styles.stickyClose}
        onClick={() => {
          setVisible(false);
          sessionStorage.setItem("sticky-ad-closed", "1");
        }}
        aria-label="Reklamı kapat"
      >
        ×
      </button>
      <AdRenderer ad={ad} slotCode="sticky-bottom" />
    </div>
  );
}
