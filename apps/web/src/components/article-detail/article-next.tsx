"use client";

import { API_BASE } from "@/lib/public-env";

import { useEffect, useState } from "react";
import type { ApiArticleNeighbor } from "@yenihaber/shared";
import { createApiClient } from "@yenihaber/api-client";
import styles from "./article-next.module.css";

const client = createApiClient({
  baseUrl: API_BASE,
});

export type ArticleNextGateProps = {
  /** Bulunulan haberin slug’u — bunun “sonraki”si kutuda */
  afterSlug: string;
  /** Kapı açıldığında (kullanıcı kutunun altına kaydırdı) */
  onRevealReady?: (nextSlug: string) => void;
};

/**
 * Alt kutu: sadece başlık + küçük kapak.
 * Tam haber YÜKLENMEZ; kullanıcı bu kutunun altına kaydırınca stream yükler.
 * Link ile “direk geçiş” yok.
 */
export function ArticleNextGate({ afterSlug, onRevealReady }: ArticleNextGateProps) {
  const [next, setNext] = useState<ApiArticleNeighbor | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setNext(undefined);
    void client.neighbors
      .get(afterSlug)
      .then((res) => {
        if (cancelled) return;
        setNext(res.next);
        if (res.next?.slug) onRevealReady?.(res.next.slug);
      })
      .catch(() => {
        if (!cancelled) setNext(null);
      });
    return () => {
      cancelled = true;
    };
  }, [afterSlug, onRevealReady]);

  if (next === undefined) {
    return (
      <div className={styles.wrap} aria-hidden>
        <div className={styles.skeleton} />
      </div>
    );
  }
  if (!next) return null;

  return (
    <aside className={styles.wrap} aria-label="Sonraki haber önizlemesi">
      <p className={styles.kicker}>Sonraki haber</p>
      <div className={styles.card}>
        {next.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={next.coverImage} alt="" className={styles.img} />
        ) : (
          <span className={styles.imgFallback} aria-hidden />
        )}
        <span className={styles.body}>
          <span className={styles.cat}>{next.categoryName}</span>
          <strong>{next.title}</strong>
          <span className={styles.hint}>
            Devam etmek için aşağı kaydırın
          </span>
        </span>
      </div>
    </aside>
  );
}
