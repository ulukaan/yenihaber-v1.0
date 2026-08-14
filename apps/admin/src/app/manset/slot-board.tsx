"use client";

import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import type { MansetPanelSlotView, MansetCandidate } from "@yenihaber/shared";
import styles from "./manset.module.css";

export type SlotBoardProps = {
  title: string;
  slots: MansetPanelSlotView[];
  selectedSlot: number | null;
  disabled?: boolean;
  onSelectSlot: (slot: number) => void;
  onClear: (slot: number) => void;
  onMove: (slot: number, dir: -1 | 1) => void;
  onDropArticle?: (slot: number, articleId: string) => void;
};

export function SlotBoard({
  title,
  slots,
  selectedSlot,
  disabled,
  onSelectSlot,
  onClear,
  onMove,
  onDropArticle,
}: SlotBoardProps) {
  return (
    <section className={styles.board} aria-label={title}>
      <h2 className={styles.colTitle}>{title}</h2>
      <ul className={styles.slotList}>
        {slots.map((s) => {
          const active = selectedSlot === s.slot;
          return (
            <li
              key={s.slot}
              className={[
                styles.slot,
                s.empty ? styles.slotEmpty : "",
                active ? styles.slotActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectSlot(s.slot)}
              onDragOver={(e) => {
                if (disabled) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (disabled) return;
                e.preventDefault();
                const id = e.dataTransfer.getData("text/article-id");
                if (id && onDropArticle) onDropArticle(s.slot, id);
              }}
            >
              <span className={styles.grip} aria-hidden>
                <GripVertical size={16} />
              </span>
              <div className={styles.slotBody}>
                <span className={styles.slotLabel}>{s.label}</span>
                {s.article ? (
                  <div className={styles.slotRow}>
                    {s.article.coverImage169 || s.article.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          s.article.coverImage169 ||
                          s.article.coverImage ||
                          ""
                        }
                        alt=""
                        className={styles.thumb}
                      />
                    ) : (
                      <span className={styles.thumbPh} />
                    )}
                    <strong className={styles.slotTitle}>
                      {s.article.title}
                    </strong>
                  </div>
                ) : (
                  <p className={styles.slotHint}>
                    Slot {s.slot} boş — sağdan haber seçin veya sürükleyin
                  </p>
                )}
              </div>
              <div className={styles.slotActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  disabled={disabled || s.slot <= 1}
                  aria-label="Yukarı taşı"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(s.slot, -1);
                  }}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  disabled={disabled || s.slot >= slots.length}
                  aria-label="Aşağı taşı"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(s.slot, 1);
                  }}
                >
                  <ChevronDown size={16} />
                </button>
                {s.article ? (
                  <button
                    type="button"
                    className={styles.iconBtn}
                    disabled={disabled}
                    aria-label="Slotu boşalt"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear(s.slot);
                    }}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export type CandidateListProps = {
  items: MansetCandidate[];
  only48h: boolean;
  onOnly48h: (v: boolean) => void;
  usedIds: Set<string>;
  disabled?: boolean;
  onAssign: (articleId: string) => void;
};

export function CandidateList({
  items,
  only48h,
  onOnly48h,
  usedIds,
  disabled,
  onAssign,
}: CandidateListProps) {
  return (
    <section className={styles.candidates} aria-label="Aday haberler">
      <div className={styles.candHead}>
        <h2 className={styles.colTitle}>Aday haberler</h2>
        <label className={styles.check48}>
          <input
            type="checkbox"
            checked={only48h}
            onChange={(e) => onOnly48h(e.target.checked)}
          />
          Son 48 saat
        </label>
      </div>
      <ul className={styles.candList}>
        {items.map((a) => {
          const used = usedIds.has(a.id);
          const noCover =
            !a.hasMansetCover && !(a.coverImage169 || a.coverImage);
          return (
            <li
              key={a.id}
              className={[
                styles.candItem,
                used ? styles.candUsed : "",
                noCover ? styles.candNoCover : "",
              ]
                .filter(Boolean)
                .join(" ")}
              draggable={!disabled && !noCover && !used}
              onDragStart={(e) => {
                if (noCover || used) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData("text/article-id", a.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
            >
              {a.coverImage169 || a.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.coverImage169 || a.coverImage || ""}
                  alt=""
                  className={styles.thumb}
                />
              ) : (
                <span className={styles.thumbPh} />
              )}
              <div className={styles.candMeta}>
                <strong>{a.title}</strong>
                {noCover ? (
                  <span className={styles.badgeWarn}>Kapak eksik</span>
                ) : null}
              </div>
              <div className={styles.candActions}>
                <button
                  type="button"
                  className={styles.assignBtn}
                  disabled={disabled || used || noCover}
                  onClick={() => onAssign(a.id)}
                  aria-label="Seçili slota ekle"
                >
                  Ekle
                </button>
                <span className={styles.grip} aria-hidden>
                  <GripVertical size={16} />
                </span>
              </div>
            </li>
          );
        })}
        {!items.length ? (
          <li className={styles.empty}>Aday haber yok</li>
        ) : null}
      </ul>
    </section>
  );
}
