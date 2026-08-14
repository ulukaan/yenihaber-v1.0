import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@yenihaber/ui/globals.css";
import "@/styles/admin-theme.css";
import { AuthProvider } from "@/components/auth-provider/auth-provider";
import { PanelThemeBridge } from "@/components/panel-theme-bridge/panel-theme-bridge";
import styles from "./layout.module.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-yh-sans",
  display: "swap",
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
