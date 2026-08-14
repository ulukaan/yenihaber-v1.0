"use client";

import { useEffect, useRef, useState } from "react";
import type { AdPublic } from "@yenihaber/shared";
import styles from "./ad-slot.module.css";

const API = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");

function track(adId: string, event: "impression" | "click") {
  const body = JSON.stringify({ adId, event });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      `${API}/ads/track`,
      new Blob([body], { type: "application/json" }),
    );
  } else {
    void fetch(`${API}/ads/track`, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
  }
}

type Props = {
  ad: AdPublic;
  slotCode: string;
};

export function AdRenderer({ ad, slotCode }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.5) {
          setSeen(true);
          track(ad.id, "impression");
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad.id, seen]);

  const handleClick = () => track(ad.id, "click");

  return (
    <div ref={ref} data-ad-id={ad.id} data-ad-slot={slotCode}>
      {ad.type === "image" && ad.imageUrl ? (
        <a
          href={ad.targetUrl ?? "#"}
          target="_blank"
          rel="nofollow sponsored noopener"
          onClick={handleClick}
          className={styles.link}
        >
          {ad.imageUrlMobile ? (
            <picture>
              <source media="(max-width: 767px)" srcSet={ad.imageUrlMobile} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.imageUrl} alt="" loading="lazy" className={styles.img} />
            </picture>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.imageUrl} alt="" loading="lazy" className={styles.img} />
          )}
        </a>
      ) : null}

      {ad.type === "html" && ad.htmlCode ? (
        <div dangerouslySetInnerHTML={{ __html: ad.htmlCode }} />
      ) : null}

      {ad.type === "adsense" && ad.adsenseSlotId ? (
        <AdSense slotId={ad.adsenseSlotId} />
      ) : null}

      {ad.type === "video" && ad.targetUrl ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={ad.targetUrl}
          autoPlay
          muted
          playsInline
          controls={false}
          onClick={handleClick}
          className={styles.video}
        />
      ) : null}
    </div>
  );
}

function AdSense({ slotId }: { slotId: string }) {
  useEffect(() => {
    try {
      // @ts-expect-error AdSense global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [slotId]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
