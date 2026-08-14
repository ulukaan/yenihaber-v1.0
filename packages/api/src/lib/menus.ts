import { prisma } from "@yenihaber/database";
import {
  MENU_ICON_PRESETS,
  MENU_LOCATION_META,
  MENU_STATIC_PAGES,
  isMenuItemScheduledVisible,
  menuStaticPageHref,
  menuStaticPageLabel,
  type ApiMenu,
  type ApiMenuItem,
  type MenuLocation,
} from "@yenihaber/shared";
import { peekDefaultCoverUrl } from "./settings";

type ItemRow = {
  id: string;
  menuId: string;
  parentId: string | null;
  sortOrder: number;
  type: string;
  refId: string | null;
  label: string | null;
  url: string | null;
  icon: string | null;
  badgeText: string | null;
  badgeColor: string | null;
  dropdownType: string;
  targetBlank: boolean;
  device: string;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  children?: ItemRow[];
};

async function resolveLabelAndHref(item: {
  type: string;
  refId: string | null;
  label: string | null;
  url: string | null;
  icon: string | null;
}): Promise<{ resolvedLabel: string; href: string | null }> {
  if (item.type === "heading") {
    return {
      resolvedLabel: item.label?.trim() || "Başlık",
      href: null,
    };
  }
  if (item.type === "link") {
    return {
      resolvedLabel: item.label?.trim() || item.url || "Bağlantı",
      href: item.url || null,
    };
  }
  if (item.type === "page" && item.refId) {
    return {
      resolvedLabel:
        item.label?.trim() ||
        menuStaticPageLabel(item.refId) ||
        item.refId,
      href: menuStaticPageHref(item.refId),
    };
  }
  if (item.type === "category" && item.refId) {
    const cat = await prisma.category.findUnique({
      where: { id: item.refId },
      select: { name: true, slug: true },
    });
    return {
      resolvedLabel: item.label?.trim() || cat?.name || "Kategori",
      href: cat ? `/kategori/${cat.slug}` : null,
    };
  }
  if (item.type === "tag" && item.refId) {
    const tag = await prisma.tag.findUnique({
      where: { id: item.refId },
      select: { name: true, slug: true },
    });
    return {
      resolvedLabel: item.label?.trim() || tag?.name || "Etiket",
      href: tag ? `/etiket/${tag.slug}` : null,
    };
  }
  if (item.type === "icon") {
    const preset = MENU_ICON_PRESETS.find((p) => p.id === item.refId);
    return {
      resolvedLabel: item.label?.trim() || preset?.label || "İkon",
      href: item.url || null,
    };
  }
  return {
    resolvedLabel: item.label?.trim() || "Öğe",
    href: item.url,
  };
}

async function mapItem(
  row: ItemRow & { children?: ItemRow[] },
  opts?: { includeInactive?: boolean; withMega?: boolean },
): Promise<ApiMenuItem | null> {
  const visibleNow = isMenuItemScheduledVisible(row);
  if (!opts?.includeInactive && !visibleNow) return null;

  const { resolvedLabel, href } = await resolveLabelAndHref(row);
  const childrenRaw = (row.children ?? []).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const children: ApiMenuItem[] = [];
  for (const ch of childrenRaw) {
    const mapped = await mapItem(ch as ItemRow & { children?: ItemRow[] }, opts);
    if (mapped) children.push(mapped);
  }

  let megaArticles: ApiMenuItem["megaArticles"];
  if (
    opts?.withMega &&
    row.dropdownType === "mega" &&
    row.type === "category" &&
    row.refId
  ) {
    megaArticles = await loadMegaArticles(row.refId);
  }

  return {
    id: row.id,
    menuId: row.menuId,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    type: row.type as ApiMenuItem["type"],
    refId: row.refId,
    label: row.label,
    resolvedLabel,
    url: row.url,
    href,
    icon: row.icon,
    badgeText: row.badgeText,
    badgeColor: row.badgeColor,
    dropdownType: row.dropdownType as ApiMenuItem["dropdownType"],
    targetBlank: row.targetBlank,
    device: row.device as ApiMenuItem["device"],
    isActive: row.isActive,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    visibleNow,
    children,
    megaArticles,
  };
}

