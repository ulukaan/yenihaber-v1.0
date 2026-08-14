"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listSaved,
  removeSaved,
  type SavedArticle,
} from "@/lib/member-prefs";
import styles from "./member-shell.module.css";

/** Kayıtlı haberler listesi */
export function MemberSaved() {
  const [items, setItems] = useState<SavedArticle[]>([]);

  useEffect(() => {
    function sync() {
      setItems(listSaved());
    }
    sync();
    window.addEventListener("yh-member-prefs", sync);
    return () => window.removeEventListener("yh-member-prefs", sync);
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Kayıtlı haber yok. Beğendiğiniz haberlerde «Kaydet» kullanın.</p>
        <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>
          Ana sayfa
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.slug} className={styles.row}>
          {item.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.rowMedia} src={item.coverImage} alt="" />
          ) : (
            <div className={styles.rowMedia} aria-hidden />
          )}
          <div>
            <Link href={`/haber/${item.slug}`} className={styles.rowTitle}>
              {item.title}
            </Link>
            <p className={styles.rowMeta}>
              {item.categoryName || "Haber"}
              {item.savedAt
                ? ` · ${new Date(item.savedAt).toLocaleDateString("tr-TR")}`
                : null}
            </p>
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              aria-label={`${item.title} kaydını kaldır`}
              onClick={() => setItems(removeSaved(item.slug))}
            >
              Kaldır
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
