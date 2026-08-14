import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth-shell.module.css";

export type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Üyelik sayfaları — sol bilgi paneli + sağ form (referans: full-bleed split)
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className={styles.page}>
      <aside className={styles.intro}>
        <Link href="/" className={styles.homeBtn}>
          <span className={styles.homeArrow} aria-hidden>
            ←
          </span>
          Anasayfaya Dön
        </Link>
        <div className={styles.introBody}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
      </aside>

      <section className={styles.formSide} aria-label={title}>
        <div className={styles.formInner}>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
