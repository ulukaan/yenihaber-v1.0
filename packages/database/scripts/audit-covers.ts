import { prisma } from "../src/index.ts";

async function main() {
  const setting = await prisma.setting.findUnique({
    where: { key: "content.defaultCoverUrl" },
  });
  const marka = await prisma.article.findMany({
    where: {
      OR: [
        { coverImage: { contains: "marka" } },
        { coverImage169: { contains: "marka" } },
        { coverImage11: { contains: "marka" } },
      ],
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
      content: true,
      status: true,
    },
  });
  let withBodyImg = 0;
  const bodySrcs: string[] = [];
  for (const a of marka) {
    const m = (a.content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m?.[1]) {
      withBodyImg += 1;
      if (bodySrcs.length < 5) bodySrcs.push(m[1]);
    }
  }
  const cats = await prisma.category.count({
    where: { defaultCover: { contains: "marka" } },
  });
  console.log(
    JSON.stringify(
      {
        defaultCoverSetting: setting?.value ?? null,
        markaCoverArticles: marka.length,
        markaWithBodyImg: withBodyImg,
        catsWithMarkaDefault: cats,
        bodySrcs,
        samples: marka.slice(0, 5).map((a) => ({
          id: a.id,
          title: a.title.slice(0, 50),
          status: a.status,
        })),
      },
      null,
      2,
    ),
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
