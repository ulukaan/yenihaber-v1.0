import type { Metadata } from "next";
import localFont from "next/font/local";
import "@yenihaber/ui/globals.css";
import "@/styles/admin-theme.css";
import { AuthProvider } from "@/components/auth-provider/auth-provider";
import { PanelThemeBridge } from "@/components/panel-theme-bridge/panel-theme-bridge";
import styles from "./layout.module.css";

const manrope = localFont({
  src: [
    {
      path: "./fonts/manrope-latin-ext-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/manrope-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-yh-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: {
    default: "Düzce Radikal Admin",
    template: "%s | Admin",
  },
  description: "Düzce Radikal yönetim paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={manrope.variable}>
      <body className={styles.body}>
        <PanelThemeBridge />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
