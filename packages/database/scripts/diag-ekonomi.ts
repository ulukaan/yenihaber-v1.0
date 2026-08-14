import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function j(v: unknown) {
  return JSON.stringify(
    v,
    (_k, val) => (typeof val === "bigint" ? Number(val) : val),
    2,
  );
}

async function main() {
  const now = new Date();
  console.log("=== NOW (JS) ===", now.toISOString(), "|", now.toString());

  const cats = await prisma.category.findMany({
    where: {
      OR: [
        { slug: { contains: "ekonomi" } },
        { name: { contains: "Ekonomi" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      bucket: true,
      parentId: true,
    },
  });
  console.log("=== EKONOMI CATS ===");
  console.log(j(cats));

  const qPublished = await prisma.$queryRawUnsafe(
    `SELECT a.id, a.title
     FROM Article a
     JOIN Category c ON c.id = a.categoryId
     WHERE c.slug = 'ekonomi'
       AND a.status = 'published'
       AND a.publishedAt <= datetime('now')
     ORDER BY a.publishedAt DESC
     LIMIT 10`,
  );
  console.log("=== A) USER SQL status=published ===", j(qPublished));

  const qYayindaDirect = await prisma.$queryRawUnsafe(
    `SELECT a.id, a.title, a.status, a.publishedAt,
            CASE WHEN a.publishedAt IS NULL OR a.publishedAt <= datetime('now') THEN 1 ELSE 0 END AS gorunur_mu
     FROM Article a
     JOIN Category c ON c.id = a.categoryId
     WHERE c.slug = 'ekonomi'
       AND a.status = 'YAYINDA'
     ORDER BY a.publishedAt DESC
     LIMIT 10`,
  );
  console.log("=== B) Direct slug=ekonomi AND YAYINDA ===");
  console.log(j(qYayindaDirect));

  const qAnyStatus = await prisma.$queryRawUnsafe(
    `SELECT a.id, a.title, a.status, a.publishedAt, c.slug
     FROM Article a
     JOIN Category c ON c.id = a.categoryId
     WHERE c.slug = 'ekonomi'
     ORDER BY a.publishedAt DESC
     LIMIT 20`,
  );
  console.log("=== C) slug=ekonomi ANY status ===");
  console.log(j(qAnyStatus));

  const children = await prisma.$queryRawUnsafe(
    `SELECT id, name, slug, parentId, bucket
     FROM Category
     WHERE slug = 'ekonomi'
        OR parentId IN (SELECT id FROM Category WHERE slug = 'ekonomi')`,
  );
  console.log("=== D) EKONOMI + CHILDREN ===");
  console.log(j(children));

  const treeArts = await prisma.$queryRawUnsafe(
    `SELECT a.id, a.title, a.status, a.publishedAt, c.slug AS cat_slug
     FROM Article a
     JOIN Category c ON c.id = a.categoryId
     WHERE c.slug = 'ekonomi'
        OR c.parentId IN (SELECT id FROM Category WHERE slug = 'ekonomi')
     ORDER BY datetime(a.publishedAt) DESC`,
  );
  console.log("=== E) TREE ARTICLES (API child include) ===");
  console.log(j(treeArts));

  const tz = await prisma.$queryRawUnsafe(
    `SELECT id, title, publishedAt,
            datetime('now') AS now_utc,
            datetime('now','localtime') AS now_local,
            CASE
              WHEN publishedAt IS NULL THEN 'null'
              WHEN publishedAt <= datetime('now') THEN 'ok_utc'
              ELSE 'future_utc'
            END AS vs_utc
     FROM Article
     WHERE status = 'YAYINDA'
     ORDER BY datetime(publishedAt) DESC
     LIMIT 5`,
  );
  console.log("=== F) TZ sample (latest YAYINDA) ===");
  console.log(j(tz));

  const statusCounts = await prisma.$queryRawUnsafe(
    `SELECT status, COUNT(*) AS n FROM Article GROUP BY status`,
  );
  console.log("=== G) STATUS COUNTS ===", j(statusCounts));

  const byCat = await prisma.$queryRawUnsafe(
    `SELECT c.slug, c.name, c.bucket, COUNT(a.id) AS n
     FROM Category c
     LEFT JOIN Article a ON a.categoryId = c.id AND a.status = 'YAYINDA'
     GROUP BY c.id
     HAVING n > 0
     ORDER BY n DESC
     LIMIT 20`,
  );
  console.log("=== H) YAYINDA per category ===");
  console.log(j(byCat));

  const apiShape = await prisma.article.findMany({
    where: {
      status: "YAYINDA",
      category: {
        OR: [{ slug: "ekonomi" }, { parent: { slug: "ekonomi" } }],
      },
    },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });
  console.log("=== I) API-EQUIV Prisma ===");
  console.log(j(apiShape));

  // Petrol başlığı ekonomi mi?
  const petrol = await prisma.article.findMany({
    where: { title: { contains: "petrol" } },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      category: { select: { id: true, slug: true, name: true, bucket: true } },
    },
  });
  console.log("=== J) title LIKE petrol ===");
  console.log(j(petrol));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
