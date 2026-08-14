"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ApiStory, VideoProvider } from "@yenihaber/shared";
import { videoEmbedUrl } from "@yenihaber/shared";
import { Copy } from "@/lib/copy";
import styles from "./stories-strip.module.css";

const SEEN_KEY = "yh-stories-seen-v1";
const IMAGE_MS = 5500;

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-80)));
  } catch {
    /* ignore */
  }
}

export type StoriesStripProps = {
  items: ApiStory[];
};

/** Instagram / WhatsApp tarzı hikaye şeridi + fullscreen viewer */
export function StoriesStrip({ items }: StoriesStripProps) {
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSeen(loadSeen());
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
    setProgress(0);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSeen(next);
      return next;
    });
  }, []);

  const go = useCallback(
    (next: number) => {
      if (!items.length) return;
      if (next < 0 || next >= items.length) {
        close();
        return;
      }
      setOpenIndex(next);
      setProgress(0);
      markSeen(items[next]!.id);
    },
    [close, items, markSeen],
  );

  const openAt = useCallback(
    (index: number) => {
      setOpenIndex(index);
      setProgress(0);
      markSeen(items[index]!.id);
    },
    [items, markSeen],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const story = items[openIndex];
    if (!story) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const isEmbed = Boolean(
      story.videoId &&
        (story.videoProvider === "youtube" ||
          story.videoProvider === "vimeo" ||
          story.videoProvider === "bunny"),
    );
    const isFileVideo =
      story.kind === "short" &&
      !story.videoId &&
      /\.(mp4|webm|mov)(\?|$)/i.test(story.mediaUrl);

    if (isEmbed) {
      // Embed: sabit süre ilerlet
      const start = performance.now();
      const dur = 15000;
      timerRef.current = window.setInterval(() => {
        const p = Math.min(1, (performance.now() - start) / dur);
        setProgress(p);
        if (p >= 1) go(openIndex + 1);
      }, 50);
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
    }

    if (isFileVideo) {
      const el = videoRef.current;
      if (!el) return;
      const onTime = () => {
        if (!el.duration || !Number.isFinite(el.duration)) return;
        setProgress(el.currentTime / el.duration);
      };
      const onEnd = () => go(openIndex + 1);
      el.addEventListener("timeupdate", onTime);
      el.addEventListener("ended", onEnd);
      void el.play().catch(() => undefined);
      return () => {
        el.removeEventListener("timeupdate", onTime);
        el.removeEventListener("ended", onEnd);
      };
    }

    // durum / görsel
    const start = performance.now();
    timerRef.current = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / IMAGE_MS);
      setProgress(p);
      if (p >= 1) go(openIndex + 1);
    }, 40);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [go, items, openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(openIndex + 1);
      if (e.key === "ArrowLeft") go(openIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close, go, openIndex]);

  if (!items.length) return null;

  const active = openIndex !== null ? items[openIndex] : null;

  function onViewerKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") close();
  }

  return (
    <>
      <section className={styles.strip} aria-label="Hikayeler">
        <ul className={styles.track}>
          {items.map((s, i) => {
            const thumb = s.posterUrl || s.mediaUrl;
            const isSeen = seen.has(s.id);
            return (
              <li key={s.id} className={styles.item}>
                <button
                  type="button"
                  className={isSeen ? styles.ringSeen : styles.ring}
                  onClick={() => openAt(i)}
                  aria-label={`${s.title} hikayesini aç`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" className={styles.avatar} />
                  {s.kind === "short" ? (
                    <span className={styles.badge} aria-hidden>
                      Short
                    </span>
                  ) : null}
                </button>
                <span className={styles.label}>{s.title}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {active && openIndex !== null ? (
        <div
          className={styles.viewer}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          tabIndex={-1}
          onKeyDown={onViewerKey}
        >
          <div className={styles.bars} aria-hidden>
            {items.map((s, i) => (
              <div key={s.id} className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width:
                      i < openIndex
                        ? "100%"
                        : i === openIndex
                          ? `${Math.round(progress * 100)}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <header className={styles.viewerHead}>
            <span className={styles.viewerTitle}>{active.title}</span>
            <button
              type="button"
              className={styles.close}
              aria-label="Kapat"
              onClick={close}
            >
              ×
            </button>
          </header>

          <div className={styles.stage}>
            <button
              type="button"
              className={styles.hitLeft}
              aria-label="Önceki"
              onClick={() => go(openIndex - 1)}
            />
            <button
              type="button"
              className={styles.hitRight}
              aria-label="Sonraki"
              onClick={() => go(openIndex + 1)}
            />

            {active.videoId &&
            (active.videoProvider === "youtube" ||
              active.videoProvider === "vimeo" ||
              active.videoProvider === "bunny") ? (
              <iframe
                className={styles.frame}
                title={active.title}
                src={videoEmbedUrl(
                  active.videoProvider as VideoProvider,
                  active.videoId,
                  { autoplay: true },
                )}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : active.kind === "short" &&
              !active.videoId &&
              /\.(mp4|webm|mov)(\?|$)/i.test(active.mediaUrl) ? (
              <video
                ref={videoRef}
                className={styles.media}
                src={active.mediaUrl}
                playsInline
                muted
                controls={false}
                poster={active.posterUrl ?? undefined}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.media}
                src={active.mediaUrl}
                alt={active.title}
              />
            )}
          </div>

          {active.linkUrl ? (
            <a
              className={styles.cta}
              href={active.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {Copy.continueStory}
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
