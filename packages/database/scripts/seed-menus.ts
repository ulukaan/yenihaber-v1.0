/**
 * Mevcut DEFAULT_MAIN_NAV + footer + ikonları menü tablosuna basar.
 */
import { prisma } from "../src/index.ts";
import {
  DEFAULT_MAIN_NAV,
  MENU_ICON_PRESETS,
} from "@yenihaber/shared";

async function categoryIdBySlug(slug: string) {
  const c = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  return c?.id ?? null;
}

async function ensureMenu(location: string, name: string) {
  return prisma.menu.upsert({
    where: { location },
    create: { location, name },
    update: { name },
  });
}

async function clearMenu(menuId: string) {
  await prisma.menuItem.deleteMany({ where: { menuId } });
}

async function main() {
  const header = await ensureMenu("header", "Üst menü");
  const footer = await ensureMenu("footer", "Footer");
  const sidebar = await ensureMenu("sidebar", "Yan menü");
  const icons = await ensureMenu("icons", "İkonlar");

  await clearMenu(header.id);
  await clearMenu(footer.id);
  await clearMenu(sidebar.id);
  await clearMenu(icons.id);

  // —— Header from DEFAULT_MAIN_NAV ——
  let order = 0;
  for (const item of DEFAULT_MAIN_NAV) {
    const slug = item.href.replace(/^\/kategori\//, "");
    const isCat = item.href.startsWith("/kategori/");
    const isPage = !isCat;
    let type = isCat ? "category" : "page";
    let refId: string | null = null;
    let url: string | null = null;

    if (isCat) {
      refId = await categoryIdBySlug(slug);
      if (!refId) {
        type = "link";
        url = item.href;
      }
    } else if (item.href === "/son-dakika") {
      type = "page";
      refId = "son-dakika";
    } else if (item.href === "/yazarlar") {
      type = "page";
      refId = "yazarlar";
    } else {
      type = "link";
      url = item.href;
    }

    const root = await prisma.menuItem.create({
      data: {
        menuId: header.id,
        sortOrder: order++,
        type,
        refId,
        url,
        label: null,
        badgeText: item.accent ? "Canlı" : null,
        badgeColor: item.accent ? "#E10600" : null,
        dropdownType:
          item.children && item.children.length > 6 ? "mega" : "simple",
        isActive: true,
        device: "all",
      },
    });

    let cOrder = 0;
    for (const ch of item.children ?? []) {
      const cSlug = ch.href.replace(/^\/kategori\//, "");
      let cRef = await categoryIdBySlug(cSlug);
      let cType = "category";
      let cUrl: string | null = null;
      if (!cRef) {
        cType = "link";
        cUrl = ch.href;
      }
      await prisma.menuItem.create({
        data: {
          menuId: header.id,
          parentId: root.id,
          sortOrder: cOrder++,
          type: cType,
          refId: cRef,
          url: cUrl,
          label: ch.label !== undefined ? ch.label : null,
          isActive: true,
        },
      });
    }
  }

  // —— Sidebar: header kopyası + ekstra ——
  const headerItems = await prisma.menuItem.findMany({
    where: { menuId: header.id, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });
  let sOrder = 0;
  const home = await prisma.menuItem.create({
    data: {
      menuId: sidebar.id,
      sortOrder: sOrder++,
      type: "page",
      refId: "anasayfa",
      isActive: true,
    },
  });
  void home;
  for (const root of headerItems) {
    const created = await prisma.menuItem.create({
      data: {
        menuId: sidebar.id,
        sortOrder: sOrder++,
        type: root.type,
        refId: root.refId,
        url: root.url,
        label: root.label,
        badgeText: root.badgeText,
        badgeColor: root.badgeColor,
        dropdownType: root.dropdownType,
        isActive: root.isActive,
      },
    });
    let cOrder = 0;
    for (const ch of root.children) {
      await prisma.menuItem.create({
        data: {
          menuId: sidebar.id,
          parentId: created.id,
          sortOrder: cOrder++,
          type: ch.type,
          refId: ch.refId,
          url: ch.url,
          label: ch.label,
          isActive: ch.isActive,
        },
      });
    }
  }
  for (const extra of [
    { type: "page", refId: "ara" },
    { type: "page", refId: "servis" },
    { type: "page", refId: "iletisim" },
    { type: "page", refId: "giris" },
  ] as const) {
    await prisma.menuItem.create({
      data: {
        menuId: sidebar.id,
        sortOrder: sOrder++,
        type: extra.type,
        refId: extra.refId,
        isActive: true,
      },
    });
  }

  // —— Footer ——
  let f = 0;
  const bolumler = await prisma.menuItem.create({
    data: {
      menuId: footer.id,
      sortOrder: f++,
      type: "heading",
      label: "Bölümler",
      isActive: true,
    },
  });
  void bolumler;
  for (const slug of [
    "gundem",
    "duzce",
    "ekonomi",
    "spor",
    "saglik",
    "dunya",
    "siyaset",
  ]) {
    const id = await categoryIdBySlug(slug);
    await prisma.menuItem.create({
      data: {
        menuId: footer.id,
        sortOrder: f++,
        type: id ? "category" : "link",
        refId: id,
        url: id ? null : `/kategori/${slug}`,
        isActive: true,
      },
    });
  }
  await prisma.menuItem.create({
    data: {
      menuId: footer.id,
      sortOrder: f++,
      type: "heading",
      label: "Kurumsal",
      isActive: true,
    },
  });
  for (const pageId of [
    "kunye",
    "iletisim",
    "kvkk",
    "gizlilik",
    "reklam",
    "secim",
    "anketler",
  ]) {
    await prisma.menuItem.create({
      data: {
        menuId: footer.id,
        sortOrder: f++,
        type: "page",
        refId: pageId,
        isActive: true,
      },
    });
  }

  // —— Icons ——
  let i = 0;
  for (const preset of MENU_ICON_PRESETS) {
    await prisma.menuItem.create({
      data: {
        menuId: icons.id,
        sortOrder: i++,
        type: "icon",
        refId: preset.id,
        icon: preset.icon,
        label: null,
        isActive: ["search", "weather", "prayer", "theme", "social"].includes(
          preset.id,
        ),
      },
    });
  }

  console.log(
    JSON.stringify({
      ok: true,
      header: await prisma.menuItem.count({ where: { menuId: header.id } }),
      footer: await prisma.menuItem.count({ where: { menuId: footer.id } }),
      sidebar: await prisma.menuItem.count({ where: { menuId: sidebar.id } }),
      icons: await prisma.menuItem.count({ where: { menuId: icons.id } }),
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
