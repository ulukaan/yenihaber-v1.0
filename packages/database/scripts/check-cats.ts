import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const cats = await p.category.findMany({
    orderBy: { sortOrder: "asc" },
    take: 20,
    include: { _count: { select: { articles: true } } },
  });
  console.log(
    "CATEGORIES",
    cats.map((c) => `${c.slug}:${c._count.articles}`).join(" | "),
  );

  const byStatus = await p.article.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("STATUS", byStatus);

  const total = await p.article.count();
  console.log("TOTAL ARTICLES", total);

  const sample = await p.article.findMany({
    take: 8,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(
    "SAMPLES",
    sample.map(
      (a) =>
        `${a.status} | ${a.category.slug} | ${a.title.slice(0, 35)}`,
    ),
  );

  for (const slug of ["gundem", "siyasi-partiler", "duzce", "spor"]) {
    const n = await p.article.count({
      where: { status: "YAYINDA", category: { slug } },
    });
    console.log(`YAYINDA ${slug}:`, n);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
