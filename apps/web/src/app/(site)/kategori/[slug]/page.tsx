import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ApiArticle, ApiCategory } from "@yenihaber/shared";
import { publicApi } from "@/lib/api";
import { CategoryArchive } from "@/components/category-archive/category-archive";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await publicApi.categories.getBySlug(slug);
    return {
      title: category.name,
      description:
        category.description ??
        `${category.name} kategorisindeki son haberler — Düzce Radikal`,
    };
  } catch {
    return { title: "Kategori" };
  }
}

/**
 * Tüm kategoriler aynı route — görünüm `pageTemplate` ile seçilir.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 18;

  try {
    const [category, breaking, latest] = await Promise.all([
      publicApi.categories.getBySlug(slug),
      publicApi.articles.breaking().catch(() => [] as ApiArticle[]),
      publicApi.articles.list({ page: 1, limit: 8 }).catch(() => ({
        data: [] as ApiArticle[],
        meta: { page: 1, limit: 8, total: 0, totalPages: 1 },
      })),
    ]);

    const childSlugs = (category.children ?? []).map((c) => c.slug);
    const querySlugs = Array.from(new Set([slug, ...childSlugs]));

    const articles = await publicApi.articles.list({
      categorySlugs: querySlugs.join(","),
      page,
      limit,
    });

    const chips = await buildChips(category);

    return (
      <CategoryArchive
        category={category}
        slug={slug}
        page={page}
        items={articles.data}
        total={articles.meta.total}
        totalPages={articles.meta.totalPages}
        breaking={breaking}
        popular={latest.data}
        chips={chips}
      />
    );
  } catch {
    notFound();
  }
}

async function buildChips(category: ApiCategory) {
  if (category.pageTemplate !== "chips") return [];

  let root = category;
  if (category.parent?.slug) {
    try {
      root = await publicApi.categories.getBySlug(category.parent.slug);
    } catch {
      root = category;
    }
  }

  const kids = root.children ?? [];
  if (!kids.length && !category.parent) return [];

  return [
    { href: `/kategori/${root.slug}`, label: "Tümü" },
    ...kids.map((c) => ({
      href: `/kategori/${c.slug}`,
      label: c.name,
    })),
  ];
}
