import {
  TAG_INDEX_MIN,
  isTagBlacklisted,
  normalizeTagName,
  tagIsIndexable,
  tagSlugFromName,
  type ApiTag,
} from "@yenihaber/shared";

export type TagRow = {
  id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  lastUsedAt?: Date | null;
  status?: string;
  _count?: { articles?: number };
};

export function pathForTagSlug(slug: string) {
  return `/etiket/${slug}`;
}

export function mapTag(t: TagRow): ApiTag {
  const articleCount = t._count?.articles ?? 0;
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    isFeatured: t.isFeatured ?? false,
    featuredOrder: t.featuredOrder ?? 0,
    lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
    status: (t.status === "pasif" ? "pasif" : "aktif") as "aktif" | "pasif",
    articleCount,
    indexable: tagIsIndexable(articleCount),
  };
}

export function prepareTagName(raw: string): { name: string; slug: string } {
  const name = normalizeTagName(raw);
  if (name.length < 2) {
    throw new Error("Etiket en az 2 karakter");
  }
  if (isTagBlacklisted(name)) {
    throw new Error(`«${raw}» kara listede — özel isim kullanın`);
  }
  const slug = tagSlugFromName(name);
  if (!slug) throw new Error("Geçersiz etiket");
  return { name, slug };
}

export { TAG_INDEX_MIN };
