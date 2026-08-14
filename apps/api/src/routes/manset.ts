import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  FrontLayoutKindSchema,
  MANSET_LOCK_TTL_MS,
  MansetBreakingSchema,
  MansetDraftUpdateSchema,
  MansetSettingsSchema,
  emptyMansetSlots,
  mansetSlotCountForKind,
  type MansetBreaking,
  type MansetPanelResponse,
  type MansetSlot,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { articleHasEffectiveCover } from "../lib/cover.js";
import { articleInclude, mapArticle } from "../lib/mappers.js";
import { revalidateWeb } from "../lib/revalidate.js";
import {
  clearArticleFromLayouts,
  defaultsSettings,
  dirtyDiff,
  ensureLayoutPair,
  hydrateSlots,
  loadLayoutRow,
  loadMansetSettings,
  lockActive,
  parseBreakingSafe,
  parseSlots,
  resolveFeatured,
  resolvePublicArticles,
  buildMansetCard,
  sanitizeSlots,
  saveMansetSettings,
  serializeBreaking,
  serializeSlots,
  syncArticleFlagsFromHomeLive,
  effectiveMansetLayout,
} from "../lib/front-layout.js";

export const mansetRoutes = new Hono<{ Variables: AuthVariables }>();

function assertLockHeld(
  row: { lockedById: string | null; lockedAt: Date | null },
  userId: string,
) {
  if (!lockActive(row.lockedAt) || row.lockedById !== userId) {
    throw new HTTPException(423, {
      message: "Manşet kilidi sizde değil — önce kilidi alın",
    });
  }
}

async function buildPanel(kind: string, userId: string): Promise<MansetPanelResponse> {
  const count = mansetSlotCountForKind(kind);
  const [draft, live] = await Promise.all([
    loadLayoutRow(kind, "draft"),
    loadLayoutRow(kind, "live"),
  ]);

  let draftSlots = parseSlots(draft.slotsJson, count);
  const san = await sanitizeSlots(draftSlots);
  if (san.clearedIds.length) {
    draftSlots = san.slots;
    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: { slotsJson: serializeSlots(draftSlots) },
    });
  }

  const liveSlots = parseSlots(live.slotsJson, count);
  const draftBreak =
    kind === "home" ? parseBreakingSafe(draft.breakingJson) : null;
  const liveBreak =
    kind === "home" ? parseBreakingSafe(live.breakingJson) : null;

  // Süresi dolmuş son dakika → kapat
  let breaking = draftBreak;
  if (
    breaking?.enabled &&
    breaking.expiresAt &&
    new Date(breaking.expiresAt).getTime() < Date.now()
  ) {
    breaking = { ...breaking, enabled: false };
    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: { breakingJson: serializeBreaking(breaking) },
    });
  }

  const hydrated = await hydrateSlots(draftSlots, kind);
  const dirtyCount = dirtyDiff(draftSlots, liveSlots, draftBreak, liveBreak);
  const held = lockActive(draft.lockedAt);
  const settings = await loadMansetSettings();

  return {
    kind,
    slotCount: count,
    slots: hydrated.map((h) => ({
      ...h,
      autoCleared: false,
      warning: null,
    })),
    breaking,
    settings,
    dirtyCount,
    lastChange: draft.updatedAt
      ? {
          at: draft.updatedAt.toISOString(),
          by: draft.updatedBy
            ? { id: draft.updatedBy.id, name: draft.updatedBy.name }
            : null,
        }
      : null,
    lock: {
      held,
      byMe: held && draft.lockedById === userId,
      lockedBy:
        held && draft.lockedBy
          ? { id: draft.lockedBy.id, name: draft.lockedBy.name }
          : null,
      expiresAt:
        held && draft.lockedAt
          ? new Date(draft.lockedAt.getTime() + MANSET_LOCK_TTL_MS).toISOString()
          : null,
      ttlMs: MANSET_LOCK_TTL_MS,
    },
    warnings: san.warnings,
    unpublished: dirtyCount > 0,
  };
}

