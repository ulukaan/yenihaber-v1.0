import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api";
import { buildNewsArticleJsonLd } from "@/lib/article-meta";
import { getSiteSettings } from "@/lib/site-settings";
import { ArticleStream } from "@/components/article-detail/article-stream";
import { loadArticleSidebarData } from "@/components/article-detail/load-article-sidebar-data";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await publicApi.articles.getBySlug(slug);
    return {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      openGraph: {
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.excerpt || undefined,
        type: "article",
        publishedTime: article.publishedAt || undefined,
        modifiedTime: article.updatedAt || undefined,
        images: article.coverImage ? [article.coverImage] : undefined,
      },
    };
  } catch {
    return { title: "Haber" };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let article;
  try {
    article = await publicApi.articles.getBySlug(slug);
  } catch {
    notFound();
  }

  let related: Awaited<ReturnType<typeof publicApi.articles.list>> = {
    data: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
  };
  let popular: Awaited<ReturnType<typeof publicApi.articles.list>> = {
    data: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
  };

  try {
    [related, popular] = await Promise.all([
      publicApi.articles.list({
        categorySlug: article.category.slug,
        page: 1,
        limit: 16,
      }),
      publicApi.articles.list({ page: 1, limit: 16 }),
    ]);
  } catch {
    // ignore
  }

  const pivot = new Date(
    article.publishedAt || article.createdAt || 0,
  ).getTime();

  const ts = (a: { publishedAt?: string | null; createdAt?: string }) =>
    new Date(a.publishedAt || a.createdAt || 0).getTime();

  /** Sonsuz kaydırma kuyruğu: önce aynı kategori (yeni→eski), sonra genel */
  const seen = new Set([article.slug]);
  const nextSlugs: string[] = [];
  const relatedItems: (typeof related.data) = [];

  const catSorted = [...related.data]
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => ts(b) - ts(a));

  // kategori: pivot'tan daha yeni (ASC) sonra daha eski (DESC)
  const catNewer = catSorted
    .filter((a) => ts(a) > pivot)
    .sort((a, b) => ts(a) - ts(b));
  const catOlder = catSorted.filter((a) => ts(a) <= pivot);

  for (const a of [...catNewer, ...catOlder]) {
    if (relatedItems.length < 4) relatedItems.push(a);
    if (!seen.has(a.slug)) {
      seen.add(a.slug);
      nextSlugs.push(a.slug);
    }
  }

  const popSorted = [...popular.data]
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => ts(b) - ts(a));

  for (const a of popSorted) {
    if (!seen.has(a.slug)) {
      seen.add(a.slug);
      nextSlugs.push(a.slug);
    }
  }
  if (relatedItems.length < 4) {
    for (const a of popSorted) {
      if (relatedItems.some((r) => r.id === a.id)) continue;
      relatedItems.push(a);
      if (relatedItems.length >= 4) break;
    }
  }

  const mostRead = popular.data
    .filter((a) => a.id !== article.id)
    .slice(0, 8);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://duzceradikal.com";
  const tipMailto =
    process.env.NEXT_PUBLIC_CORRECTION_EMAIL ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    "duzeltme@duzceradikal.com";

  const jsonLd = buildNewsArticleJsonLd(article, siteUrl);
  const sidebar = await loadArticleSidebarData(mostRead);
  const settings = await getSiteSettings().catch(() => ({} as Record<string, string>));
  const viewCountMinShow = Math.max(
    0,
    Number(settings["content.viewCountMinShow"] || 500) || 500,
  );

  return (
    <div className={styles.shell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={`yh-container ${styles.layout}`}>
        <ArticleStream
          initial={article}
          nextSlugs={nextSlugs.slice(0, 20)}
          siteUrl={siteUrl}
          related={relatedItems}
          tipMailto={tipMailto}
          sidebar={sidebar}
          viewCountMinShow={viewCountMinShow}
        />
      </div>
    </div>
  );
}
