"use client";

import { useEffect, useState } from "react";
import type { ApiMarketItem } from "@yenihaber/shared";
import styles from "./service-strip.module.css";

export type FxRotatorProps = {
  items: ApiMarketItem[];
  /** ms — varsayılan 5000 */
  intervalMs?: number;
};

/**
 * İki döviz slotu — varsayılan 5 sn’de bir sıradaki çifte geçer.
 */
export function FxRotator({ items, intervalMs = 5000 }: FxRotatorProps) {
  const list = items.length
    ? items
    : [
        {
          code: "USD",
          label: "USD",
          value: "—",
          change: "—",
          up: true,
        } satisfies ApiMarketItem,
      ];

  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (list.length <= 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 2) % list.length);
      setTick((t) => t + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [list.length, intervalMs]);

  const a = list[index % list.length]!;
  const b = list[(index + 1) % list.length]!;
  const pair = a.code === b.code ? [a] : [a, b];

  return (
    <div
      className={styles.fxRotator}
      aria-live="polite"
      aria-atomic="true"
      key={tick}
    >
      {pair.map((item) => {
        const short =
          item.label.replace(/\/.*$/, "").trim().slice(0, 4).toUpperCase() ||
          item.code.slice(0, 3).toUpperCase();
        return (
          <div key={`${item.code}-${item.label}`} className={styles.fxSlot}>
            <span className={styles.label}>{short}</span>
            <strong className={styles.value}>{item.value}</strong>
          </div>
        );
      })}
    </div>
  );
}
