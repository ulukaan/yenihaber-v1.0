import type { Metadata } from "next";
import styles from "./member-panel-layout.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Üye paneli — site header/footer yok, tam ekran uygulama iskeleti
 */
export default function MemberPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={styles.root}>{children}</div>;
}
