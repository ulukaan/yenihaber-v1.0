/**
 * Kapaksız haberlere site varsayılanı yazılmaz; marka logosu temizlenir.
 * mapArticle runtime'da /brand/default-cover.svg kullanır.
 */
import { prisma } from "../src/index.ts";

const DEFAULT_COVER = "/brand/default-cover.svg";

function isMarka(url: string): boolean {
  return url.toLowerCase().includes("/marka/");
}

async function main() {
  const setting = await prisma.setting.findUnique({
    where: { key: "content.defaultCoverUrl" },
  });
  let cover = (setting?.value ?? "").trim() || DEFAULT_COVER;
  if (isMarka(cover)) cover = DEFAULT_COVER;

  await prisma.setting.upsert({
    where: { key: "content.defaultCoverUrl" },
    create: {
      key: "content.defaultCoverUrl",
      value: cover,
      groupName: "content",
    },
    update: { value: cover, groupName: "content" },
  });

  const markaArticles = await prisma.article.findMany({
    where: {
      OR: [
        { coverImage: { contains: "marka" } },
        { coverImage169: { contains: "marka" } },
        { coverImage11: { contains: "marka" } },
      ],
    },
    select: { id: true },
  });

  let articlesCleared = 0;
  for (const row of markaArticles) {
    await prisma.article.update({
      where: { id: row.id },
      data: {
        coverImage: null,
        coverImage169: null,
        coverImage11: null,
      },
    });
    articlesCleared += 1;
  }

  const cats = await prisma.category.updateMany({
    where: {
      OR: [
        { defaultCover: null },
        { defaultCover: "" },
        { defaultCover: { contains: "marka" } },
      ],
    },
    data: { defaultCover: cover },
  });

  console.log(
    JSON.stringify({
      cover,
      articlesCleared,
      categoriesUpdated: cats.count,
    }),
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
