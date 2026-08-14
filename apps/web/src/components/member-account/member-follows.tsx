"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listFollows,
  removeFollow,
  type FollowedAuthor,
} from "@/lib/member-prefs";
import styles from "./member-shell.module.css";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
}

/** Takip edilen yazarlar */
export function MemberFollows() {
  const [items, setItems] = useState<FollowedAuthor[]>([]);

  useEffect(() => {
    function sync() {
      setItems(listFollows());
    }
    sync();
    window.addEventListener("yh-member-prefs", sync);
    return () => window.removeEventListener("yh-member-prefs", sync);
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          Kimseyi takip etmiyorsunuz. Yazar sayfalarından «Takip et» ile ekleyin.
        </p>
        <Link href="/yazarlar" className={`${styles.btn} ${styles.btnPrimary}`}>
          Yazarlar
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.slug} className={styles.row}>
          {item.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.rowAvatar}
              src={item.avatarUrl}
              alt=""
            />
          ) : (
            <div className={styles.rowAvatar} aria-hidden>
              {initials(item.name)}
            </div>
          )}
          <div>
            <Link href={`/yazar/${item.slug}`} className={styles.rowTitle}>
              {item.name}
            </Link>
            <p className={styles.rowMeta}>{item.title || "Yazar"}</p>
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              aria-label={`${item.name} takipten çık`}
              onClick={() => setItems(removeFollow(item.slug))}
            >
              Çıkar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
