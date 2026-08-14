"use client";

import { useEffect, useRef } from "react";
import { createApiClient } from "@yenihaber/api-client";

const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
});

const SESSION_MS = 30 * 60 * 1000;

function viewKey(articleId: string) {
  return `yh-view:${articleId}`;
}

/** Oturumda 30 dk içinde tekrar sayma — bot sunucuda filtrelenir */
export function ArticleViewBeacon({ articleId }: { articleId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !articleId) return;
    try {
      const raw = sessionStorage.getItem(viewKey(articleId));
      const ts = raw ? Number(raw) : 0;
      if (ts && Date.now() - ts < SESSION_MS) return;
      sessionStorage.setItem(viewKey(articleId), String(Date.now()));
    } catch {
      /* private mode */
    }
    sent.current = true;
    void client.articles.trackView(articleId).catch(() => {});
  }, [articleId]);

  return null;
}
