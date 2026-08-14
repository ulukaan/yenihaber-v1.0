"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import {
  AnimatedIcon,
  FacebookGlyph,
  TelegramGlyph,
  WhatsappGlyph,
  XGlyph,
} from "@yenihaber/ui";
import styles from "./article-share.module.css";

export type ArticleShareProps = {
  url: string;
  title: string;
};

function absoluteUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Masaüstü: WA → X → Facebook → Telegram → Kopyala
 * Mobil: tek «Paylaş» (navigator.share)
 */
export function ArticleShare({ url, title }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const [native, setNative] = useState(false);
  const absolute = useMemo(() => absoluteUrl(url), [url]);

  useEffect(() => {
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    const canShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";
    setNative(Boolean(coarse && canShare));
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [absolute]);

  const shareNative = useCallback(async () => {
    try {
      await navigator.share({ title, url: absolute, text: title });
    } catch {
      /* iptal */
    }
  }, [absolute, title]);

  if (native) {
    return (
      <div className={styles.share} role="group" aria-label="Paylaş">
        <button
          type="button"
          className={`${styles.btn} ${styles.btnNative}`}
          onClick={() => void shareNative()}
          aria-label="Paylaş"
        >
          <Share2 size={16} strokeWidth={2} aria-hidden />
          Paylaş
        </button>
      </div>
    );
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${absolute}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(absolute)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absolute)}`;
  const tg = `https://t.me/share/url?url=${encodeURIComponent(absolute)}&text=${encodeURIComponent(title)}`;

  return (
    <div className={styles.share} role="group" aria-label="Paylaş">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.btn} ${styles.btnWa}`}
        aria-label="WhatsApp ile paylaş"
      >
        <AnimatedIcon motion="pop">
          <WhatsappGlyph size={16} />
        </AnimatedIcon>
        <span>WhatsApp</span>
      </a>
      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.btn}
        aria-label="X ile paylaş"
      >
        <AnimatedIcon motion="pop">
          <XGlyph size={16} />
        </AnimatedIcon>
        <span>X</span>
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.btn}
        aria-label="Facebook ile paylaş"
      >
        <AnimatedIcon motion="pop">
          <FacebookGlyph size={16} />
        </AnimatedIcon>
        <span>Facebook</span>
      </a>
      <a
        href={tg}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.btn}
        aria-label="Telegram ile paylaş"
      >
        <AnimatedIcon motion="pop">
          <TelegramGlyph size={16} />
        </AnimatedIcon>
        <span>Telegram</span>
      </a>
      <button
        type="button"
        className={styles.btn}
        onClick={() => void copy()}
        aria-label="Bağlantıyı kopyala"
      >
        {copied ? (
          <Check size={16} strokeWidth={2} aria-hidden />
        ) : (
          <Copy size={16} strokeWidth={2} aria-hidden />
        )}
        <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
      </button>
    </div>
  );
}
