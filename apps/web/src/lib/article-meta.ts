import type { ApiArticle } from "@yenihaber/shared";
import { secondsToIso8601Duration, videoEmbedUrl } from "@yenihaber/shared";
import { tarihBicimle } from "./format-date";

const SITE_NAME = "Düzce Radikal";

/** Mutlak tarih — timezone TR, hukuki satır (saat dahil) */
export function formatAbsoluteTr(iso: string | null | undefined): string {
  return tarihBicimle(iso, "legal");
}

/** Aynı gün güncellemede yalnızca saat; farklı günde tam tarih */
export function formatUpdateTr(
  published: string | null | undefined,
  updated: string | null | undefined,
): string | null {
  if (!updated) return null;
  const u = new Date(updated);
  if (Number.isNaN(u.getTime())) return null;
  if (published) {
    const p = new Date(published);
    if (
      !Number.isNaN(p.getTime()) &&
      Math.abs(u.getTime() - p.getTime()) < 90_000
    ) {
      return null; // yayın anı sayılır, güncelleme satırı gereksiz
    }
  }
  if (published) {
    const p = new Date(published);
    const sameDay =
      !Number.isNaN(p.getTime()) &&
      p.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }) ===
        u.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
    if (sameDay) {
      return new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        minute: "2-digit",
      }).format(u);
    }
  }
  return formatAbsoluteTr(updated);
}

/** Schema.org datetime (Europe/Istanbul ofset tahmini için ISO koru) */
export function toIsoZ(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/** Kabaca okuma süresi — TR metin ~190 kelime/dk (sunucu kaydı yoksa) */
export function estimateReadingMinutes(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 190));
}

/** İlk N </p> kapanışından sonra metni ikiye böl (reklam yuvası) */
export function splitAfterParagraphs(
  html: string,
  n = 2,
): { before: string; after: string } {
  if (!html?.trim()) return { before: "", after: "" };
  let count = 0;
  const re = /<\/p>/gi;
  let match: RegExpExecArray | null;
  let cut = -1;
  while ((match = re.exec(html)) !== null) {
    count += 1;
    if (count === n) {
      cut = match.index + match[0].length;
      break;
    }
  }
  if (cut < 0) return { before: html, after: "" };
  return { before: html.slice(0, cut), after: html.slice(cut) };
}

/** Kapak alt yazısı: spot/kategori + fotoğraf kredisi */
export function coverCaption(article: ApiArticle): string {
  const agency = article.sourceAgency?.trim();
  const credit = agency ? `Fotoğraf: ${agency}` : `Fotoğraf: ${SITE_NAME}`;
  const desc =
    article.excerpt?.trim() ||
    article.metaDescription?.trim() ||
    article.title;
  const short =
    desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc;
  return `${short} ${credit}`;
}

export function articleCanonicalUrl(
  siteUrl: string,
  slug: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  return base ? `${base}/haber/${slug}` : `/haber/${slug}`;
}

export function buildNewsArticleJsonLd(
  article: ApiArticle,
  siteUrl: string,
): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, "") || "https://duzceradikal.com";
  const url = `${base}/haber/${article.slug}`;
  const headline =
    article.title.length > 110
      ? `${article.title.slice(0, 107).trimEnd()}…`
      : article.title;
  const image = article.coverImage
    ? [article.coverImage, article.coverImage, article.coverImage]
    : undefined;
  const authorUrl = article.author.slug
    ? `${base}/yazar/${article.author.slug}`
    : undefined;
  const published =
    toIsoZ(article.publishedAt) || toIsoZ(article.createdAt);
  const modified =
    toIsoZ(article.updatedAt) || published;

  const newsArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: published,
    dateModified: modified,
    author: [
      {
        "@type": "Person",
        name: article.sourceAgency?.trim() || article.author.name,
        ...(authorUrl && !article.sourceAgency?.trim()
          ? { url: authorUrl }
          : {}),
      },
    ],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      "@id": `${base}/#organization`,
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/brand/logo-color.png`,
      },
    },
    ...(image ? { image } : {}),
    articleSection: article.category.name,
    inLanguage: "tr-TR",
    description: article.metaDescription || article.excerpt || undefined,
    commentCount: article.commentCount ?? 0,
  };

  if (
    article.contentType === "video" &&
    article.videoProvider &&
    article.videoId
  ) {
    const thumb =
      article.videoPoster || article.coverImage || undefined;
    const videoObject: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: article.title,
      description:
        article.metaDescription ||
        article.excerpt ||
        article.title,
      thumbnailUrl: thumb ? [thumb] : undefined,
      uploadDate: published,
      embedUrl: videoEmbedUrl(article.videoProvider, article.videoId),
      publisher: { "@id": `${base}/#organization` },
      mainEntityOfPage: url,
    };
    if (article.videoDuration != null && article.videoDuration > 0) {
      videoObject.duration = secondsToIso8601Duration(article.videoDuration);
    }
    if (article.videoTranscript) {
      videoObject.transcript = article.videoTranscript.slice(0, 5000);
    }
    return {
      "@context": "https://schema.org",
      "@graph": [newsArticle, videoObject],
    };
  }

  return newsArticle;
}

export { SITE_NAME };
