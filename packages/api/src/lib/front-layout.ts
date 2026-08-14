import { prisma } from "@yenihaber/database";
import {
  DEFAULT_MANSET_SETTINGS,
  MANSET_HOME_SLOT_COUNT,
  MANSET_LOCK_TTL_MS,
  MANSET_SETTINGS_KEY,
  MansetBreakingSchema,
  MansetSettingsSchema,
  MansetSlotSchema,
  effectiveMansetLayout,
  emptyMansetSlots,
  mansetSlotCountForKind,
  type MansetBreaking,
  type MansetCardView,
  type MansetSettings,
  type MansetSlot,
  type ApiArticle,
} from "@yenihaber/shared";
import { articleHasEffectiveCover } from "./cover";
import { articleInclude, mapArticle } from "./mappers";
import { peekDefaultCoverUrl } from "./settings";

export function parseSlots(raw: string, count: number): MansetSlot[] {
  try {
    const parsed = MansetSlotSchema.array().parse(JSON.parse(raw));
    const map = new Map(parsed.map((s) => [s.slot, s]));
    return emptyMansetSlots(count).map((s) => {
      const prev = map.get(s.slot);
      return prev ? { ...s, ...prev, slot: s.slot } : s;
    });
  } catch {
    return emptyMansetSlots(count);
  }
}

export function parseBreakingSafe(
  raw: string | null | undefined,
): MansetBreaking | null {
  if (!raw) return null;
  try {
    return MansetBreakingSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function serializeSlots(slots: MansetSlot[]): string {
  return JSON.stringify(slots);
}

export function serializeBreaking(
  b: MansetBreaking | null | undefined,
): string | null {
  if (!b) return null;
  return JSON.stringify(b);
}

export function slotLabel(kind: string, slot: number): string {
  if (kind === "home") {
    return `Slot ${slot} — Sürgü ${slot}`;
  }
  if (slot === 1) return `Slot ${slot} — Öne çıkan`;
  return `Slot ${slot} — Satır`;
}

export async function loadMansetSettings(): Promise<MansetSettings> {
  const [row, countRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: MANSET_SETTINGS_KEY } }),
    prisma.setting.findUnique({ where: { key: "content.homeMansetCount" } }),
  ]);
  let base: MansetSettings = { ...DEFAULT_MANSET_SETTINGS };
  if (row?.value) {
    try {
      base = MansetSettingsSchema.parse(JSON.parse(row.value));
    } catch {
      base = { ...DEFAULT_MANSET_SETTINGS };
    }
  }
  const fromContent = Number.parseInt(countRow?.value ?? "", 10);
  if (Number.isFinite(fromContent) && fromContent >= 1) {
    const n = Math.min(24, Math.max(1, Math.round(fromContent)));
    base = MansetSettingsSchema.parse({
      ...base,
      desktopLimit: n,
      mainLimit: n,
    });
  }
  return base;
}

export async function saveMansetSettings(
  partial: Partial<MansetSettings>,
): Promise<MansetSettings> {
  const current = await loadMansetSettings();
  const next = MansetSettingsSchema.parse({
    ...current,
    ...partial,
    featured: {
      ...current.featured,
      ...(partial.featured ?? {}),
    },
  });
  await prisma.setting.upsert({
    where: { key: MANSET_SETTINGS_KEY },
    create: {
      key: MANSET_SETTINGS_KEY,
      value: JSON.stringify(next),
      groupName: "content",
    },
    update: { value: JSON.stringify(next), groupName: "content" },
  });
  // Ayarlar > İçerik alanıyla senkron
  if (
    partial.desktopLimit !== undefined ||
    partial.mainLimit !== undefined
  ) {
    const n = String(next.desktopLimit);
    await prisma.setting.upsert({
      where: { key: "content.homeMansetCount" },
      create: {
        key: "content.homeMansetCount",
        value: n,
        groupName: "content",
      },
      update: { value: n, groupName: "content" },
    });
  }
  return next;
}

