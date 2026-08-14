"use client";

import { API_BASE } from "@/lib/public-env";

import { useEffect, useState } from "react";
import {
  AD_SLOTS,
  type AdPublic,
  type AdSlotCode,
} from "@yenihaber/shared";
import { AdRenderer } from "./ad-renderer";
import styles from "./ad-slot.module.css";

const API = (
  API_BASE
).replace(/\/$/, "");

type Props = {
  code: AdSlotCode;
  className?: string;
};

/** Client: sonsuz kaydırma / hydrations içinde */
export function AdSlotClient({ code, className }: Props) {
  const [ad, setAd] = useState<AdPublic | null>(null);
  const slot = AD_SLOTS[code];

  useEffect(() => {
    let cancelled = false;
    void fetch(`${API}/ads/slot/${encodeURIComponent(code)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ad?: AdPublic | null } | null) => {
        if (!cancelled && data?.ad) setAd(data.ad);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!slot || !ad) return null;

  const deviceClass =
    slot.device === "desktop"
      ? styles.desktopOnly
      : slot.device === "mobile"
        ? styles.mobileOnly
        : "";

  return (
    <div
      data-ad-slot={code}
      className={[styles.wrap, deviceClass, className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Reklam"
    >
      <AdRenderer ad={ad} slotCode={code} />
    </div>
  );
}
