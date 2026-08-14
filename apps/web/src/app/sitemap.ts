import type { MetadataRoute } from "next";
import { publicApi } from "@/lib/api";
import { getSiteSettings } from "@/lib/site-settings";

const STATIC_PATHS = [
  "/",
  "/kunye",
  "/iletisim",
  "/kvkk",
  "/gizlilik",
  "/cerez",
  "/kullanim-kosullari",
  "/reklam",
  "/son-dakika",
] as const;

const MAX_ARTICLE_PAGES = 50;
const PAGE_SIZE = 100;

/**
 * /sitemap.xml — robots.ts bunu ilan eder.
 * seo.sitemapEnabled=0 ise boş döner (robots zaten disallow).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSiteSettings();
  if (s["seo.sitemapEnabled"] === "0") return [];

  const base = (
    s["site.url"] ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://duzceradikal.com"
  ).replace(/\/$/, "");

  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "hourly" : "monthly",
    priority: path === "/" ? 1 : 0.4,
  }));

  try {
    const cats = await publicApi.categories.list();
    for (const cat of cats) {
      entries.push({
        url: `${base}/kategori/${cat.slug}`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.7,
      });
    }
  } catch {
    /* API kapalıysa statik sayfalar yeter */
  }

  try {
    for (let page = 1; page <= MAX_ARTICLE_PAGES; page++) {
      const res = await publicApi.articles.list({
        page,
        limit: PAGE_SIZE,
        status: "YAYINDA",
      });
      for (const a of res.data) {
        entries.push({
          url: `${base}/haber/${a.slug}`,
          lastModified: a.updatedAt
            ? new Date(a.updatedAt)
            : a.publishedAt
              ? new Date(a.publishedAt)
              : now,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
      if (page >= (res.meta.totalPages || 1) || !res.data.length) break;
    }
  } catch {
    /* haberler yoksa devam */
  }

  return entries;
}
