/**
 * Kendi WordPress sitenizden (duzceradikal.com) haber + kategori taşıma.
 *
 * Kategoriler WP’deki slug/isim ile birebir oluşturulur.
 * Çok kategorili haberlerde en “anlamlı” kategori seçilir.
 *
 *   pnpm --filter @yenihaber/database import:radikal
 *   LIMIT=100 pnpm --filter @yenihaber/database import:radikal
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/yenihaber.db";
  if (!url.startsWith("file:")) return url;
  const raw = url.slice("file:".length);
  if (raw.startsWith("/") || /^[A-Za-z]:/.test(raw)) return url;
  return `file:${resolve(root, "data/yenihaber.db")}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const prisma = new PrismaClient();

const BASE =
  (process.env.BASE_URL ?? "https://duzceradikal.com").replace(/\/$/, "");
const LIMIT = Math.min(
  200,
  Math.max(1, Number(process.env.LIMIT ?? "40") || 40),
);

type WpRendered = { rendered?: string };

type WpPost = {
  id: number;
  slug: string;
  date: string;
  title?: WpRendered;
  content?: WpRendered;
  excerpt?: WpRendered;
  categories?: number[];
  sticky?: boolean;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: { sizes?: Record<string, { source_url?: string }> };
    }>;
  };
};

type WpCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  description?: string;
};

/** Kategori önceliği — çoklu etiketlerde en doğru ana kategori */
const PRIORITY: Record<string, number> = {
  ekonomi: 100,
  spor: 100,
  saglik: 100,
  dunya: 100,
  teknoloji: 95,
  magazin: 90,
  siyaset: 92,
  "siyasi-partiler": 55,
  gundem: 85,
  turkiye: 80,
  duzce: 78,
  akcakoca: 76,
  cilimli: 76,
  cumayeri: 76,
  yigilca: 76,
  kaynasli: 76,
  beykoy: 76,
  golyaka: 76,
  gumusova: 76,
  bolu: 70,
  "foto-galeri": 40,
  "anahtar-parti": 65,
  "cumhuriyet-halk-partisi": 65,
  "adalet-ve-kalkinma-partisi": 65,
  "zafer-partisi": 65,
  "duzce-belediyesi": 60,
  "duzce-valiligi": 60,
  "duzce-ticaret-ve-sanayi-odasi": 60,
  "bolge-kategorileri": 30,
  genel: 20,
};

/** Bozuk / gereksiz WP kategorileri */
const SKIP_SLUGS = new Set([
  "uncategorized",
  "kategorisiz",
  "duzce-tarim-ve-orman-mudurlugu-yorum-yap-ad-veya-rumuz",
]);

/** Nav’da görünsün diye ana sıralama (bilinenler önce) */
const SORT_HINT: Record<string, number> = {
  gundem: 1,
  duzce: 2,
  ekonomi: 3,
  spor: 4,
  saglik: 5,
  dunya: 6,
  turkiye: 7,
  siyaset: 8,
  "siyasi-partiler": 9,
  teknoloji: 10,
  magazin: 11,
};

