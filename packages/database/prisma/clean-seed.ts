/**
 * Seed demo verilerini siler; WordPress / gerçek import verileri kalır.
 *   pnpm --filter @yenihaber/database clean:seed
 */
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
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

/** seed.ts içindeki demo haber slug’ları */
const SEED_ARTICLE_SLUGS = [
  "duzce-de-yeni-donem-guven-ve-seffafik",
  "fiyatlar-faiz-ve-esnafin-sabri",
  "gundemin-golgesinde-kalan-mahalle-sesi",
  "kulturu-luks-degil-kamu-hizmeti-saymak",
  "sehir-merkezinde-yeni-yesil-alan-projesi",
  "otogar-cevresinde-trafik-duzenlemesi",
  "universitede-inovasyon-gunleri",
  "derbi-oncesi-antrenmanlar-yogun-tempoda",
  "basketbol-liginde-play-off-tablosu",
  "genc-atletler-bolge-sampiyonasi",
  "merkez-bankasi-faiz-kararini-acikladi",
  "esnaf-destek-paketinin-detaylari",
  "konut-fiyatlarinda-yaz-donemi",
  "uluslararasi-zirvede-iklim-maddesi",
  "sinir-otesi-ticaret-koridoru",
  "goc-politikalari-zirvesi",
  "yapay-zeka-destekli-haber-ozetleme",
  "elektronik-atik-geri-donusum",
  "5g-kapsami-sanayi-bolgesi",
  "mevsimsel-hastaliklar-icin-erken-uyari",
  "yuruyus-ve-bisiklet-parkurlari",
  "aile-hekimligi-randevu-sistemi",
];

const SEED_COLUMNIST_SLUGS = [
  "ahmet-yilmaz",
  "ayse-demir",
  "mehmet-kaya",
  "selin-aras",
];

async function main() {
  console.log("Seed demo verileri temizleniyor…\n");

  const seedArticles = await prisma.article.findMany({
    where: {
      OR: [
        { slug: { in: SEED_ARTICLE_SLUGS } },
        { coverImage: { contains: "picsum.photos" } },
        {
          author: {
            slug: { in: SEED_COLUMNIST_SLUGS },
          },
        },
      ],
    },
    select: { id: true, slug: true },
  });

  const ids = seedArticles.map((a) => a.id);

  if (ids.length) {
    await prisma.comment.deleteMany({ where: { articleId: { in: ids } } });
    await prisma.articleTag.deleteMany({
      where: { articleId: { in: ids } },
    });
    const del = await prisma.article.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`Haber silindi: ${del.count}`);
    for (const a of seedArticles) console.log(`  - ${a.slug}`);
  } else {
    console.log("Silinecek seed haber yok.");
  }

  // Sahipsiz etiketler
  const orphanTags = await prisma.tag.findMany({
    where: { articles: { none: {} } },
    select: { id: true, slug: true },
  });
  if (orphanTags.length) {
    await prisma.tag.deleteMany({
      where: { id: { in: orphanTags.map((t) => t.id) } },
    });
    console.log(`Boş etiket silindi: ${orphanTags.length}`);
  }

  // Demo köşe yazarları (makalesi kalmadıysa)
  const colDel = await prisma.user.deleteMany({
    where: {
      slug: { in: SEED_COLUMNIST_SLUGS },
      articles: { none: {} },
    },
  });
  console.log(`Demo yazar silindi: ${colDel.count}`);

  // Seed’den kalan, hiç haberi olmayan ekstra çekirdek kategoriler dışındakiler kalır
  // (WP import kategorileri dokunulmaz)

  const remaining = await prisma.article.count();
  const users = await prisma.user.count();
  const cats = await prisma.category.count();
  console.log(
    `\nKalan: ${remaining} haber, ${users} kullanıcı, ${cats} kategori.\n`,
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