/** Public canlı düzen */
mansetRoutes.get("/", async (c) => {
  const kind = c.req.query("kind") ?? "home";
  FrontLayoutKindSchema.parse(kind);
  await ensureLayoutPair(kind);

  c.header("Cache-Control", "private, no-store, max-age=0");

  const live = await loadLayoutRow(kind, "live");
  const slots = parseSlots(live.slotsJson, mansetSlotCountForKind(kind));
  const { main, side } = await resolvePublicArticles(kind, slots);
  const settings = await loadMansetSettings();
  const layout = effectiveMansetLayout(settings.layout, settings.emergency);

  const slotByArticle = new Map(
    slots.filter((s) => s.articleId).map((s) => [s.articleId!, s]),
  );
  const ordered = [...main, ...side];
  const items = ordered.map((article, i) => {
    const slot =
      slotByArticle.get(article.id) ??
      ({ slot: i + 1, articleId: article.id } as MansetSlot);
    return buildMansetCard(article, slot, { showSpot: i === 0 });
  });

  const excludeIds = ordered.map((a) => a.id);
  const featuredLimit = settings.featured.desktopCount;
  const featured = await resolveFeatured(settings, excludeIds, featuredLimit);

  let breakingLive = kind === "home" ? parseBreakingSafe(live.breakingJson) : null;
  if (
    !(
      breakingLive?.enabled &&
      breakingLive.expiresAt &&
      new Date(breakingLive.expiresAt).getTime() >= Date.now() &&
      breakingLive.text?.trim()
    )
  ) {
    breakingLive = null;
  }

  // Legacy / bayrak yedek: slot boşsa isFeatured listesi (sayı = desktopLimit)
  if (!main.length && !side.length && kind === "home") {
    const take = Math.min(
      mansetSlotCountForKind("home"),
      Math.max(1, settings.desktopLimit || settings.mainLimit || 12),
    );
    const featuredRows = await prisma.article.findMany({
      where: { status: "YAYINDA", isFeatured: true },
      include: articleInclude,
      orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
      take,
    });
    const legacyMain = featuredRows.map(mapArticle);
    const legacyItems = legacyMain.map((article, i) =>
      buildMansetCard(
        article,
        { slot: i + 1, articleId: article.id },
        { showSpot: i === 0 },
      ),
    );
    return c.json({
      main: legacyMain,
      side: [],
      items: legacyItems,
      featured: await resolveFeatured(
        settings,
        legacyItems.map((x) => x.article.id),
        featuredLimit,
      ),
      settings,
      layout,
      breaking: breakingLive
        ? {
            text: breakingLive.text ?? "",
            url: breakingLive.url || null,
            expiresAt: breakingLive.expiresAt!,
          }
        : null,
    });
  }

  return c.json({
    main,
    side,
    items,
    featured,
    settings,
    layout,
    breaking:
      breakingLive?.enabled && breakingLive.expiresAt
        ? {
            text: breakingLive.text ?? "",
            url: breakingLive.url || null,
            expiresAt: breakingLive.expiresAt,
          }
        : null,
  });
});

/** Panel: taslak düzen + kilit durumu */
mansetRoutes.get(
  "/panel",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const kind = FrontLayoutKindSchema.parse(c.req.query("kind") ?? "home");
    const user = c.get("user");
    return c.json(await buildPanel(kind, user.id));
  },
);

/** Manşet ayarları — olağanüstü anahtar yalnız ADMIN */
mansetRoutes.patch(
  "/settings",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = MansetSettingsSchema.partial().parse(await c.req.json());
    if (body.emergency !== undefined && user.role !== "ADMIN") {
      throw new HTTPException(403, {
        message: "Olağanüstü gün anahtarı yalnızca yönetici",
      });
    }
    const settings = await saveMansetSettings(body);
    await revalidateWeb(["/"], ["manset", "anasayfa"]);
    return c.json({ settings, layout: effectiveMansetLayout(settings.layout, settings.emergency) });
  },
);

/** Aday listesi */
mansetRoutes.get(
  "/panel/candidates",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const kind = FrontLayoutKindSchema.parse(c.req.query("kind") ?? "home");
    const hours = Number(c.req.query("hours") ?? "0");
    const categoryId = kind.startsWith("cat:") ? kind.slice(4) : undefined;
    const since =
      hours > 0 ? new Date(Date.now() - hours * 60 * 60 * 1000) : undefined;

    const rows = await prisma.article.findMany({
      where: {
        status: "YAYINDA",
        ...(categoryId ? { categoryId } : {}),
        ...(since ? { publishedAt: { gte: since } } : {}),
      },
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
      take: 80,
    });

    return c.json({
      data: rows.map((r) => {
        const a = mapArticle(r);
        return { ...a, hasMansetCover: articleHasEffectiveCover(a) };
      }),
    });
  },
);

