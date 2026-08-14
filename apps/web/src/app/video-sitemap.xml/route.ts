import { publicApi } from "@/lib/api";
import {
  secondsToIso8601Duration,
  videoEmbedUrl,
} from "@yenihaber/shared";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://duzceradikal.com";

/** Google video sitemap — yayınlanmış video haberleri */
export async function GET() {
  let items: Awaited<ReturnType<typeof publicApi.articles.list>>["data"] = [];
  try {
    const res = await publicApi.articles.list({
      contentType: "video",
      status: "YAYINDA",
      page: 1,
      limit: 200,
    });
    items = res.data.filter((a) => a.videoProvider && a.videoId);
  } catch {
    items = [];
  }

  const urls = items
    .map((a) => {
      const loc = `${SITE}/haber/${a.slug}`;
      const thumb = a.videoPoster || a.coverImage || "";
      const desc = (
        a.metaDescription ||
        a.excerpt ||
        a.title
      )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const title = a.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const duration =
        a.videoDuration != null && a.videoDuration > 0
          ? `\n      <video:duration>${a.videoDuration}</video:duration>`
          : "";
      const pub = a.publishedAt
        ? `\n      <video:publication_date>${new Date(a.publishedAt).toISOString()}</video:publication_date>`
        : "";
      const player = videoEmbedUrl(a.videoProvider!, a.videoId!);
      const iso =
        a.videoDuration != null && a.videoDuration > 0
          ? secondsToIso8601Duration(a.videoDuration)
          : "";
      void iso;

      return `  <url>
    <loc>${loc}</loc>
    <video:video>
      <video:thumbnail_loc>${thumb.replace(/&/g, "&amp;")}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${desc}</video:description>
      <video:player_loc>${player.replace(/&/g, "&amp;")}</video:player_loc>${duration}${pub}
    </video:video>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
