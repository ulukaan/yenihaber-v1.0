/**
 * Marka logosunu kapaktan temizler; site varsayılanını /brand/default-cover.svg yapar.
 * Haberlere logo yazılmaz — mapArticle runtime'da default SVG kullanır.
 */
import { prisma } from "../src/index.ts";

const DEFAULT_COVER = "/brand/default-cover.svg";

function isMarka(url: string | null | undefined): boolean {
  return (url ?? "").toLowerCase().includes("/marka/");
}

async function main() {
  await prisma.setting.upsert({
    where: { key: "content.defaultCoverUrl" },
    create: {
      key: "content.defaultCoverUrl",
      value: DEFAULT_COVER,
      groupName: "content",
    },
    update: { value: DEFAULT_COVER, groupName: "content" },
  });

  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { coverImage: { contains: "marka" } },
        { coverImage169: { contains: "marka" } },
        { coverImage11: { contains: "marka" } },
        { coverImage43: { contains: "marka" } },
      ],
    },
    select: {
      id: true,
      coverImage: true,
      coverImage169: true,
      coverImage11: true,
      coverImage43: true,
      content: true,
    },
  });

  let articlesCleared = 0;
  let filledFromBody = 0;

  for (const row of articles) {
    const bodyImg = (row.content || "").match(
      /<img[^>]+src=["']([^"']+)["']/i,
    )?.[1];
    const fromBody =
      bodyImg &&
      !bodyImg.toLowerCase().includes("/marka/") &&
      !bodyImg.toLowerCase().includes("logo")
        ? bodyImg.trim()
        : null;

    const nextCover = fromBody;
    if (fromBody) filledFromBody += 1;

    await prisma.article.update({
      where: { id: row.id },
      data: {
        coverImage: isMarka(row.coverImage) ? nextCover : row.coverImage,
        coverImage169: isMarka(row.coverImage169)
          ? nextCover
          : row.coverImage169,
        coverImage11: isMarka(row.coverImage11) ? nextCover : row.coverImage11,
        coverImage43: isMarka(row.coverImage43) ? nextCover : row.coverImage43,
        coverAlt: fromBody ? undefined : null,
      },
    });
    articlesCleared += 1;
  }

  const cats = await prisma.category.updateMany({
    where: { defaultCover: { contains: "marka" } },
    data: { defaultCover: DEFAULT_COVER },
  });

  console.log(
    JSON.stringify({
      defaultCover: DEFAULT_COVER,
      articlesCleared,
      filledFromBody,
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