mansetRoutes.get(
  "/panel/log",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const kind = FrontLayoutKindSchema.parse(c.req.query("kind") ?? "home");
    const rows = await prisma.frontLayoutLog.findMany({
      where: { kind },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { actor: { select: { id: true, name: true } } },
    });
    return c.json({
      data: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        action: r.action,
        summary: r.summary,
        createdAt: r.createdAt.toISOString(),
        actor: r.actor
          ? { id: r.actor.id, name: r.actor.name }
          : null,
      })),
    });
  },
);

mansetRoutes.post(
  "/panel/lock",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const kind = FrontLayoutKindSchema.parse(
      (await c.req.json().catch(() => ({}))).kind ?? c.req.query("kind") ?? "home",
    );
    const user = c.get("user");
    const draft = await loadLayoutRow(kind, "draft");
    if (
      lockActive(draft.lockedAt) &&
      draft.lockedById &&
      draft.lockedById !== user.id
    ) {
      throw new HTTPException(409, {
        message: `Manşet ${draft.lockedBy?.name ?? "başka editör"} tarafından kilitli`,
      });
    }
    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: { lockedById: user.id, lockedAt: new Date() },
    });
    return c.json(await buildPanel(kind, user.id));
  },
);

mansetRoutes.post(
  "/panel/heartbeat",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const kind = FrontLayoutKindSchema.parse(body.kind ?? "home");
    const user = c.get("user");
    const draft = await loadLayoutRow(kind, "draft");
    assertLockHeld(draft, user.id);
    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: { lockedAt: new Date() },
    });
    return c.json({ ok: true as const, ttlMs: MANSET_LOCK_TTL_MS });
  },
);

mansetRoutes.post(
  "/panel/unlock",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const kind = FrontLayoutKindSchema.parse(body.kind ?? "home");
    const user = c.get("user");
    const draft = await loadLayoutRow(kind, "draft");
    if (draft.lockedById === user.id || user.role === "ADMIN") {
      await prisma.frontLayout.update({
        where: { id: draft.id },
        data: { lockedById: null, lockedAt: null },
      });
    }
    return c.json(await buildPanel(kind, user.id));
  },
);

/** Taslağı kaydet — canlıya çıkmaz */
mansetRoutes.put(
  "/panel/draft",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = MansetDraftUpdateSchema.parse(await c.req.json());
    const kind = body.kind;
    const count = mansetSlotCountForKind(kind);
    const draft = await loadLayoutRow(kind, "draft");
    assertLockHeld(draft, user.id);

    if (body.slots.length !== count) {
      throw new HTTPException(400, {
        message: `Bu düzen ${count} sabit slot ister`,
      });
    }
    for (let i = 0; i < count; i += 1) {
      if (body.slots[i]!.slot !== i + 1) {
        throw new HTTPException(400, { message: "Slot numaraları 1..N olmalı" });
      }
    }

    const ids = body.slots
      .map((s) => s.articleId)
      .filter(Boolean) as string[];
    if (ids.length !== new Set(ids).size) {
      throw new HTTPException(400, { message: "Aynı haber birden fazla slotta olamaz" });
    }

    if (ids.length) {
      const found = await prisma.article.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          status: true,
          categoryId: true,
          coverImage169: true,
          coverImage: true,
          videoPoster: true,
          title: true,
        },
      });
      if (found.length !== ids.length) {
        throw new HTTPException(400, { message: "Bazı haberler bulunamadı" });
      }
      for (const a of found) {
        if (a.status !== "YAYINDA") {
          throw new HTTPException(400, {
            message: `«${a.title}» yayında değil — manşete alınamaz`,
          });
        }
        if (!articleHasEffectiveCover(a)) {
          throw new HTTPException(400, {
            message: `«${a.title}» kapak olmadan manşete alınamaz`,
          });
        }
        if (kind.startsWith("cat:") && a.categoryId !== kind.slice(4)) {
          throw new HTTPException(400, {
            message: `«${a.title}» bu kategoriye ait değil`,
          });
        }
      }
    }

    let breakingJson: string | null = draft.breakingJson;
    if (kind === "home" && body.breaking !== undefined) {
      if (body.breaking === null) {
        breakingJson = serializeBreaking({
          enabled: false,
          text: "",
          url: null,
          expiresAt: null,
        });
      } else {
        const b = MansetBreakingSchema.parse(body.breaking);
        breakingJson = serializeBreaking(b);
      }
    }

    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: {
        slotsJson: serializeSlots(body.slots as MansetSlot[]),
        breakingJson,
        updatedById: user.id,
        lockedAt: new Date(),
      },
    });

    await prisma.frontLayoutLog.create({
      data: {
        kind,
        actorId: user.id,
        action: "draft.save",
        summary: "Taslak manşet kaydedildi",
        snapshot: JSON.stringify({ slots: body.slots, breaking: body.breaking }),
      },
    });

    return c.json(await buildPanel(kind, user.id));
  },
);

