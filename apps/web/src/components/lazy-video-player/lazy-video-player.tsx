"use client";

import { useState } from "react";
import type { VideoOrientation, VideoProvider } from "@yenihaber/shared";
import {
  formatVideoDurationLabel,
  videoEmbedUrl,
} from "@yenihaber/shared";
import styles from "./lazy-video-player.module.css";

type Props = {
  provider: VideoProvider;
  videoId: string;
  title: string;
  poster?: string | null;
  duration?: number | null;
  orientation?: VideoOrientation;
  isLive?: boolean;
};

/**
 * Kapak + play — tıklanınca iframe (LCP: gömülü YT yüklenmez)
 */
export function LazyVideoPlayer({
  provider,
  videoId,
  title,
  poster,
  duration,
  orientation = "yatay",
  isLive = false,
}: Props) {
  const [active, setActive] = useState(false);
  const dur = formatVideoDurationLabel(duration);
  const vertical = orientation === "dikey";

  return (
    <div
      className={vertical ? styles.wrapVert : styles.wrap}
      data-orientation={orientation}
    >
      {active ? (
        <iframe
          className={styles.frame}
          src={videoEmbedUrl(provider, videoId, { autoplay: true })}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          className={styles.posterBtn}
          onClick={() => setActive(true)}
          aria-label={`${title} — oynat`}
        >
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className={styles.poster} />
          ) : (
            <span className={styles.posterPh} aria-hidden />
          )}
          <span className={styles.play} aria-hidden>
            ▶
          </span>
          {isLive ? <span className={styles.live}>Canlı</span> : null}
          {dur && !isLive ? (
            <span className={styles.duration}>{dur}</span>
          ) : null}
        </button>
      )}
    </div>
  );
}
