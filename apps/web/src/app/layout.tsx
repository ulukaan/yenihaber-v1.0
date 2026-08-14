import type { Metadata } from "next";
import localFont from "next/font/local";
import "@yenihaber/ui/globals.css";
import {
  getSiteSettings,
  themeStyleFromSettings,
} from "@/lib/site-settings";
import styles from "./layout.module.css";

const inter = localFont({
  src: [
    {
      path: "./fonts/inter-latin-ext-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/inter-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-yh-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

const newsreader = localFont({
  src: [
    {
      path: "./fonts/newsreader-latin-ext-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/newsreader-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-yh-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const name = s["site.name"] || s.siteName || "Düzce Radikal";
  const tpl = s["seo.titleTemplate"] || `%s | ${name}`;
  const desc =
    s["seo.defaultDescription"] ||
    "Düzce ve bölgeden son dakika, manşet, gündem, spor, ekonomi ve daha fazlası.";
  const favicon = s["site.favicon"] || "/brand/logo-color.png";
  const og = s["seo.defaultOgImage"];
  return {
    title: {
      default: `${name} — Son Dakika Haberler`,
      template: tpl.includes("%s") ? tpl : `%s | ${name}`,
    },
    description: desc,
    icons: {
      icon: favicon,
      apple: favicon,
    },
    openGraph: og ? { images: [og] } : undefined,
    verification: s["seo.searchConsoleCode"]
      ? { google: s["seo.searchConsoleCode"] }
      : undefined,
  };
}

/** Kök layout — Newsreader + Inter (repo içi woff2) */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s = await getSiteSettings();
  const themeCss = themeStyleFromSettings(s);

  const themeBootScript = `(function(){try{var t=localStorage.getItem("yh-theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className={styles.body}>{children}</body>
    </html>
  );
}