/** Taslağı canlıya kopyala + log + revalidate */
mansetRoutes.post(
  "/panel/publish",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json().catch(() => ({}));
    const kind = FrontLayoutKindSchema.parse(body.kind ?? "home");
    const count = mansetSlotCountForKind(kind);
    const draft = await loadLayoutRow(kind, "draft");
    assertLockHeld(draft, user.id);

    const san = await sanitizeSlots(parseSlots(draft.slotsJson, count));
    const live = await loadLayoutRow(kind, "live");

    await prisma.$transaction(async (tx) => {
      await tx.frontLayout.update({
        where: { id: live.id },
        data: {
          slotsJson: serializeSlots(san.slots),
          breakingJson: draft.breakingJson,
          updatedById: user.id,
        },
      });
      await tx.frontLayout.update({
        where: { id: draft.id },
        data: {
          slotsJson: serializeSlots(san.slots),
          updatedById: user.id,
          lockedAt: new Date(),
        },
      });
      await tx.frontLayoutLog.create({
        data: {
          kind,
          actorId: user.id,
          action: "publish",
          summary: "Manşet yayına alındı",
          snapshot: JSON.stringify({
            slots: san.slots,
            breaking: parseBreakingSafe(draft.breakingJson),
          }),
        },
      });
    });

    if (kind === "home") {
      await syncArticleFlagsFromHomeLive(san.slots);
      await revalidateWeb(["/", "/son-dakika"], ["manset", "anasayfa"]);
    } else if (kind.startsWith("cat:")) {
      const cat = await prisma.category.findUnique({
        where: { id: kind.slice(4) },
      });
      if (cat) {
        await revalidateWeb([`/kategori/${cat.slug}`, "/"], [
          "manset",
          "anasayfa",
          `kategori:${cat.slug}`,
        ]);
      }
    }

    return c.json(await buildPanel(kind, user.id));
  },
);

/** Arşivlenen haber manşetten düşer — dışarı çağrı */
export { clearArticleFromLayouts };

/** Eski anında-kaydet: taslağa yazıp yayınla (geri uyumluluk) */
mansetRoutes.put(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const kind = "home";
    await ensureLayoutPair(kind);
    const draft = await loadLayoutRow(kind, "draft");
    // kilit al
    if (
      lockActive(draft.lockedAt) &&
      draft.lockedById &&
      draft.lockedById !== user.id
    ) {
      throw new HTTPException(409, { message: "Manşet kilitli" });
    }
    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: { lockedById: user.id, lockedAt: new Date() },
    });

    const mainIds: string[] = body.mainIds ?? [];
    const sideIds: string[] = body.sideIds ?? [];
    const slots = emptyMansetSlots(mansetSlotCountForKind(kind)).map((s, i) => {
      if (i === 0) return { slot: 1, articleId: mainIds[0] ?? null };
      return { slot: i + 1, articleId: sideIds[i - 1] ?? null };
    });

    await prisma.frontLayout.update({
      where: { id: draft.id },
      data: {
        slotsJson: serializeSlots(slots),
        updatedById: user.id,
      },
    });

    // auto publish for legacy
    const live = await loadLayoutRow(kind, "live");
    await prisma.frontLayout.update({
      where: { id: live.id },
      data: {
        slotsJson: serializeSlots(slots),
        updatedById: user.id,
      },
    });
    await syncArticleFlagsFromHomeLive(slots);
    await revalidateWeb(["/"], ["manset", "anasayfa"]);

    const pub = await resolvePublicArticles(kind, slots);
    return c.json({
      main: pub.main,
      side: pub.side,
      settings: defaultsSettings(),
    });
  },
);