/** Mega menü haberleri — 5 dk cache Setting üzerinden */
const MEGA_CACHE_TTL_MS = 5 * 60_000;

async function loadMegaArticles(categoryId: string) {
  const key = `menu.mega.${categoryId}`;
  const cached = await prisma.setting.findUnique({ where: { key } });
  if (cached?.value) {
    try {
      const parsed = JSON.parse(cached.value) as {
        at: number;
        items: ApiMenuItem["megaArticles"];
      };
      if (Date.now() - parsed.at < MEGA_CACHE_TTL_MS) return parsed.items;
    } catch {
      /* refresh */
    }
  }

  const rows = await prisma.article.findMany({
    where: { status: "YAYINDA", categoryId },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      coverImage169: true,
    },
  });
  const fallback = peekDefaultCoverUrl();
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    coverImage: r.coverImage169 || r.coverImage || fallback,
  }));
  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value: JSON.stringify({ at: Date.now(), items }),
      groupName: "content",
    },
    update: {
      value: JSON.stringify({ at: Date.now(), items }),
      groupName: "content",
    },
  });
  return items;
}

export async function ensureMenus() {
  const defs: Array<{ location: MenuLocation; name: string }> = [
    { location: "header", name: "Üst menü" },
    { location: "footer", name: "Footer" },
    { location: "sidebar", name: "Yan menü" },
    { location: "icons", name: "İkonlar" },
  ];
  for (const d of defs) {
    await prisma.menu.upsert({
      where: { location: d.location },
      create: d,
      update: { name: d.name },
    });
  }
}

export async function getMenuByLocation(
  location: MenuLocation,
  opts?: { includeInactive?: boolean; withMega?: boolean },
): Promise<ApiMenu | null> {
  await ensureMenus();
  const menu = await prisma.menu.findUnique({
    where: { location },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
        include: {
          children: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!menu) return null;

  const items: ApiMenuItem[] = [];
  for (const row of menu.items) {
    const mapped = await mapItem(row, opts);
    if (mapped) items.push(mapped);
  }

  return {
    id: menu.id,
    location: menu.location as MenuLocation,
    name: menu.name,
    items,
    updatedAt: menu.updatedAt.toISOString(),
  };
}

export async function copyHeaderToSidebar() {
  const header = await prisma.menu.findUnique({
    where: { location: "header" },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
        include: { children: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  const sidebar = await prisma.menu.findUnique({
    where: { location: "sidebar" },
  });
  if (!header || !sidebar) return;

  const start = await prisma.menuItem.count({
    where: { menuId: sidebar.id, parentId: null },
  });

  let order = start;
  for (const root of header.items) {
    const created = await prisma.menuItem.create({
      data: {
        menuId: sidebar.id,
        parentId: null,
        sortOrder: order++,
        type: root.type,
        refId: root.refId,
        label: root.label,
        url: root.url,
        icon: root.icon,
        badgeText: root.badgeText,
        badgeColor: root.badgeColor,
        dropdownType: root.dropdownType,
        targetBlank: root.targetBlank,
        device: root.device,
        isActive: root.isActive,
        startAt: root.startAt,
        endAt: root.endAt,
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
          label: ch.label,
          url: ch.url,
          icon: ch.icon,
          badgeText: ch.badgeText,
          badgeColor: ch.badgeColor,
          dropdownType: "simple",
          targetBlank: ch.targetBlank,
          device: ch.device,
          isActive: ch.isActive,
          startAt: ch.startAt,
          endAt: ch.endAt,
        },
      });
    }
  }
}

export { MENU_LOCATION_META, MENU_STATIC_PAGES, MENU_ICON_PRESETS };