function activeBadge(
  article: ApiArticle,
  slot: MansetSlot,
): MansetCardView["badge"] {
  const now = Date.now();
  if (slot.badgeText?.trim()) {
    if (
      slot.badgeExpiresAt &&
      new Date(slot.badgeExpiresAt).getTime() < now
    ) {
      return null;
    }
    return {
      text: slot.badgeText.trim(),
      color: slot.badgeColor ?? "#E10600",
      expiresAt: slot.badgeExpiresAt ?? null,
    };
  }
  if (
    article.isBreaking &&
    (!article.breakingUntil ||
      new Date(article.breakingUntil).getTime() >= now)
  ) {
    return {
      text: "Son dakika",
      color: "#E10600",
      expiresAt: article.breakingUntil,
    };
  }
  return null;
}

export function buildMansetCard(
  article: ApiArticle,
  slot: MansetSlot,
  opts?: { showSpot?: boolean },
): MansetCardView {
  const region =
    article.category.bucket === "bolge" ? article.category.name : null;
  const defaultKicker = region
    ? `${region} · ${article.category.name}`
    : article.category.name;
  const headline = slot.headlineTitle?.trim() || article.title;
  const spot =
    slot.spot?.trim() ||
    (article.excerpt ? article.excerpt.slice(0, 140) : null);
  return {
    article,
    slot: slot.slot,
    headlineTitle: headline,
    kicker: slot.kicker?.trim() || defaultKicker,
    spot,
    badge: activeBadge(article, slot),
    showSpot: opts?.showSpot ?? slot.slot === 1,
  };
}

/** Öne çıkanlar — manşet ID’leri her zaman hariç */
export async function resolveFeatured(
  settings: MansetSettings,
  excludeIds: string[],
  limit: number,
): Promise<ApiArticle[]> {
  const feat = settings.featured;
  const exclude = new Set(excludeIds);
  const out: ApiArticle[] = [];

  async function fetchAuto(take: number, already: Set<string>) {
    const where = {
      status: "YAYINDA" as const,
      id: { notIn: [...already, ...exclude] },
      ...(feat.includeCategoryIds.length
        ? { categoryId: { in: feat.includeCategoryIds } }
        : {}),
      ...(feat.excludeCategoryIds.length
        ? { categoryId: { notIn: feat.excludeCategoryIds } }
        : {}),
    };
    const orderBy =
      feat.autoMode === "views24h"
        ? [{ viewCount: "desc" as const }, { publishedAt: "desc" as const }]
        : [{ publishedAt: "desc" as const }];
    const rows = await prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy,
      take,
    });
    return rows.map(mapArticle);
  }

  if (feat.fill === "editor" || feat.fill === "hybrid") {
    const pinTake =
      feat.fill === "hybrid" ? Math.min(2, feat.pinnedIds.length) : limit;
    const pinIds = feat.pinnedIds
      .filter((id) => !exclude.has(id))
      .slice(0, pinTake);
    if (pinIds.length) {
      const rows = await prisma.article.findMany({
        where: { id: { in: pinIds }, status: "YAYINDA" },
        include: articleInclude,
      });
      const byId = new Map(rows.map((r) => [r.id, mapArticle(r)]));
      for (const id of pinIds) {
        const a = byId.get(id);
        if (a) {
          out.push(a);
          exclude.add(a.id);
        }
      }
    }
  }

  if (out.length < limit && feat.fill !== "editor") {
    // ÖÇ (isSpotlight) önce — editörün işaretlediği haberler
    const spotlightRows = await prisma.article.findMany({
      where: {
        status: "YAYINDA",
        isSpotlight: true,
        id: { notIn: [...exclude] },
      },
      include: articleInclude,
      orderBy: [{ publishedAt: "desc" }],
      take: limit - out.length,
    });
    for (const row of spotlightRows) {
      const a = mapArticle(row);
      out.push(a);
      exclude.add(a.id);
    }
  }

  if (out.length < limit && feat.fill !== "editor") {
    const more = await fetchAuto(limit - out.length, new Set(out.map((a) => a.id)));
    out.push(...more);
  }

  if (out.length < limit && feat.fill === "editor") {
    // editör seçimi eksikse otomatik doldurma yok — boş bırak
  }

  return out.slice(0, limit);
}

