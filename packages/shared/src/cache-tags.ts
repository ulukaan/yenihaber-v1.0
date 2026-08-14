/**
 * Site önbellek etiketleri — panel/API revalidate ile birebir aynı olmalı.
 * Legacy takma adlar `expandCacheTags` ile birlikte temizlenir.
 */
export const CacheTags = {
  anasayfa: "anasayfa",
  seritler: "seritler",
  manset: "manset",
  menu: "menu",
  ayarlar: "ayarlar",
  reklam: "reklam",
  hikaye: "hikaye",
  ilanlar: "ilanlar",
  kategori: (slug: string) => `kategori:${slug}` as const,
  haber: (idOrSlug: string) => `haber:${idOrSlug}` as const,
} as const;

/** Eski isimler → yeni şema (geçiş) */
const TAG_ALIASES: Record<string, string[]> = {
  anasayfa: ["anasayfa", "home"],
  home: ["anasayfa", "home"],
  seritler: ["seritler"],
  manset: ["manset"],
  menu: ["menu"],
  ayarlar: ["ayarlar", "settings"],
  settings: ["ayarlar", "settings"],
  reklam: ["reklam", "ads"],
  ads: ["reklam", "ads"],
  hikaye: ["hikaye", "stories"],
  stories: ["hikaye", "stories"],
  ilanlar: ["ilanlar", "listings"],
  listings: ["ilanlar", "listings"],
  articles: ["articles"],
  categories: ["categories", "seritler"],
};

/**
 * Tek etiket + legacy eşlerini genişletir.
 * `kategori:x` ↔ `cat:x`, `haber:x` ↔ `article:x`
 */
export function expandCacheTags(tags: string[]): string[] {
  const out = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim();
    if (!t) continue;
    out.add(t);
    const mapped = TAG_ALIASES[t];
    if (mapped) for (const m of mapped) out.add(m);

    if (t.startsWith("kategori:")) {
      out.add(`cat:${t.slice("kategori:".length)}`);
    } else if (t.startsWith("cat:")) {
      out.add(`kategori:${t.slice("cat:".length)}`);
    } else if (t.startsWith("haber:")) {
      const id = t.slice("haber:".length);
      out.add(`article:${id}`);
      out.add(`articles`);
    } else if (t.startsWith("article:")) {
      out.add(`haber:${t.slice("article:".length)}`);
      out.add(`articles`);
    }
  }
  return [...out];
}
