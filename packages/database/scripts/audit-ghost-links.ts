import { prisma } from "../src/index.ts";

async function main() {
  const ghostMenu = await prisma.$queryRaw<
    { id: string; label: string | null; refId: string | null }[]
  >`
    SELECT mi.id, mi.label, mi.refId FROM MenuItem mi
    LEFT JOIN Category c ON c.id = mi.refId
    WHERE mi.type = 'category' AND c.id IS NULL
  `;
  const ghostHome = await prisma.$queryRaw<
    { id: string; name: string }[]
  >`
    SELECT c.id, c.name FROM Category c
    WHERE c.onHome = 1 AND c.status != 'aktif'
  `;
  const ghostAuthor = await prisma.$queryRaw<
    { id: string; title: string }[]
  >`
    SELECT a.id, a.title FROM Article a
    LEFT JOIN Author au ON au.id = a.authorId
    WHERE au.id IS NULL
  `;
  const expiredAds = await prisma.$queryRaw<
    { id: string; name: string; endAt: Date | null }[]
  >`
    SELECT id, name, endAt FROM Ad
    WHERE status = 'active' AND endAt IS NOT NULL AND endAt < datetime('now')
  `;
  const noCover = await prisma.$queryRaw<
    { id: string; title: string }[]
  >`
    SELECT id, title FROM Article
    WHERE status = 'YAYINDA' AND (coverImage IS NULL OR coverImage = '')
  `;
  const redirects = await prisma.redirect.count();
  const published = await prisma.article.count({ where: { status: "YAYINDA" } });

  console.log(
    JSON.stringify(
      {
        ghostMenu: ghostMenu.length,
        ghostMenuRows: ghostMenu.slice(0, 5),
        ghostHome: ghostHome.length,
        ghostAuthor: ghostAuthor.length,
        expiredAds: expiredAds.length,
        expiredAdRows: expiredAds.slice(0, 5),
        noCoverPublished: noCover.length,
        noCoverRows: noCover.slice(0, 5),
        redirectCount: redirects,
        publishedArticles: published,
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
  .finally(() => prisma.$disconnect());