export function lockActive(lockedAt: Date | null | undefined): boolean {
  if (!lockedAt) return false;
  return Date.now() - lockedAt.getTime() < MANSET_LOCK_TTL_MS;
}

/** draft + live satırlarını garantile */
export async function ensureLayoutPair(kind: string) {
  const count = mansetSlotCountForKind(kind);
  const empty = serializeSlots(emptyMansetSlots(count));

  for (const status of ["draft", "live"] as const) {
    await prisma.frontLayout.upsert({
      where: { kind_status: { kind, status } },
      create: {
        kind,
        status,
        slotsJson: empty,
        breakingJson:
          kind === "home"
            ? serializeBreaking({
                enabled: false,
                text: "",
                url: null,
                expiresAt: null,
              })
            : null,
      },
      update: {},
    });
  }
}

export async function loadLayoutRow(kind: string, status: "draft" | "live") {
  await ensureLayoutPair(kind);
  return prisma.frontLayout.findUniqueOrThrow({
    where: { kind_status: { kind, status } },
    include: {
      updatedBy: { select: { id: true, name: true } },
      lockedBy: { select: { id: true, name: true } },
    },
  });
}

/** Arşiv / yayında değil → slot boşalt */
export async function sanitizeSlots(
  slots: MansetSlot[],
): Promise<{ slots: MansetSlot[]; warnings: string[]; clearedIds: string[] }> {
  const ids = slots.map((s) => s.articleId).filter(Boolean) as string[];
  const articles = ids.length
    ? await prisma.article.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          status: true,
          coverImage169: true,
          coverImage: true,
          videoPoster: true,
        },
      })
    : [];
  const byId = new Map(articles.map((a) => [a.id, a]));
  const warnings: string[] = [];
  const clearedIds: string[] = [];

  const next = slots.map((s) => {
    if (!s.articleId) return s;
    const a = byId.get(s.articleId);
    if (!a || a.status !== "YAYINDA") {
      warnings.push(
        `Slot ${s.slot}: «${a?.title ?? s.articleId}» arşiv/yayında değil — slot boşaltıldı`,
      );
      clearedIds.push(s.articleId);
      return { ...s, articleId: null };
    }
    if (!articleHasEffectiveCover(a)) {
      warnings.push(
        `Slot ${s.slot}: «${a.title}» kapak eksik — slot boşaltıldı`,
      );
      clearedIds.push(s.articleId);
      return { ...s, articleId: null };
    }
    return s;
  });

  return { slots: next, warnings, clearedIds };
}

export async function hydrateSlots(
  slots: MansetSlot[],
  kind: string,
): Promise<
  Array<{
    slot: number;
    label: string;
    article: ApiArticle | null;
    empty: boolean;
    headlineTitle?: string | null;
    kicker?: string | null;
    spot?: string | null;
    badgeText?: string | null;
    badgeColor?: string | null;
    badgeExpiresAt?: string | null;
  }>
> {
  const ids = slots.map((s) => s.articleId).filter(Boolean) as string[];
  const rows = ids.length
    ? await prisma.article.findMany({
        where: { id: { in: ids } },
        include: articleInclude,
      })
    : [];
  const byId = new Map(rows.map((r) => [r.id, mapArticle(r)]));

  return slots.map((s) => {
    const article = s.articleId ? byId.get(s.articleId) ?? null : null;
    return {
      slot: s.slot,
      label: slotLabel(kind, s.slot),
      article,
      empty: !article,
      headlineTitle: s.headlineTitle ?? null,
      kicker: s.kicker ?? null,
      spot: s.spot ?? null,
      badgeText: s.badgeText ?? null,
      badgeColor: s.badgeColor ?? null,
      badgeExpiresAt: s.badgeExpiresAt ?? null,
    };
  });
}

