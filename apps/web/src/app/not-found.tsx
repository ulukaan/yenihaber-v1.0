import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header/site-header";
import { SiteFooter } from "@/components/site-footer/site-footer";
import styles from "./(site)/yasal.module.css";
import layoutStyles from "./(site)/site-layout.module.css";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
};

/** Global 404 — site iskeleti ile */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="icerik" className={layoutStyles.main}>
        <div className={`yh-container ${styles.page}`}>
          <article className={styles.card}>
            <p className={styles.errorCode}>404</p>
            <h1>Sayfa bulunamadı</h1>
            <p>
              Aradığınız adres taşınmış veya hiç var olmamış olabilir. Ana
              sayfadan veya aramadan devam edebilirsiniz.
            </p>
            <p className={styles.actions}>
              <Link href="/">Ana sayfa</Link>
              <Link href="/ara">Haber ara</Link>
              <Link href="/son-dakika">Son dakika</Link>
              <Link href="/iletisim">İletişim</Link>
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
