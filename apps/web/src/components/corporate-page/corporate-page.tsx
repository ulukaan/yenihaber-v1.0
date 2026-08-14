import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./corporate-page.module.css";

export type CorporateNavItem = {
  href: string;
  label: string;
};

const DEFAULT_NAV: CorporateNavItem[] = [
  { href: "/kvkk", label: "KVKK" },
  { href: "/kunye", label: "Künye" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/ihbar", label: "İhbar" },
  { href: "/reklam", label: "Reklam" },
  { href: "/gizlilik", label: "Gizlilik" },
];

export { DEFAULT_NAV as CORPORATE_NAV };

type Props = {
  kicker?: string;
  title: string;
  lead: string;
  activeHref: string;
  children: ReactNode;
  aside?: ReactNode;
  nav?: CorporateNavItem[];
};

/** Kurumsal sayfa iskeleti — mast + nav + gövde */
export function CorporatePage({
  kicker = "Kurumsal",
  title,
  lead,
  activeHref,
  children,
  aside,
  nav = DEFAULT_NAV,
}: Props) {
  return (
    <div className={styles.root}>
      <header className={styles.mast}>
        <div className={`yh-container ${styles.mastInner}`}>
          <nav className={styles.crumb} aria-label="Sayfa konumu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden>/</span>
            <span className={styles.crumbNow}>{title}</span>
          </nav>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </div>
      </header>

      <div className={`yh-container ${styles.wrap}`}>
        <nav className={styles.tabs} aria-label="Kurumsal sayfalar">
          {nav.map((item) => {
            const on = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={on ? styles.tabOn : styles.tab}
                aria-current={on ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={aside ? styles.layout : styles.layoutSolo}>
          <div className={styles.main}>{children}</div>
          {aside ? <aside className={styles.aside}>{aside}</aside> : null}
        </div>
      </div>
    </div>
  );
}
