"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./mobile-tab-bar.module.css";

export type MobileTabBarProps = {
  onMore: () => void;
  moreOpen?: boolean;
};

function TabIconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabIconBolt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 3 5 14h7l-1 7 8-11h-7l1-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabIconFlower() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20c4-4 6-7.5 6-11a6 6 0 1 0-12 0c0 3.5 2 7 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 13V8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TabIconMore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M5 12h14M5 17h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mobil alt gezinme — Anasayfa, Son dakika, Vefat, Daha */
export function MobileTabBar({ onMore, moreOpen = false }: MobileTabBarProps) {
  const pathname = usePathname() || "";

  const tabs = [
    { href: "/", label: "Anasayfa", icon: <TabIconHome />, match: (p: string) => p === "/" },
    {
      href: "/son-dakika",
      label: "Son dakika",
      icon: <TabIconBolt />,
      match: (p: string) => p.startsWith("/son-dakika"),
    },
    {
      href: "/servis/vefat",
      label: "Vefat",
      icon: <TabIconFlower />,
      match: (p: string) => p.includes("vefat"),
    },
  ] as const;

  return (
    <nav className={styles.bar} aria-label="Alt gezinme">
      {tabs.map((tab) => {
        const on = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab}${on ? ` ${styles.on}` : ""}`}
            aria-current={on ? "page" : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className={`${styles.tab}${moreOpen ? ` ${styles.on}` : ""}`}
        aria-label="Daha fazla menü"
        aria-expanded={moreOpen}
        onClick={onMore}
      >
        <TabIconMore />
        <span>Daha</span>
      </button>
    </nav>
  );
}
