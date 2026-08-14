import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "@yenihaber/ui/globals.css";
import {
  getSiteSettings,
  themeStyleFromSettings,
} from "@/lib/site-settings";
import styles from "./layout.module.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-yh-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-yh-serif",
  display: "swap",
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

/** Kök layout — Newsreader + Inter, latin-ext */
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
