"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_REACTION_CONFIG,
  type ReactionConfigItem,
  type ReactionType,
} from "@yenihaber/shared";
import { createApiClient } from "@yenihaber/api-client";
import styles from "./article-reactions.module.css";

const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
});

function storageKey(articleId: string) {
  return `yh-rx:${articleId}`;
}

export type ArticleReactionsProps = {
  articleId: string;
};

/**
 * Tepki — giriş yok; localStorage + sunucu IP+UA hash.
 * Aynı tık → geri al; başka tık → değiştir.
 */
export function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const [counts, setCounts] = useState<Partial<Record<ReactionType, number>>>(
    {},
  );
  const [items, setItems] = useState<ReactionConfigItem[]>(
    DEFAULT_REACTION_CONFIG.items,
  );
  const [minShow, setMinShow] = useState(DEFAULT_REACTION_CONFIG.minShow);
  const [mine, setMine] = useState<ReactionType | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem(storageKey(articleId)) as ReactionType | null;
    if (saved) setMine(saved);

    void client.reactions
      .get(articleId)
      .then((res) => {
        if (cancelled) return;
        setCounts(res.counts);
        if (res.minShow != null) setMinShow(res.minShow);
        if (res.items?.length) setItems(res.items.filter((i) => i.enabled));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const vote = useCallback(
    async (type: ReactionType) => {
      if (busy) return;
      setBusy(true);

      const prevCounts = { ...counts };
      const prevMine = mine;

      // iyimser
      setCounts((c) => {
        const next = { ...c };
        if (prevMine === type) {
          next[type] = Math.max(0, (next[type] ?? 1) - 1);
        } else {
          if (prevMine) {
            next[prevMine] = Math.max(0, (next[prevMine] ?? 1) - 1);
          }
          next[type] = (next[type] ?? 0) + 1;
        }
        return next;
      });
      const nextMine = prevMine === type ? null : type;
      setMine(nextMine);
      if (nextMine) localStorage.setItem(storageKey(articleId), nextMine);
      else localStorage.removeItem(storageKey(articleId));

      try {
        const res = await client.reactions.post(articleId, type);
        setCounts(res.counts);
        const m = res.mine ?? (res.action === "remove" ? null : res.type);
        setMine(m ?? null);
        if (m) localStorage.setItem(storageKey(articleId), m);
        else localStorage.removeItem(storageKey(articleId));
        if (res.minShow != null) setMinShow(res.minShow);
        if (res.items?.length) setItems(res.items.filter((i) => i.enabled));
      } catch {
        setCounts(prevCounts);
        setMine(prevMine);
        if (prevMine) localStorage.setItem(storageKey(articleId), prevMine);
        else localStorage.removeItem(storageKey(articleId));
      } finally {
        setBusy(false);
      }
    },
    [articleId, busy, counts, mine],
  );

  const visible = items.filter((i) => i.enabled).slice(0, 5);
  if (!visible.length) return null;

  return (
    <section className={styles.wrap} aria-label="Okur tepkileri">
      <p className={styles.label}>Bu haber size nasıl hissettirdi?</p>
      <div className={styles.row} role="group">
        {visible.map((item) => {
          const n = counts[item.id] ?? 0;
          const show = n >= minShow;
          const selected = mine === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.btn} ${selected ? styles.selected : ""}`}
              onClick={() => void vote(item.id)}
              disabled={busy}
              aria-pressed={selected}
              aria-label={
                show ? `${item.label}, ${n} kişi` : item.label
              }
            >
              <span className={styles.emoji} aria-hidden>
                {item.emoji}
              </span>
              <span className={styles.name}>{item.label}</span>
              {show ? <span className={styles.count}>{n}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
