"use client";

import styles from "./manset-preview.module.css";

/** Kısa düzen notu — canlı önizleme sitede (Siteyi aç) */
export function LayoutPicker() {
  return (
    <p className={styles.pickerHint}>
      Tek manşet: <strong>editöryel düzen</strong> — büyük sürgü + sağda öne
      çıkan (manşet tekrarı yok). Sonuç için üstten <strong>Siteyi aç</strong>.
    </p>
  );
}
