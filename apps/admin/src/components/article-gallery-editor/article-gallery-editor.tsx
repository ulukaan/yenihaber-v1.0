"use client";

import { useRef, useState } from "react";
import type { GalleryImage } from "@yenihaber/shared";
import { adminApi } from "@/lib/api";
import styles from "./article-gallery-editor.module.css";

export type ArticleGalleryEditorProps = {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
};

/**
 * Galeri DnD — ilk görsel otomatik kapak (üst bileşen senkronlar).
 */
export function ArticleGalleryEditor({
  images,
  onChange,
}: ArticleGalleryEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next = [...images];
      for (const file of Array.from(files)) {
        const res = await adminApi.media.upload(file, { kind: "haber" });
        next.push({ url: res.url, alt: null });
      }
      onChange(next);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [row] = next.splice(from, 1);
    if (!row) return;
    next.splice(to, 0, row);
    onChange(next);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <strong>Galeri şeridi</strong>
        <span>İlk görsel kapak olur · sürükle-bırak sırala</span>
      </div>
      <ul className={styles.list}>
        {images.map((img, i) => (
          <li
            key={`${img.url}-${i}`}
            className={styles.item}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx == null) return;
              move(dragIdx, i);
              setDragIdx(null);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" />
            {i === 0 ? <span className={styles.badge}>Kapak</span> : null}
            <div className={styles.actions}>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
                aria-label="Yukarı"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === images.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label="Aşağı"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                aria-label="Kaldır"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />
      <button
        type="button"
        className={styles.add}
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? "Yükleniyor…" : "Görsel ekle"}
      </button>
    </div>
  );
}
