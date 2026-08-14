"use client";

import type { ApiMenuItem } from "@yenihaber/shared";
import styles from "./menu.module.css";

function previewClass(item: ApiMenuItem): string {
  if (item.type === "heading") return styles.previewHead ?? "";
  if (item.type === "category") return styles.previewCat ?? "";
  if (item.href?.startsWith("/servis") || item.type === "page") {
    return styles.previewMuted ?? "";
  }
  return styles.previewItem ?? "";
}

/** Sitedeki yan menünün sade önizlemesi */
export function MenuLivePreview({ items }: { items: ApiMenuItem[] }) {
  const visible = items.filter((i) => i.isActive);

  return (
    <section className={styles.preview} aria-label="Canlı önizleme">
      <p className={styles.previewLabel}>Önizleme</p>
      {visible.length === 0 ? (
        <p className={styles.previewEmpty}>Öğe yok</p>
      ) : (
        <ul className={styles.previewList}>
          {visible.map((item) => (
            <li key={item.id}>
              {item.type === "heading" ? (
                <span className={styles.previewHead}>{item.resolvedLabel}</span>
              ) : (
                <span
                  className={`${previewClass(item)}${
                    item.children.length ? ` ${styles.previewParent ?? ""}` : ""
                  }`}
                >
                  {item.resolvedLabel}
                </span>
              )}
              {item.children.filter((c) => c.isActive).length ? (
                <ul className={styles.previewSub}>
                  {item.children
                    .filter((c) => c.isActive)
                    .map((ch) => (
                      <li key={ch.id} className={styles.previewChild}>
                        {ch.resolvedLabel}
                      </li>
                    ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
