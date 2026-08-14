"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { GalleryImage } from "@yenihaber/shared";
import styles from "./article-gallery-strip.module.css";

const Lightbox = dynamic(
  () =>
    import("./article-gallery-lightbox").then((m) => m.ArticleGalleryLightbox),
  { ssr: false, loading: () => null },
);

const PREVIEW = 5;

export type ArticleGalleryStripProps = {
  images: GalleryImage[];
  title: string;
};

/** Kapak altı 5 kare; fazlası son karede +N — tıklanınca lazy lightbox */
export function ArticleGalleryStrip({ images, title }: ArticleGalleryStripProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  if (!images.length) return null;

  const extra = Math.max(0, images.length - PREVIEW);
  const shown = images.slice(0, PREVIEW);

  const open = useCallback((idx: number) => {
    setOpenAt(idx);
  }, []);

  return (
    <>
      <ul className={styles.strip} aria-label="Haber görselleri">
        {shown.map((img, i) => {
          const isLast = i === PREVIEW - 1 && extra > 0;
          return (
            <li key={`${img.url}-${i}`}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => open(i)}
                aria-label={
                  isLast
                    ? `${extra} görsel daha`
                    : `Görsel ${i + 1}: ${img.alt || title}`
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" loading="lazy" decoding="async" />
                {isLast ? (
                  <span className={styles.more}>+{extra}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {openAt != null ? (
        <Lightbox
          images={images}
          index={openAt}
          title={title}
          onClose={() => setOpenAt(null)}
          onIndex={setOpenAt}
        />
      ) : null}
    </>
  );
}
