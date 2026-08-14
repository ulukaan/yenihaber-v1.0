/**
 * Manşet: sayıyı 12 yap + isFeatured haberleri live/draft slotlara doldur
 */
import { PrismaClient } from "@prisma/client";
import {
  MANSET_HOME_SLOT_COUNT,
  MANSET_SETTINGS_KEY,
  MansetSettingsSchema,
  emptyMansetSlots,
} from "@yenihaber/shared";

const prisma = new PrismaClient();
const TARGET = 12;

async function main() {
  const featured = await prisma.article.findMany({
    where: { status: "YAYINDA", isFeatured: true },
    orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
    select: { id: true, title: true, mansetOrder: true },
  });
  console.log("isFeatured count:", featured.length);

  await prisma.setting.upsert({
    where: { key: "content.homeMansetCount" },
    create: {
      key: "content.homeMansetCount",
      value: String(TARGET),
      groupName: "content",
    },
    update: { value: String(TARGET), groupName: "content" },
  });

  const row = await prisma.setting.findUnique({
    where: { key: MANSET_SETTINGS_KEY },
  });
  let settings = MansetSettingsSchema.parse(
    row?.value ? JSON.parse(row.value) : {},
  );
  settings = MansetSettingsSchema.parse({
    ...settings,
    desktopLimit: TARGET,
    mainLimit: TARGET,
  });
  await prisma.setting.upsert({
    where: { key: MANSET_SETTINGS_KEY },
    create: {
      key: MANSET_SETTINGS_KEY,
      value: JSON.stringify(settings),
      groupName: "content",
    },
    update: { value: JSON.stringify(settings), groupName: "content" },
  });

  const count = MANSET_HOME_SLOT_COUNT;
  const base = emptyMansetSlots(count);
  const take = Math.min(TARGET, featured.length, count);
  const slots = base.map((s) => {
    if (s.slot <= take) {
      const art = featured[s.slot - 1];
      return { ...s, articleId: art?.id ?? null };
    }
    return { ...s, articleId: null };
  });

  for (const status of ["draft", "live"] as const) {
    await prisma.frontLayout.upsert({
      where: { kind_status: { kind: "home", status } },
      create: {
        kind: "home",
        status,
        slotsJson: JSON.stringify(slots),
      },
      update: { slotsJson: JSON.stringify(slots) },
    });
  }

  // mansetOrder = slot sırası
  for (let i = 0; i < take; i++) {
    const art = featured[i]!;
    await prisma.article.update({
      where: { id: art.id },
      data: { mansetOrder: i + 1, isFeatured: true },
    });
  }

  console.log(
    JSON.stringify(
      {
        desktopLimit: TARGET,
        slotsFilled: take,
        titles: featured.slice(0, take).map((a) => a.title),
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
