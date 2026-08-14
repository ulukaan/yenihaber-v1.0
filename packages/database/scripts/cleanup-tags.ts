/**
 * 12 aydır kullanılmamış + 2'den az haberi olan etiketleri temizle.
 * Kullanım: pnpm exec tsx scripts/cleanup-tags.ts
 * (Ayda bir cron ile de POST /tags/cleanup — ADMIN)
 */
import { prisma } from "../src/index.js";

const MONTHS = Number(process.env.TAG_CLEANUP_MONTHS ?? 12);

async function main() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS);

  const candidates = await prisma.tag.findMany({
    where: {
      isFeatured: false,
      OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: cutoff } }],
    },
    include: { _count: { select: { articles: true } } },
  });

  const toDelete = candidates.filter((t) => t._count.articles < 2);
  console.log(
    `Aday: ${candidates.length}, silinecek (<2 haber + ${MONTHS} ay): ${toDelete.length}`,
  );

  for (const t of toDelete) {
    await prisma.$transaction(async (tx) => {
      await tx.articleTag.deleteMany({ where: { tagId: t.id } });
      const from = `/etiket/${t.slug}`;
      await tx.redirect.upsert({
        where: { fromPath: from },
        create: { fromPath: from, toPath: "/", code: 301 },
        update: { toPath: "/", code: 301 },
      });
      await tx.tag.delete({ where: { id: t.id } });
    });
    console.log(`  silindi: ${t.name} (${t.slug})`);
  }

  await prisma.auditLog.create({
    data: {
      action: "tag.cleanup",
      entityType: "tag",
      meta: JSON.stringify({
        months: MONTHS,
        deleted: toDelete.map((t) => ({
          id: t.id,
          slug: t.slug,
          articles: t._count.articles,
        })),
      }),
    },
  });

  console.log("Tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