/** Boş slotlara güvenlik ağı — ana sayfada isFeatured havuzu */
export async function resolvePublicArticles(
  kind: string,
  slots: MansetSlot[],
): Promise<{ main: ApiArticle[]; side: ApiArticle[] }> {
  const settings = kind === "home" ? await loadMansetSettings() : null;
  const limit =
    kind === "home"
      ? Math.min(
          MANSET_HOME_SLOT_COUNT,
          Math.max(1, settings?.desktopLimit ?? settings?.mainLimit ?? 12),
        )
      : mansetSlotCountForKind(kind);

  const { slots: clean } = await sanitizeSlots(slots);
  const hydrated = await hydrateSlots(clean, kind);
  const used = new Set(
    hydrated.map((h) => h.article?.id).filter(Boolean) as string[],
  );

  const categoryId = kind.startsWith("cat:") ? kind.slice(4) : null;

  async function pickFeaturedFallback(
    exclude: Set<string>,
  ): Promise<ApiArticle | null> {
    const row = await prisma.article.findFirst({
      where: {
        status: "YAYINDA",
        isFeatured: true,
        ...(exclude.size ? { id: { notIn: Array.from(exclude) } } : {}),
      },
      include: articleInclude,
      orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
    });
    if (row) {
      const a = mapArticle(row);
      if (articleHasEffectiveCover(a)) return a;
    }
    const anyFeat = await prisma.article.findFirst({
      where: {
        status: "YAYINDA",
        isFeatured: true,
        ...(exclude.size ? { id: { notIn: Array.from(exclude) } } : {}),
      },
      include: articleInclude,
      orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
    });
    return anyFeat ? mapArticle(anyFeat) : null;
  }

  async function pickLatestFallback(
    exclude: Set<string>,
  ): Promise<ApiArticle | null> {
    const hasSiteDefault = Boolean(peekDefaultCoverUrl()?.trim());
    const row = await prisma.article.findFirst({
      where: {
        status: "YAYINDA",
        ...(categoryId ? { categoryId } : {}),
        ...(exclude.size ? { id: { notIn: Array.from(exclude) } } : {}),
        ...(hasSiteDefault
          ? {}
          : {
              OR: [
                { NOT: { coverImage169: null } },
                { NOT: { coverImage: null } },
              ],
            }),
      },
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
    });
    return row ? mapArticle(row) : null;
  }

  const filled: ApiArticle[] = [];
  for (const h of hydrated.slice(0, limit)) {
    if (h.article) {
      filled.push(h.article);
      used.add(h.article.id);
      continue;
    }
    if (kind === "home") {
      const fb = await pickFeaturedFallback(used);
      if (fb) {
        filled.push(fb);
        used.add(fb.id);
      }
      continue;
    }
    const fb = await pickLatestFallback(used);
    if (fb) {
      filled.push(fb);
      used.add(fb.id);
    }
  }

  // Ana sayfa: slotlar yetmezse «Manşete al» işaretlilerden tamamla
  if (kind === "home" && filled.length < limit) {
    const more = await prisma.article.findMany({
      where: {
        status: "YAYINDA",
        isFeatured: true,
        ...(used.size ? { id: { notIn: Array.from(used) } } : {}),
      },
      include: articleInclude,
      orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
      take: limit - filled.length,
    });
    for (const row of more) {
      const a = mapArticle(row);
      filled.push(a);
      used.add(a.id);
    }
  }

  // Hiç slot yoksa tamamen isFeatured listesi
  if (kind === "home" && filled.length === 0) {
    const rows = await prisma.article.findMany({
      where: { status: "YAYINDA", isFeatured: true },
      include: articleInclude,
      orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
      take: limit,
    });
    const mapped = rows.map(mapArticle);
    return { main: mapped, side: [] };
  }

  if (kind === "home") {
    const slides = filled.slice(0, limit);
    return { main: slides, side: [] };
  }
  return {
    main: filled.slice(0, 1),
    side: filled.slice(1),
  };
}

