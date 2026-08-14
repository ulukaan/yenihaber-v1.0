import styles from "./auth-layout.module.css";

/** Üyelik sayfaları — header/footer yok, tam ekran */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className={styles.main}>{children}</main>;
}
