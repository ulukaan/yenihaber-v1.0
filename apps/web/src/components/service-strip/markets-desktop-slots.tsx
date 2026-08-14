"use client";

import { useEffect, useMemo, useState } from "react";
import { Bitcoin, Coins, DollarSign } from "lucide-react";
import type { ApiMarketItem } from "@yenihaber/shared";
import styles from "./service-strip.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const iconProps = {
  size: 15,
  strokeWidth: 2,
  absoluteStrokeWidth: false,
  "aria-hidden": true as const,
};

function isUsable(item: ApiMarketItem): boolean {
  const v = (item.value ?? "").trim();
  return Boolean(v) && v !== "—" && v !== "-";
}

function resolveList(
  live: ApiMarketItem[],
  initial: ApiMarketItem[],
  fallback: ApiMarketItem,
): ApiMarketItem[] {
  const withValue = live.filter(isUsable);
  if (withValue.length) return withValue;
  if (live.length) return live;
  if (initial.length) return initial;
  return [fallback];
}

function shortLabel(item: ApiMarketItem, len: number): string {
  return (
    item.label.replace(/\/.*$/, "").trim().slice(0, len).toLocaleUpperCase("tr-TR") ||
    item.code.slice(0, 4).toUpperCase()
  );
}

const FX_FALLBACK: ApiMarketItem = {
  code: "USD",
  label: "Dolar",
  value: "—",
  change: "—",
  up: true,
};
const GOLD_FALLBACK: ApiMarketItem = {
  code: "GA",
  label: "Gram",
  value: "—",
  change: "—",
  up: true,
};
const CRYPTO_FALLBACK: ApiMarketItem = {
  code: "BTC",
  label: "Bitcoin",
  value: "—",
  change: "—",
  up: true,
};

export type MarketsDesktopSlotsProps = {
  fx: ApiMarketItem[];
  gold: ApiMarketItem[];
  crypto: ApiMarketItem[];
  /** ms — varsayılan 5000 */
  intervalMs?: number;
};

/**
 * Döviz · Altın · Kripto — aynı anda döner, hafif fade.
 */
export function MarketsDesktopSlots({
  fx,
  gold,
  crypto,
  intervalMs = 5000,
}: MarketsDesktopSlotsProps) {
  const [fxLive, setFxLive] = useState(fx);
  const [goldLive, setGoldLive] = useState(gold);
  const [cryptoLive, setCryptoLive] = useState(crypto);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setFxLive(fx);
    setGoldLive(gold);
    setCryptoLive(crypto);
  }, [fx, gold, crypto]);

  useEffect(() => {
    let cancelled = false;
    async function pullAll(forceRefresh: boolean) {
      try {
        const q = forceRefresh ? "?refresh=1" : "";
        const endpoints = ["fx", "gold", "crypto"] as const;
        const results = await Promise.all(
          endpoints.map(async (endpoint) => {
            const res = await fetch(`${API}/markets/${endpoint}${q}`, {
              cache: "no-store",
            });
            if (!res.ok) return [] as ApiMarketItem[];
            const json = (await res.json()) as { items?: ApiMarketItem[] };
            return (json.items ?? []).filter(isUsable);
          }),
        );
        if (cancelled) return;
        if (results[0]?.length) setFxLive(results[0]);
        if (results[1]?.length) setGoldLive(results[1]);
        if (results[2]?.length) setCryptoLive(results[2]);
      } catch {
        // props kalsın
      }
    }
    void pullAll(true);
    const id = window.setInterval(() => void pullAll(false), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const fxList = useMemo(
    () => resolveList(fxLive, fx, FX_FALLBACK),
    [fxLive, fx],
  );
  const goldList = useMemo(
    () => resolveList(goldLive, gold, GOLD_FALLBACK),
    [goldLive, gold],
  );
  const cryptoList = useMemo(
    () => resolveList(cryptoLive, crypto, CRYPTO_FALLBACK),
    [cryptoLive, crypto],
  );

  const needsRotate =
    fxList.length > 1 || goldList.length > 1 || cryptoList.length > 1;

  useEffect(() => {
    if (!needsRotate) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [needsRotate, intervalMs]);

  const slots = [
    {
      key: "fx",
      icon: DollarSign,
      list: fxList,
      labelLen: 6,
    },
    {
      key: "gold",
      icon: Coins,
      list: goldList,
      labelLen: 8,
    },
    {
      key: "crypto",
      icon: Bitcoin,
      list: cryptoList,
      labelLen: 8,
    },
  ] as const;

  return (
    <>
      {slots.map(({ key, icon: Icon, list, labelLen }) => {
        const item = list[tick % list.length]!;
        return (
          <div
            key={`${key}-${tick}`}
            className={`${styles.item} ${styles.desktopOnly} ${styles.slotSwap}`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={styles.mark} aria-hidden>
              <Icon {...iconProps} />
            </span>
            <div className={styles.copy}>
              <span className={styles.label}>
                {shortLabel(item, labelLen)}
              </span>
              <strong className={styles.value}>{item.value}</strong>
            </div>
            <Change up={item.up} value={item.change} />
          </div>
        );
      })}
    </>
  );
}

function Change({ up, value }: { up?: boolean; value?: string }) {
  if (!value || value === "—" || value === "-") return null;
  return (
    <span
      className={up ? styles.changeUp : styles.changeDown}
      aria-label={up ? "yükseliş" : "düşüş"}
    >
      {up ? "▲" : "▼"} {value}
    </span>
  );
}