export function dirtyDiff(
  draftSlots: MansetSlot[],
  liveSlots: MansetSlot[],
  draftBreak: MansetBreaking | null,
  liveBreak: MansetBreaking | null,
): number {
  let n = 0;
  const max = Math.max(draftSlots.length, liveSlots.length);
  for (let i = 0; i < max; i += 1) {
    const d = draftSlots[i]?.articleId ?? null;
    const l = liveSlots[i]?.articleId ?? null;
    if (d !== l) n += 1;
  }
  if (JSON.stringify(draftBreak ?? null) !== JSON.stringify(liveBreak ?? null)) {
    n += 1;
  }
  return n;
}

export async function clearArticleFromLayouts(articleId: string) {
  const rows = await prisma.frontLayout.findMany();
  for (const row of rows) {
    const count = mansetSlotCountForKind(row.kind);
    const slots = parseSlots(row.slotsJson, count);
    let changed = false;
    const next = slots.map((s) => {
      if (s.articleId === articleId) {
        changed = true;
        return { ...s, articleId: null };
      }
      return s;
    });
    if (changed) {
      await prisma.frontLayout.update({
        where: { id: row.id },
        data: { slotsJson: serializeSlots(next) },
      });
    }
  }
}

export async function syncArticleFlagsFromHomeLive(slots: MansetSlot[]) {
  // Yalnız manşet (M) bayraklarını slotlardan senkronla — SM’ye dokunma
  await prisma.article.updateMany({
    data: {
      isFeatured: false,
      mansetOrder: 0,
    },
  });
  for (const s of slots) {
    if (!s.articleId) continue;
    await prisma.article.update({
      where: { id: s.articleId },
      data: {
        isFeatured: true,
        mansetOrder: s.slot,
      },
    });
  }
}

/**
 * Haber listesi M / SM bayrakları.
 * M → ana sürgü slotları · SM → sürmanşet şeridi (slot yok)
 */
export async function syncHomeSlotsFromArticleFlags(opts: {
  articleId: string;
  isFeatured?: boolean;
  isSideManset?: boolean;
}) {
  await ensureLayoutPair("home");
  const settings = await loadMansetSettings();
  const count = mansetSlotCountForKind("home");
  const activeLimit = Math.min(
    count,
    Math.max(1, settings.desktopLimit || settings.mainLimit || 12),
  );

  if (opts.isSideManset !== undefined) {
    let sideOrder = 0;
    if (opts.isSideManset) {
      const max = await prisma.article.aggregate({
        where: { isSideManset: true, id: { not: opts.articleId } },
        _max: { sideOrder: true },
      });
      sideOrder = (max._max.sideOrder ?? 0) + 1;
    }
    await prisma.article.update({
      where: { id: opts.articleId },
      data: {
        isSideManset: opts.isSideManset,
        sideOrder: opts.isSideManset ? sideOrder : 0,
      },
    });
  }

  if (opts.isFeatured === undefined) return;

  for (const status of ["draft", "live"] as const) {
    const row = await loadLayoutRow("home", status);
    let slots = parseSlots(row.slotsJson, count);

    if (opts.isFeatured === true) {
      const already = slots.find((s) => s.articleId === opts.articleId);
      if (!already) {
        const free = slots.find((s) => s.slot <= activeLimit && !s.articleId);
        const target = free?.slot ?? activeLimit;
        slots = slots.map((s) =>
          s.slot === target ? { ...s, articleId: opts.articleId } : s,
        );
      }
      await prisma.article.update({
        where: { id: opts.articleId },
        data: {
          isFeatured: true,
          mansetOrder:
            slots.find((s) => s.articleId === opts.articleId)?.slot ??
            activeLimit,
        },
      });
    } else {
      slots = slots.map((s) =>
        s.articleId === opts.articleId ? { ...s, articleId: null } : s,
      );
      await prisma.article.update({
        where: { id: opts.articleId },
        data: { isFeatured: false, mansetOrder: 0 },
      });
    }

    await prisma.frontLayout.update({
      where: { id: row.id },
      data: { slotsJson: serializeSlots(slots) },
    });
  }
}

export function defaultsSettings(): MansetSettings {
  return { ...DEFAULT_MANSET_SETTINGS };
}

export { MANSET_LOCK_TTL_MS, effectiveMansetLayout, loadMansetSettings as getMansetSettings };
