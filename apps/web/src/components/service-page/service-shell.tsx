import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./service-shell.module.css";

export type ServiceNavItem = {
  href: string;
  label: string;
  short: string;
};

export const SERVICE_NAV: ServiceNavItem[] = [
  { href: "/servis/namaz", label: "Namaz vakitleri", short: "Namaz" },
  { href: "/servis/nobetci-eczane", label: "Nöbetçi eczane", short: "Eczane" },
  { href: "/servis/vefat", label: "Vefat ilanları", short: "Vefat" },
  { href: "/servis/hava", label: "Hava durumu", short: "Hava" },
  { href: "/servis/doviz", label: "Döviz & piyasa", short: "Döviz" },
  { href: "/servis/vizyon", label: "Vizyondaki filmler", short: "Vizyon" },
];

type Props = {
  activeHref: string;
  title: string;
  lead: string;
  meta?: string;
  children: ReactNode;
  aside?: ReactNode;
  disclaimer?: string;
};

/** Servis sayfası iskeleti — ortak sekmeler, mast, yardımcı kolon */
export function ServiceShell({
  activeHref,
  title,
  lead,
  meta,
  children,
  aside,
  disclaimer = "Bilgiler üçüncü taraf kaynaklardan alınır; bilgilendirme amaçlıdır. Resmî kararlar için birincil kurum kayıtlarını doğrulayın.",
}: Props) {
  return (
    <div className={styles.root}>
      <header className={styles.mast}>
        <div className={`yh-container ${styles.mastInner}`}>
          <nav className={styles.crumb} aria-label="Sayfa konumu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden>/</span>
            <Link href="/servis">Servisler</Link>
            <span aria-hidden>/</span>
            <span className={styles.crumbNow}>{title}</span>
          </nav>
          <p className={styles.kicker}>Günlük servis</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
          {meta ? <p className={styles.meta}>{meta}</p> : null}
        </div>
      </header>

      <div className={`yh-container ${styles.body}`}>
        <nav className={styles.tabs} aria-label="Servisler">
          {SERVICE_NAV.map((item) => {
            const on = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={on ? styles.tabOn : styles.tab}
                aria-current={on ? "page" : undefined}
                prefetch={false}
              >
                <span className={styles.tabLong}>{item.label}</span>
                <span className={styles.tabShort}>{item.short}</span>
              </Link>
            );
          })}
        </nav>

        <div className={aside ? styles.layout : styles.layoutSolo}>
          <div className={styles.main}>{children}</div>
          {aside ? <aside className={styles.aside}>{aside}</aside> : null}
        </div>

        {activeHref !== "/servis" ? (
          <section className={styles.related} aria-label="Diğer servisler">
            <h2 className={styles.relatedTitle}>Diğer servisler</h2>
            <ul className={styles.relatedList}>
              {SERVICE_NAV.filter((s) => s.href !== activeHref).map((s) => (
                <li key={s.href}>
                  <Link href={s.href} prefetch={false}>
                    {s.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/servis">Tüm servisler</Link>
              </li>
            </ul>
          </section>
        ) : null}

        <p className={styles.disclaimer}>{disclaimer}</p>
      </div>
    </div>
  );
}