function decodeEntities(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFrom(html: string, max = 220): string {
  const t = stripTags(html);
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function cleanCategoryName(name: string): string {
  let n = decodeEntities(name).trim();
  // "Bölge Habeleri" yazım hatası
  if (/habeleri/i.test(n)) n = n.replace(/habeleri/i, "Haberleri");
  // Form artığı isimler
  n = n.replace(/\s*Yorum Yap.*$/i, "").trim();
  return n || name;
}

function isSkipped(slug: string, name: string): boolean {
  if (SKIP_SLUGS.has(slug)) return true;
  if (/yorum\s*yap/i.test(name)) return true;
  if (slug.includes("yorum-yap")) return true;
  return false;
}

function scoreCategory(c: WpCategory): number {
  if (isSkipped(c.slug, c.name)) return -Infinity;
  const base = PRIORITY[c.slug] ?? 50;
  // Daha spesifik / parent’ı olan biraz yüksek
  const parentBoost = c.parent > 0 ? 3 : 0;
  // Yoğun kullanılan hafif tercih
  const countBoost = Math.min(5, Math.floor((c.count || 0) / 10));
  return base + parentBoost + countBoost;
}

/** Habere atanacak ana WP kategorisi (slug) */
function pickPostCategory(
  catIds: number[],
  byId: Map<number, WpCategory>,
): WpCategory | null {
  const candidates = catIds
    .map((id) => byId.get(id))
    .filter((c): c is WpCategory => Boolean(c))
    .filter((c) => !isSkipped(c.slug, c.name));

  if (!candidates.length) return null;

  candidates.sort((a, b) => scoreCategory(b) - scoreCategory(a));
  return candidates[0] ?? null;
}

function coverOf(post: WpPost): string | null {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;
  const sizes = media.media_details?.sizes;
  return (
    sizes?.large?.source_url ||
    sizes?.medium_large?.source_url ||
    sizes?.full?.source_url ||
    media.source_url ||
    null
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "YenihaberImport/1.0 (site migration)",
    },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

async function fetchAllCategories(): Promise<Map<number, WpCategory>> {
  const map = new Map<number, WpCategory>();
  let page = 1;
  while (page <= 10) {
    const batch = await fetchJson<WpCategory[]>(
      `${BASE}/wp-json/wp/v2/categories?per_page=100&page=${page}`,
    );
    if (!batch.length) break;
    for (const c of batch) map.set(c.id, c);
    if (batch.length < 100) break;
    page += 1;
  }
  return map;
}

async function fetchPosts(limit: number): Promise<WpPost[]> {
  const out: WpPost[] = [];
  let page = 1;
  const perPage = Math.min(20, limit);
  while (out.length < limit) {
    const batch = await fetchJson<WpPost[]>(
      `${BASE}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed=1&status=publish&orderby=date&order=desc`,
    );
    if (!batch.length) break;
    out.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return out.slice(0, limit);
}

async function ensureAuthor() {
  const existing =
    (await prisma.user.findFirst({
      where: { OR: [{ slug: "bas-editor" }, { role: "EDITOR" }] },
    })) ?? (await prisma.user.findFirst({ where: { role: "ADMIN" } }));
  if (existing) return existing;

  return prisma.user.create({
    data: {
      name: "Haber Merkezi",
      email: "haber@yenihaber.local",
      password: "$2a$10$placeholderplaceholderplaceholderpl",
      role: "EDITOR",
      slug: "haber-merkezi",
      title: "Haber Merkezi",
    },
  });
}

/**
 * WP kategorilerini birebir upsert eder (+ yedek gundem).
 */
async function syncCategories(wpCats: Map<number, WpCategory>) {
  // Temel yedek
  await prisma.category.upsert({
    where: { slug: "gundem" },
    create: {
      name: "Gündem",
      slug: "gundem",
      sortOrder: 1,
      description: "Gündem haberleri",
    },
    update: {},
  });

  const list = [...wpCats.values()]
    .filter((c) => !isSkipped(c.slug, c.name))
    .filter((c) => (c.count ?? 0) > 0 || PRIORITY[c.slug] !== undefined);

  // sortOrder: bilinenler önce, sonra ada göre
  list.sort((a, b) => {
    const sa = SORT_HINT[a.slug] ?? 50 + a.slug.localeCompare(b.slug, "tr");
    const sb = SORT_HINT[b.slug] ?? 50;
    if (SORT_HINT[a.slug] !== undefined || SORT_HINT[b.slug] !== undefined) {
      return (SORT_HINT[a.slug] ?? 100) - (SORT_HINT[b.slug] ?? 100);
    }
    return a.name.localeCompare(b.name, "tr");
  });

  let order = 10;
  for (const c of list) {
    const name = cleanCategoryName(c.name);
    const sortOrder = SORT_HINT[c.slug] ?? order++;
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name,
        slug: c.slug,
        sortOrder,
        description: c.description
          ? stripTags(c.description).slice(0, 200)
          : null,
      },
      update: {
        name,
        sortOrder,
      },
    });
  }

  // Homepage çekirdek kategorileri yoksa ekle (boş da olsa nav tutarlı)
  const cores = [
    { slug: "ekonomi", name: "Ekonomi", sortOrder: 3 },
    { slug: "spor", name: "Spor", sortOrder: 4 },
    { slug: "saglik", name: "Sağlık", sortOrder: 5 },
    { slug: "dunya", name: "Dünya", sortOrder: 6 },
    { slug: "teknoloji", name: "Teknoloji", sortOrder: 15 },
  ];
  for (const c of cores) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, description: null },
      update: { name: c.name },
    });
  }

  const all = await prisma.category.findMany();
  return new Map(all.map((c) => [c.slug, c]));
}

async function main() {
  console.log(`\n→ ${BASE} / son ${LIMIT} haber + kategoriler…\n`);

  const [wpCats, posts, author] = await Promise.all([
    fetchAllCategories(),
    fetchPosts(LIMIT),
    ensureAuthor(),
  ]);

  const catMap = await syncCategories(wpCats);
  console.log(`Kategori senkron: ${catMap.size} adet\n`);

  if (!posts.length) {
    console.error("WordPress’ten haber gelmedi.");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const catHit = new Map<string, number>();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]!;
    const title = decodeEntities(post.title?.rendered ?? "").trim();
    const content = post.content?.rendered?.trim() ?? "";
    const excerpt =
      excerptFrom(post.excerpt?.rendered ?? "") || excerptFrom(content);
    if (!title || !content) {
      skipped += 1;
      continue;
    }

    const picked = pickPostCategory(post.categories ?? [], wpCats);
    const catSlug = picked?.slug ?? "gundem";
    const category = catMap.get(catSlug) ?? catMap.get("gundem");
    if (!category) {
      skipped += 1;
      continue;
    }

    catHit.set(category.slug, (catHit.get(category.slug) ?? 0) + 1);

    const coverImage = coverOf(post);
    const publishedAt = post.date ? new Date(post.date) : new Date();
    const featured = Boolean(post.sticky) || i < 5;
    const mansetOrder = i < 5 ? i + 1 : 0;
    const isSideManset = i >= 5 && i < 10;
    const sideOrder = isSideManset ? i - 4 : 0;

    const data = {
      title,
      excerpt,
      content,
      coverImage,
      status: "YAYINDA",
      isBreaking: i < 2,
      isFeatured: featured,
      mansetOrder,
      isSideManset,
      sideOrder,
      sourceAgency: null as string | null,
      publishedAt,
      metaTitle: title,
      metaDescription: excerpt.slice(0, 160),
      categoryId: category.id,
      authorId: author.id,
    };

    const existing = await prisma.article.findUnique({
      where: { slug: post.slug },
    });

    if (existing) {
      await prisma.article.update({ where: { slug: post.slug }, data });
      updated += 1;
      console.log(`  ~ [${category.slug}] ${post.slug}`);
    } else {
      await prisma.article.create({ data: { slug: post.slug, ...data } });
      created += 1;
      console.log(`  + [${category.slug}] ${post.slug}`);
    }
  }

  console.log("\nKategori dağılımı:");
  for (const [slug, n] of [...catHit.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${slug}: ${n}`);
  }

  console.log(
    `\nBitti: +${created} yeni, ~${updated} güncellenen, −${skipped} atlanan.\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
