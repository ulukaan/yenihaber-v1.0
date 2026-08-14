import { prisma } from "@yenihaber/database";

/** Europe/Istanbul takvim günü YYYY-MM-DD */
export function bikTodayKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function bumpBikPageviews(n: number) {
  if (n <= 0) return;
  const date = bikTodayKey();
  await prisma.bikDailyStat.upsert({
    where: { date },
    create: { date, pageviews: n, publishedCount: 0 },
    update: { pageviews: { increment: n } },
  });
}

export async function bumpBikPublished(n = 1) {
  if (n <= 0) return;
  const date = bikTodayKey();
  await prisma.bikDailyStat.upsert({
    where: { date },
    create: { date, pageviews: 0, publishedCount: n },
    update: { publishedCount: { increment: n } },
  });
}

/** Gün aralığı için yayın sayısını DB'den yeniden hesapla */
export async function reconcileBikPublished(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return;
  // Istanbul gün sınırları ≈ UTC+3
  const start = new Date(Date.UTC(y, m - 1, d, -3, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + 1, -3, 0, 0));
  const publishedCount = await prisma.article.count({
    where: {
      status: "YAYINDA",
      publishedAt: { gte: start, lt: end },
    },
  });
  await prisma.bikDailyStat.upsert({
    where: { date: dateKey },
    create: { date: dateKey, publishedCount, pageviews: 0 },
    update: { publishedCount },
  });
  return publishedCount;
}
