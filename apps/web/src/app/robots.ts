import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSiteSettings();
  const raw = s["seo.robotsTxt"] || "";
  const siteUrl = (s["site.url"] || "https://duzceradikal.com").replace(
    /\/$/,
    "",
  );

  // basitleştirilmiş: Allow all + sitemap
  if (s["seo.sitemapEnabled"] !== "1") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  if (raw.includes("Disallow: /")) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
