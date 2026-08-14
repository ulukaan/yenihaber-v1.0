"use client";

import { useId, useState } from "react";
import { adminApi } from "@/lib/api";
import styles from "./image-file-field.module.css";

type MediaKind = "haber" | "genel" | "marka";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: MediaKind;
  accept?: string;
  hint?: string;
  disabled?: boolean;
  previewTone?: "light" | "dark" | "red";
  onError?: (msg: string) => void;
};

/**
 * Görsel alanı — dosya seç, yükle, önizle. URL yapıştırılmaz.
 */
export function ImageFileField({
  label,
  value,
  onChange,
  kind = "haber",
  accept = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
  hint,
  disabled,
  previewTone = "light",
  onError,
}: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    onError?.("");
    try {
      const res = await adminApi.media.upload(file, { kind, alt: label });
      onChange(res.url);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Görsel yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <div className={styles.row}>
        <div className={styles.preview} data-tone={previewTone}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" />
          ) : (
            <span>Dosya seç</span>
          )}
        </div>
        <div className={styles.actions}>
          <label className={styles.fileBtn} htmlFor={id}>
            {busy ? "Yükleniyor…" : value ? "Değiştir" : "Dosya seç"}
            <input
              id={id}
              type="file"
              accept={accept}
              disabled={disabled || busy}
              aria-labelledby={`${id}-label`}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              className={styles.clearBtn}
              disabled={disabled || busy}
              onClick={() => onChange("")}
            >
              Kaldır
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
