"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MainNav } from "@yenihaber/shared";
import styles from "./category-strip.module.css";

export type CategoryStripProps = {
  items: MainNav;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobil üst kategori şeridi — serbest yatay kaydırma, aktifte 2px aksan */
export function CategoryStrip({ items }: CategoryStripProps) {
  const pathname = usePathname() || "";
  if (!items.length) return null;

  return (
    <nav className={styles.strip} aria-label="Kategoriler">
      <div className={styles.scroller}>
        <Link
          href="/"
          className={`${styles.item}${pathname === "/" ? ` ${styles.active}` : ""}`}
        >
          Anasayfa
        </Link>
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.item}${
              isActive(pathname, item.href) ? ` ${styles.active}` : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
