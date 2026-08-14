import { prisma } from "../src/index.ts";

async function main() {
  const all = await prisma.article.findMany({
    where: { status: "YAYINDA" },
    select: { id: true, coverImage: true, content: true },
  });
  let real = 0;
  let marka = 0;
  let empty = 0;
  let canFillFromBody = 0;
  for (const a of all) {
    const c = (a.coverImage || "").trim();
    const img = (a.content || "").match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (!c) {
      empty += 1;
      if (img) canFillFromBody += 1;
    } else if (c.includes("marka")) {
      marka += 1;
      if (img && !img.includes("marka")) canFillFromBody += 1;
    } else {
      real += 1;
    }
  }
  console.log(
    JSON.stringify(
      { total: all.length, real, marka, empty, canFillFromBody },
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
  .finally(() => prisma.$disconnect());
