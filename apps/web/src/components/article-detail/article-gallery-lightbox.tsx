"use client";

import { useEffect } from "react";
import type { GalleryImage } from "@yenihaber/shared";
import styles from "./article-gallery-lightbox.module.css";

export type ArticleGalleryLightboxProps = {
  images: GalleryImage[];
  index: number;
  title: string;
  onClose: () => void;
  onIndex: (n: number) => void;
};

/** Tam ekran galeri — ayrı chunk */
export function ArticleGalleryLightbox({
  images,
  index,
  title,
  onClose,
  onIndex,
}: ArticleGalleryLightboxProps) {
  const img = images[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(Math.min(images.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [images.length, index, onClose, onIndex]);

  if (!img) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Görsel galeri"
      onClick={onClose}
    >
      <div
        className={styles.frame}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.alt || title}
          className={styles.img}
        />
        <p className={styles.meta}>
          {index + 1} / {images.length}
          {img.alt ? ` · ${img.alt}` : ""}
        </p>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            disabled={index <= 0}
            onClick={() => onIndex(index - 1)}
            aria-label="Önceki görsel"
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={onClose}
            aria-label="Kapat"
          >
            Kapat
          </button>
          <button
            type="button"
            className={styles.navBtn}
            disabled={index >= images.length - 1}
            onClick={() => onIndex(index + 1)}
            aria-label="Sonraki görsel"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
