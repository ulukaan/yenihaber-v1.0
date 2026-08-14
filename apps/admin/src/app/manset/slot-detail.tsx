"use client";

import type { MansetSlot } from "@yenihaber/shared";
import { defaultBreakingExpiresAt } from "@yenihaber/shared";
import styles from "./slot-detail.module.css";

export type SlotDetailEditorProps = {
  slot: MansetSlot | null;
  articleTitle: string;
  disabled?: boolean;
  onChange: (patch: Partial<MansetSlot>) => void;
};

/**
 * Seçili slot — manşet başlığı, spot, rozet (anatomi alanları)
 */
export function SlotDetailEditor({
  slot,
  articleTitle,
  disabled,
  onChange,
}: SlotDetailEditorProps) {
  if (!slot?.articleId) {
    return (
      <section className={styles.box}>
        <h3>Manşet kartı</h3>
        <p className={styles.muted}>Önce slot’a haber koyun.</p>
      </section>
    );
  }

  const headline = slot.headlineTitle ?? "";
  const warn60 = headline.length > 60;

  return (
    <section className={styles.box} aria-label={`Slot ${slot.slot} detay`}>
      <h3>
        Slot {slot.slot} — kart detayı
        <span>{articleTitle}</span>
      </h3>
      <div className={styles.grid}>
        <label>
          Manşet başlığı
          <input
            value={headline}
            disabled={disabled}
            placeholder={articleTitle || "Boşsa haber başlığı"}
            maxLength={120}
            onChange={(e) =>
              onChange({ headlineTitle: e.target.value || null })
            }
          />
          <em className={warn60 ? styles.warn : styles.hint}>
            {headline.length || 0}/60{warn60 ? " — uzun başlık" : ""}
          </em>
        </label>
        <label>
          Üst başlık (kategori)
          <input
            value={slot.kicker ?? ""}
            disabled={disabled}
            placeholder="Otomatik: bölge · kategori"
            maxLength={80}
            onChange={(e) => onChange({ kicker: e.target.value || null })}
          />
        </label>
        <label className={styles.full}>
          Spot (yalnızca büyük kart)
          <textarea
            rows={2}
            value={slot.spot ?? ""}
            disabled={disabled}
            placeholder="En fazla 140 karakter"
            maxLength={140}
            onChange={(e) => onChange({ spot: e.target.value || null })}
          />
        </label>
        <label>
          Rozet metni
          <input
            value={slot.badgeText ?? ""}
            disabled={disabled}
            placeholder="Örn. Son dakika"
            maxLength={40}
            onChange={(e) => onChange({ badgeText: e.target.value || null })}
          />
        </label>
        <label>
          Rozet rengi
          <input
            type="color"
            value={slot.badgeColor ?? "#E10600"}
            disabled={disabled || !slot.badgeText}
            onChange={(e) => onChange({ badgeColor: e.target.value })}
          />
        </label>
        <label>
          Rozet bitiş
          <input
            type="datetime-local"
            disabled={disabled || !slot.badgeText}
            value={
              slot.badgeExpiresAt ? toLocal(slot.badgeExpiresAt) : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                badgeExpiresAt: v
                  ? new Date(v).toISOString()
                  : defaultBreakingExpiresAt(),
              });
            }}
          />
        </label>
      </div>
    </section>
  );
}

function toLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
