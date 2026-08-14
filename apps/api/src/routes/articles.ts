import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  ArticleInputSchema,
  ArticlePatchSchema,
  HABER_DURUM_TO_STATUS,
  HaberBulkActionSchema,
  HaberFiltreSchema,
  HaberInlineUpdateSchema,
  MemberArticleSubmitSchema,
  PaginationSchema,
  VideoOembedInputSchema,
  assertStatusAllowedForRole,
  assertVideoReadyForPublish,
  canPublish,
  computeReadingMinutes,
  hasCapability,
  serializeGalleryImages,
  slugify,
  type ArticleStatus,
  type GalleryImage,
  type HaberStatusCounts,
  type Role,
} from "@yenihaber/shared";
import {
  optionalAuth,
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { articleInclude, mapArticle } from "../lib/mappers.js";
import {
  ensureAuthorForUser,
} from "../lib/authors-util.js";
import {
  enforcePublishRole,
  recordArticleChange,
  resolvePublishTimestamps,
} from "../lib/publish.js";
import { notifyAuthorIfPublished } from "../lib/notify-publish.js";
import {
  articleRevalidateTargets,
  revalidateWeb,
} from "../lib/revalidate.js";
import {
  expireEndedLiveVideos,
  fetchVideoOembed,
} from "../lib/video-oembed.js";

export const articleRoutes = new Hono<{ Variables: AuthVariables }>();

const STAFF_ROLES: Role[] = ["ADMIN", "EDITOR", "MUHABIR", "YAZAR", "MODERATOR"];
const MEMBER_SUBMIT_ROLES: Role[] = [
  "ADMIN",
  "EDITOR",
  "MUHABIR",
  "YAZAR",
  "UYE",
  "MODERATOR",
];

async function uniqueArticleSlug(base: string): Promise<string> {
  let slug = slugify(base).slice(0, 200) || `haber-${Date.now().toString(36)}`;
  if (slug.length < 3) slug = `haber-${Date.now().toString(36)}`;
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const clash = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    n += 1;
  }
}

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

async function upsertTags(names: string[]) {
  const { prepareTagName } = await import("../lib/tags.js");
  const tags = [];
  const seen = new Set<string>();
  for (const raw of names) {
    let prepared;
    try {
      prepared = prepareTagName(raw);
    } catch (e) {
      throw new HTTPException(400, {
        message: e instanceof Error ? e.message : "Geçersiz etiket",
      });
    }
    if (seen.has(prepared.slug)) continue;
    seen.add(prepared.slug);
    const tag = await prisma.tag.upsert({
      where: { slug: prepared.slug },
      update: { name: prepared.name, lastUsedAt: new Date() },
      create: {
        name: prepared.name,
        slug: prepared.slug,
        lastUsedAt: new Date(),
      },
    });
    tags.push(tag);
  }
  return tags;
}

function emptyNull(v: string | null | undefined) {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return v;
}

/** Muhabir manşet bayraklarını yazamaz — create'te sıfırlar, patch'te dokunmaz */
function mansetFlagsForRole(
  role: Role,
  flags: {
    isFeatured?: boolean;
    isSideManset?: boolean;
    isSpotlight?: boolean;
    isBreaking?: boolean;
  },
  mode: "create" | "patch",
) {
  if (hasCapability(role, "manset")) return flags;
  if (mode === "create") {
    return {
      isFeatured: false,
      isSideManset: false,
      isSpotlight: false,
      isBreaking: false,
    };
  }
  return {
    isFeatured: undefined,
    isSideManset: undefined,
    isSpotlight: undefined,
    isBreaking: undefined,
  };
}

async function lockHeldByMessage(lockedById: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: lockedById },
    select: { name: true, email: true },
  });
  const who = u?.name?.trim() || u?.email || "Başka bir editör";
  return `${who} şu an düzenliyor`;
}

function normalizeGalleryInput(
  raw: GalleryImage[] | undefined | null,
): GalleryImage[] {
  if (!raw?.length) return [];
  return raw
    .filter((i) => i?.url?.trim())
    .map((i) => ({ url: i.url.trim(), alt: i.alt?.trim() || null }));
}

/** Muhabir: author.userId = panel hesabı (Author id ≠ User id olabilir) */
async function scopeAuthorFilter(
  role: Role,
  userId: string,
  mine?: boolean,
): Promise<{ authorId?: string } | { author: { userId: string } } | Record<string, never>> {
  if (role === "MUHABIR" || role === "YAZAR" || mine) {
    return { author: { userId } };
  }
  return {};
}

async function reporterOwnsArticle(
  articleAuthorId: string,
  userId: string,
): Promise<boolean> {
  const a = await prisma.author.findFirst({
    where: { id: articleAuthorId, userId },
    select: { id: true },
  });
  return Boolean(a);
}

async function statusCounts(baseWhere: Record<string, unknown>): Promise<HaberStatusCounts> {
  const statuses: ArticleStatus[] = [
    "TASLAK",
    "ONAYDA",
    "ZAMANLANMIS",
    "YAYINDA",
    "ARSIV",
  ];
  const [hepsi, ...rest] = await Promise.all([
    prisma.article.count({ where: baseWhere }),
    ...statuses.map((status) =>
      prisma.article.count({ where: { ...baseWhere, status } }),
    ),
  ]);
  return {
    hepsi,
    taslak: rest[0] ?? 0,
    onayda: rest[1] ?? 0,
    zamanli: rest[2] ?? 0,
    yayinda: rest[3] ?? 0,
    arsiv: rest[4] ?? 0,
  };
}

articleRoutes.get("/", async (c) => {
  void expireEndedLiveVideos().catch(() => undefined);
  const user = await optionalAuth(c);
  const isStaff = user && STAFF_ROLES.includes(user.role);

  if (c.req.query("panel") === "1") {
    if (!user || !isStaff) {
      throw new HTTPException(401, { message: "Panel listesi için oturum gerekli" });
    }
    const filter = HaberFiltreSchema.parse({
      durum: c.req.query("durum") ?? undefined,
      kategori: c.req.query("kategori") ?? undefined,
      yazar: c.req.query("yazar") ?? undefined,
      q: c.req.query("q") ?? undefined,
      imlec: c.req.query("imlec") ?? undefined,
      page: c.req.query("page") ?? undefined,
      limit: c.req.query("limit") ?? undefined,
      mine: c.req.query("mine") ?? undefined,
    });

    const mineScope = await scopeAuthorFilter(user.role, user.id, filter.mine);
    const authorPick =
      "authorId" in mineScope || "author" in mineScope
        ? mineScope
        : filter.yazar && user.role !== "MUHABIR" && user.role !== "YAZAR"
          ? { authorId: filter.yazar }
          : {};

    const baseWhere: Record<string, unknown> = {
      ...authorPick,
      ...(filter.kategori ? { categoryId: filter.kategori } : {}),
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q } },
              { excerpt: { contains: filter.q } },
            ],
          }
        : {}),
    };

    const where = {
      ...baseWhere,
      ...(filter.durum !== "hepsi"
        ? { status: HABER_DURUM_TO_STATUS[filter.durum] }
        : {}),
    };

    const [total, rows, counts] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      statusCounts(baseWhere),
    ]);

    return c.json({
      data: rows.map(mapArticle),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filter.limit)),
        counts,
      },
    });
  }

  const statusParam = c.req.query("status");
  const breakingParam = c.req.query("breaking");
  const featuredParam = c.req.query("featured");
  const spotlightParam = c.req.query("spotlight");
  const sideParam = c.req.query("side");
  const tagSlug = c.req.query("tagSlug")?.trim() || undefined;
  const contentType = c.req.query("contentType")?.trim() || undefined;
  const videoOrientation = c.req.query("videoOrientation")?.trim() || undefined;
  const videoLiveParam = c.req.query("videoLive");
  const query = PaginationSchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    q: c.req.query("q"),
    status: statusParam && statusParam !== "all" ? statusParam : undefined,
    categorySlug: c.req.query("categorySlug"),
    categorySlugs: c.req.query("categorySlugs"),
    authorSlug: c.req.query("authorSlug"),
    contentType: contentType || undefined,
    videoOrientation: videoOrientation || undefined,
    videoLive: videoLiveParam ?? undefined,
  });

  const multiSlugs = (query.categorySlugs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const slugs =
    multiSlugs.length > 0
      ? multiSlugs
      : query.categorySlug
        ? [query.categorySlug]
        : [];

  const truthy = (v: string | undefined) =>
    v === "1" || v === "true" || v === "yes";

  const now = new Date();
  const where = {
    ...(statusParam === "all"
      ? {}
      : query.status
        ? { status: query.status }
        : { status: "YAYINDA" }),
    ...(truthy(breakingParam)
      ? {
          isBreaking: true,
          OR: [{ breakingUntil: null }, { breakingUntil: { gt: now } }],
        }
      : {}),
    ...(truthy(featuredParam) ? { isFeatured: true } : {}),
    ...(truthy(spotlightParam) ? { isSpotlight: true } : {}),
    ...(truthy(sideParam) ? { isSideManset: true } : {}),
    ...(slugs.length === 1
      ? {
          category: {
            OR: [
              { slug: slugs[0] },
              { parent: { slug: slugs[0] } },
            ],
          },
        }
      : slugs.length > 1
        ? {
            category: {
              OR: [
                { slug: { in: slugs } },
                { parent: { slug: { in: slugs } } },
              ],
            },
          }
        : {}),
    ...(query.authorSlug ? { author: { slug: query.authorSlug } } : {}),
    ...(tagSlug
      ? { tags: { some: { tag: { slug: tagSlug, status: "aktif" } } } }
      : {}),
    ...(query.contentType ? { contentType: query.contentType } : {}),
    ...(query.videoOrientation
      ? { videoOrientation: query.videoOrientation }
      : {}),
    ...(query.videoLive === true ? { videoIsLive: true } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { excerpt: { contains: query.q } },
            { content: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: truthy(sideParam)
        ? [{ sideOrder: "asc" }, { publishedAt: "desc" }]
        : [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return c.json({
    data: rows.map(mapArticle),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  });
});

/** 60s canlı: yalnız id→status ve sekme sayıları (tam tablo değil) */
articleRoutes.get(
  "/panel/snapshot",
  requireAuth,
  requireRole(...STAFF_ROLES),
  async (c) => {
    const user = c.get("user");
    const scope = await scopeAuthorFilter(user.role, user.id);
    const ids = (c.req.query("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);

    const baseWhere = scope;
    const [counts, rows] = await Promise.all([
      statusCounts(baseWhere),
      ids.length
        ? prisma.article.findMany({
            where: {
              id: { in: ids },
              ...scope,
            },
            select: { id: true, status: true, viewCount: true, isFeatured: true },
          })
        : Promise.resolve([]),
    ]);

    return c.json({
      counts,
      rows: rows.map((r) => ({
        id: r.id,
        status: r.status as ArticleStatus,
        viewCount: r.viewCount,
        isFeatured: r.isFeatured,
      })),
    });
  },
);

articleRoutes.post(
  "/panel/bulk",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MUHABIR", "YAZAR"),
  async (c) => {
    const user = c.get("user");
    const body = HaberBulkActionSchema.parse(await c.req.json());

    if (body.action === "geri_al") {
      const updated = [];
      for (const item of body.items) {
        const existing = await prisma.article.findUnique({ where: { id: item.id } });
        if (!existing) continue;
        if (
          (user.role === "MUHABIR" || user.role === "YAZAR") &&
          !(await reporterOwnsArticle(existing.authorId, user.id))
        ) {
          continue;
        }
        const check = assertStatusAllowedForRole(user.role, item.status);
        if (!check.ok) continue;
        const row = await prisma.article.update({
          where: { id: item.id },
          data: {
            status: item.status,
            ...(item.categoryId ? { categoryId: item.categoryId } : {}),
            ...(item.isFeatured !== undefined ? { isFeatured: item.isFeatured } : {}),
          },
          include: articleInclude,
        });
        void notifyAuthorIfPublished({
          articleId: item.id,
          previousStatus: existing.status,
          nextStatus: item.status,
        });
        updated.push(mapArticle(row));
      }
      return c.json({ ok: true as const, data: updated });
    }

    const targetStatus: ArticleStatus | null =
      body.action === "onayla"
        ? "ONAYDA"
        : body.action === "yayinla"
          ? "YAYINDA"
          : body.action === "arsivle"
            ? "ARSIV"
            : body.action === "taslak"
              ? "TASLAK"
              : null;

    if (targetStatus) {
      const check = assertStatusAllowedForRole(user.role, targetStatus);
      if (!check.ok) throw new HTTPException(403, { message: check.message });
    }

    const previous: Array<{
      id: string;
      status: ArticleStatus;
      categoryId: string;
      isFeatured: boolean;
    }> = [];
    const updated = [];

    for (const id of body.ids) {
      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) continue;
      if (
        (user.role === "MUHABIR" || user.role === "YAZAR") &&
        !(await reporterOwnsArticle(existing.authorId, user.id))
      ) {
        continue;
      }
      previous.push({
        id: existing.id,
        status: existing.status as ArticleStatus,
        categoryId: existing.categoryId,
        isFeatured: existing.isFeatured,
      });

      if (body.action === "kategori") {
        const row = await prisma.article.update({
          where: { id },
          data: { categoryId: body.categoryId },
          include: articleInclude,
        });
        updated.push(mapArticle(row));
        continue;
      }

      if (!targetStatus) continue;
      const timestamps = resolvePublishTimestamps(targetStatus, {
        publishedAt: existing.publishedAt,
        scheduledAt: existing.scheduledAt,
      });
      const row = await prisma.article.update({
        where: { id },
        data: {
          status: targetStatus,
          ...timestamps,
        },
        include: articleInclude,
      });
      if (targetStatus === "ARSIV") {
        const { clearArticleFromLayouts } = await import(
          "../lib/front-layout.js"
        );
        await clearArticleFromLayouts(id);
      }
      if (targetStatus === "YAYINDA") {
        void notifyAuthorIfPublished({
          articleId: id,
          previousStatus: existing.status,
          nextStatus: "YAYINDA",
        });
        const t = articleRevalidateTargets(
          row.slug,
          row.category.slug,
        );
        void revalidateWeb(t.paths, [...t.tags, "manset", "anasayfa"]);
      }
      updated.push(mapArticle(row));
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: `article.bulk.${body.action}`,
        entityType: "article",
        meta: JSON.stringify({ ids: body.ids, count: updated.length }),
      },
    });

    return c.json({ ok: true as const, data: updated, previous });
  },
);

/** Satır içi: başlık / kategori / manşet / yayın saati */
articleRoutes.patch(
  "/panel/inline/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MUHABIR", "YAZAR"),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    if (!id) throw new HTTPException(400, { message: "Kimlik gerekli" });
    const body = HaberInlineUpdateSchema.parse(await c.req.json());
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Haber bulunamadı" });
    }
    if (
      (user.role === "MUHABIR" || user.role === "YAZAR") &&
      !(await reporterOwnsArticle(existing.authorId, user.id))
    ) {
      throw new HTTPException(403, { message: "Bu haberi düzenleyemezsin" });
    }
    if (
      (body.isFeatured !== undefined && body.isFeatured) ||
      (body.isSideManset !== undefined && body.isSideManset) ||
      (body.isSpotlight !== undefined && body.isSpotlight) ||
      (body.isBreaking !== undefined && body.isBreaking)
    ) {
      if (!canPublish(user.role)) {
        throw new HTTPException(403, {
          message: "Manşet / öne çıkan için editör veya yönetici gerekli",
        });
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.categoryId !== undefined
          ? { categoryId: body.categoryId }
          : {}),
        ...(body.isFeatured !== undefined
          ? { isFeatured: body.isFeatured }
          : {}),
        ...(body.isSideManset !== undefined
          ? { isSideManset: body.isSideManset }
          : {}),
        ...(body.isSpotlight !== undefined
          ? { isSpotlight: body.isSpotlight }
          : {}),
        ...(body.isBreaking !== undefined
          ? {
              isBreaking: body.isBreaking,
              breakingUntil: body.isBreaking
                ? new Date(Date.now() + 2 * 3600_000)
                : null,
            }
          : {}),
        ...(body.publishedAt !== undefined
          ? {
              publishedAt: body.publishedAt
                ? new Date(body.publishedAt)
                : null,
            }
          : {}),
        ...(body.scheduledAt !== undefined
          ? {
              scheduledAt: body.scheduledAt
                ? new Date(body.scheduledAt)
                : null,
            }
          : {}),
      },
      include: articleInclude,
    });

    if (
      body.isFeatured !== undefined ||
      body.isSideManset !== undefined
    ) {
      const { syncHomeSlotsFromArticleFlags } = await import(
        "../lib/front-layout.js"
      );
      await syncHomeSlotsFromArticleFlags({
        articleId: id,
        isFeatured: body.isFeatured ?? article.isFeatured,
        isSideManset: body.isSideManset ?? article.isSideManset,
      });
      const { revalidateWeb } = await import("../lib/revalidate.js");
      void revalidateWeb(["/", "/son-dakika"], ["manset", "anasayfa", "articles"]);
    } else if (body.isSpotlight !== undefined || body.isBreaking !== undefined) {
      const { revalidateWeb } = await import("../lib/revalidate.js");
      void revalidateWeb(["/", "/son-dakika"], ["anasayfa", "articles"]);
    }

    return c.json(mapArticle(article));
  },
);

articleRoutes.get("/featured", async (c) => {
  const rows = await prisma.article.findMany({
    where: { status: "YAYINDA", isFeatured: true },
    include: articleInclude,
    orderBy: [{ mansetOrder: "asc" }, { publishedAt: "desc" }],
    take: 12,
  });
  return c.json(rows.map(mapArticle));
});

articleRoutes.get("/breaking", async (c) => {
  const now = new Date();
  const rows = await prisma.article.findMany({
    where: {
      status: "YAYINDA",
      isBreaking: true,
      OR: [{ breakingUntil: null }, { breakingUntil: { gt: now } }],
    },
    include: articleInclude,
    orderBy: { publishedAt: "desc" },
    take: 10,
  });
  return c.json(rows.map(mapArticle));
});

articleRoutes.get("/slug/:slug", async (c) => {
  const article = await prisma.article.findUnique({
    where: { slug: c.req.param("slug") },
    include: articleInclude,
  });
  if (!article || article.status !== "YAYINDA") {
    throw new HTTPException(404, { message: "Haber bulunamadı" });
  }
  return c.json(mapArticle(article));
});

/** Okunma sayacı — bot filtre + buffer; istemci 30dk oturum dedupe yapar */
articleRoutes.post("/:id/view", async (c) => {
  const id = c.req.param("id");
  const ua = c.req.header("user-agent") || "";
  const { isBotUserAgent } = await import("../lib/ip.js");
  if (isBotUserAgent(ua)) {
    return c.json({ ok: true as const, skipped: "bot" });
  }
  const article = await prisma.article.findFirst({
    where: { id, status: "YAYINDA" },
    select: { id: true },
  });
  if (!article) throw new HTTPException(404, { message: "Haber bulunamadı" });
  const { bumpViewBuffer } = await import("../lib/view-buffer.js");
  bumpViewBuffer(article.id);
  return c.json({ ok: true as const });
});

/** Üyenin kendi haberleri (kaydedilenler değil — gönderilenler) */
articleRoutes.get(
  "/mine",
  requireAuth,
  requireRole(...MEMBER_SUBMIT_ROLES),
  async (c) => {
    const user = c.get("user");
    const page = Math.max(1, Number(c.req.query("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") || 20)));
    const where = { author: { userId: user.id } };
    const [total, rows] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return c.json({
      data: rows.map(mapArticle),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  },
);

/**
 * Site üyesi haber gönderimi → ONAYDA kuyruğu
 * Yayın yalnızca ADMIN/EDITOR ile panelden
 */
articleRoutes.post(
  "/member-submit",
  requireAuth,
  requireRole(...MEMBER_SUBMIT_ROLES),
  async (c) => {
    const user = c.get("user");
    if (!hasCapability(user.role as Role, "submitMemberArticle")) {
      throw new HTTPException(403, { message: "Haber gönderme yetkiniz yok" });
    }
    const body = MemberArticleSubmitSchema.parse(await c.req.json());
    const cat = await prisma.category.findFirst({
      where: { id: body.categoryId, status: "aktif" },
    });
    if (!cat) {
      throw new HTTPException(400, { message: "Kategori bulunamadı veya pasif" });
    }

    const authorId = await ensureAuthorForUser(user);
    const slug = await uniqueArticleSlug(body.title);
    const html = paragraphsToHtml(body.content);
    const plain = body.content.replace(/\s+/g, " ").trim();
    const excerptRaw = body.excerpt?.trim();
    const excerpt =
      excerptRaw && excerptRaw.length > 0
        ? excerptRaw
        : plain.slice(0, 220);

    const cover = body.coverImage?.trim() || "";
    const article = await prisma.article.create({
      data: {
        title: body.title.trim(),
        slug,
        excerpt,
        content: html,
        contentType: "haber",
        coverImage: cover || null,
        coverAlt: cover ? (body.coverAlt?.trim() || null) : null,
        coverCredit: cover ? (body.coverCredit?.trim() || null) : null,
        status: "ONAYDA",
        isBreaking: false,
        isFeatured: false,
        categoryId: body.categoryId,
        authorId,
        sourceAgency: "Üye gönderimi",
      },
      include: articleInclude,
    });

    await recordArticleChange({
      articleId: article.id,
      editorId: user.id,
      action: "article.member_submit",
      snapshot: mapArticle(article),
      note: "Üye onaya gönderdi",
    });

    return c.json(mapArticle(article), 201);
  },
);

articleRoutes.get("/:id", requireAuth, async (c) => {
  const article = await prisma.article.findUnique({
    where: { id: c.req.param("id") },
    include: articleInclude,
  });
  if (!article) {
    throw new HTTPException(404, { message: "Haber bulunamadı" });
  }
  return c.json(mapArticle(article));
});

const WRITE_ROLES = ["ADMIN", "EDITOR", "MUHABIR", "YAZAR"] as const;

/** oEmbed — bağlantı yapıştır, başlık/süre/kapak */
articleRoutes.post(
  "/oembed",
  requireAuth,
  requireRole(...WRITE_ROLES),
  async (c) => {
    const body = VideoOembedInputSchema.parse(await c.req.json());
    try {
      const data = await fetchVideoOembed(body.url);
      return c.json(data);
    } catch (e) {
      throw new HTTPException(400, {
        message: e instanceof Error ? e.message : "oEmbed başarısız",
      });
    }
  },
);

articleRoutes.post("/", requireAuth, requireRole(...WRITE_ROLES), async (c) => {
  const body = ArticleInputSchema.parse(await c.req.json());
  const user = c.get("user");
  enforcePublishRole(user.role as Role, body.status);
  const mansetFlags = mansetFlagsForRole(
    user.role as Role,
    {
      isFeatured: body.isFeatured,
      isSideManset: body.isSideManset,
      isSpotlight: body.isSpotlight,
      isBreaking: body.isBreaking,
    },
    "create",
  );
  const videoErr = assertVideoReadyForPublish({
    contentType: body.contentType,
    videoProvider: body.videoProvider,
    videoId: body.videoId,
    videoTranscript: body.videoTranscript,
    videoSource: body.videoSource,
  });
  if (
    videoErr &&
    (body.status === "YAYINDA" || body.status === "ZAMANLANMIS")
  ) {
    throw new HTTPException(400, { message: videoErr });
  }
  const tags = await upsertTags(body.tagNames ?? []);
  const times = resolvePublishTimestamps(
    body.status,
    { publishedAt: null, scheduledAt: null },
    body.scheduledAt,
    body.publishedAt,
  );

  const authorId = await ensureAuthorForUser(user);
  const gallery = normalizeGalleryInput(body.galleryImages);
  const coverFromGallery = gallery[0]?.url;
  const article = await prisma.article.create({
    data: {
      title: body.title,
      headlineTitle: emptyNull(body.headlineTitle) ?? null,
      slug: body.slug,
      excerpt: body.excerpt ?? null,
      content: body.content,
      contentType: body.contentType ?? "haber",
      coverImage: emptyNull(body.coverImage) ?? coverFromGallery ?? null,
      coverAlt: emptyNull(body.coverAlt) ?? null,
      coverCredit: emptyNull(body.coverCredit) ?? null,
      coverImage169: emptyNull(body.coverImage169) ?? coverFromGallery ?? null,
      coverImage43: emptyNull(body.coverImage43) ?? null,
      coverImage11: emptyNull(body.coverImage11) ?? null,
      galleryImages: gallery.length ? serializeGalleryImages(gallery) : null,
      readingMinutes: computeReadingMinutes(body.content),
      status: body.status,
      lastAutosavedAt: new Date(),
      isBreaking: mansetFlags.isBreaking ?? false,
      breakingUntil:
        mansetFlags.isBreaking && body.breakingUntil
          ? new Date(body.breakingUntil)
          : null,
      isFeatured: mansetFlags.isFeatured ?? false,
      mansetOrder: body.mansetOrder ?? 0,
      isSideManset: mansetFlags.isSideManset ?? false,
      sideOrder: body.sideOrder ?? 0,
      isSpotlight: mansetFlags.isSpotlight ?? false,
      isSponsored: body.isSponsored ?? false,
      sourceAgency: emptyNull(body.sourceAgency) ?? null,
      publishedAt: times.publishedAt ?? null,
      scheduledAt: times.scheduledAt ?? null,
      commentsClosed: body.commentsClosed ?? false,
      pressAdNo: emptyNull(body.pressAdNo) ?? null,
      relatedArticleId: emptyNull(body.relatedArticleId) ?? null,
      redirectUrl: emptyNull(body.redirectUrl) ?? null,
      updateNote: emptyNull(body.updateNote) ?? null,
      metaTitle: body.metaTitle ?? null,
      metaDescription: body.metaDescription ?? null,
      videoProvider: body.videoProvider ?? null,
      videoId: body.videoId ?? null,
      videoDuration: body.videoDuration ?? null,
      videoPoster: emptyNull(body.videoPoster) ?? null,
      videoOrientation: body.videoOrientation ?? "yatay",
      videoTranscript: body.videoTranscript ?? null,
      videoSource: emptyNull(body.videoSource) ?? null,
      videoIsLive: body.videoIsLive ?? false,
      videoLiveEndsAt: body.videoLiveEndsAt
        ? new Date(body.videoLiveEndsAt)
        : null,
      categoryId: body.categoryId,
      authorId,
      tags: {
        create: tags.map((t) => ({ tagId: t.id })),
      },
    },
    include: articleInclude,
  });

  await recordArticleChange({
    articleId: article.id,
    editorId: user.id,
    action: "article.create",
    snapshot: mapArticle(article),
    note: body.updateNote,
  });

  if (article.status === "YAYINDA") {
    if (article.isFeatured || article.isSideManset) {
      const { syncHomeSlotsFromArticleFlags } = await import(
        "../lib/front-layout.js"
      );
      await syncHomeSlotsFromArticleFlags({
        articleId: article.id,
        ...(article.isFeatured ? { isFeatured: true as const } : {}),
        ...(article.isSideManset ? { isSideManset: true as const } : {}),
      });
    }
    void notifyAuthorIfPublished({
      articleId: article.id,
      previousStatus: "TASLAK",
      nextStatus: "YAYINDA",
    });
    void import("../lib/bik-stats.js").then((m) => m.bumpBikPublished(1));
    const t = articleRevalidateTargets(article.slug, article.category.slug);
    void revalidateWeb(t.paths, [...t.tags, "manset", "anasayfa"]);
  }

  return c.json(mapArticle(article), 201);
});

articleRoutes.patch(
  "/:id",
  requireAuth,
  requireRole(...WRITE_ROLES),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.article.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      throw new HTTPException(404, { message: "Haber bulunamadı" });
    }

    const user = c.get("user");
    if (
      (user.role === "MUHABIR" || user.role === "YAZAR") &&
      !(await reporterOwnsArticle(existing.authorId, user.id))
    ) {
      throw new HTTPException(403, { message: "Bu haberi düzenleme yetkin yok" });
    }
    if (
      existing.lockedById &&
      existing.lockedById !== user.id &&
      existing.lockedAt &&
      Date.now() - existing.lockedAt.getTime() < 5 * 60 * 1000
    ) {
      throw new HTTPException(409, {
        message: await lockHeldByMessage(existing.lockedById),
      });
    }

    const body = ArticlePatchSchema.parse(await c.req.json());
    const nextStatus = (body.status ?? existing.status) as ArticleStatus;
    enforcePublishRole(user.role as Role, nextStatus);
    const mansetFlags = mansetFlagsForRole(
      user.role as Role,
      {
        isFeatured: body.isFeatured,
        isSideManset: body.isSideManset,
        isSpotlight: body.isSpotlight,
        isBreaking: body.isBreaking,
      },
      "patch",
    );

    const mergedContentType =
      body.contentType ??
      (existing as { contentType?: string }).contentType ??
      "haber";
    const videoErr = assertVideoReadyForPublish({
      contentType: mergedContentType,
      videoProvider:
        body.videoProvider !== undefined
          ? body.videoProvider
          : (existing as { videoProvider?: string | null }).videoProvider,
      videoId:
        body.videoId !== undefined
          ? body.videoId
          : (existing as { videoId?: string | null }).videoId,
      videoTranscript:
        body.videoTranscript !== undefined
          ? body.videoTranscript
          : (existing as { videoTranscript?: string | null }).videoTranscript,
      videoSource:
        body.videoSource !== undefined
          ? body.videoSource
          : (existing as { videoSource?: string | null }).videoSource,
    });
    if (
      videoErr &&
      (nextStatus === "YAYINDA" || nextStatus === "ZAMANLANMIS")
    ) {
      throw new HTTPException(400, { message: videoErr });
    }

    const tags =
      body.tagNames !== undefined ? await upsertTags(body.tagNames) : null;
    if (tags) {
      await prisma.articleTag.deleteMany({ where: { articleId: id } });
    }

    const times = resolvePublishTimestamps(
      nextStatus,
      {
        publishedAt: existing.publishedAt,
        scheduledAt: existing.scheduledAt,
      },
      body.scheduledAt,
      body.publishedAt,
    );

    const gallery =
      body.galleryImages !== undefined
        ? normalizeGalleryInput(body.galleryImages)
        : null;
    const coverFromGallery = gallery?.[0]?.url;
    const nextCover =
      body.coverImage === undefined
        ? coverFromGallery
          ? coverFromGallery
          : undefined
        : emptyNull(body.coverImage) ?? coverFromGallery ?? null;

    if (body.slug && body.slug !== existing.slug) {
      const fromPath = `/haber/${existing.slug}`;
      const toPath = `/haber/${body.slug}`;
      await prisma.redirect.upsert({
        where: { fromPath },
        create: { fromPath, toPath, code: 301 },
        update: { toPath, code: 301 },
      });
      await prisma.redirect.updateMany({
        where: { toPath: fromPath },
        data: { toPath },
      });
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: body.title,
        headlineTitle:
          body.headlineTitle === undefined
            ? undefined
            : emptyNull(body.headlineTitle),
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        contentType: body.contentType,
        readingMinutes: body.content
          ? computeReadingMinutes(body.content)
          : undefined,
        galleryImages:
          gallery === null
            ? undefined
            : gallery.length
              ? serializeGalleryImages(gallery)
              : null,
        coverImage: nextCover,
        coverAlt:
          body.coverAlt === undefined ? undefined : emptyNull(body.coverAlt),
        coverCredit:
          body.coverCredit === undefined
            ? undefined
            : emptyNull(body.coverCredit),
        coverImage169:
          body.coverImage169 === undefined
            ? coverFromGallery || undefined
            : emptyNull(body.coverImage169) ?? coverFromGallery ?? null,
        coverImage43:
          body.coverImage43 === undefined
            ? undefined
            : emptyNull(body.coverImage43),
        coverImage11:
          body.coverImage11 === undefined
            ? undefined
            : emptyNull(body.coverImage11),
        status: body.status,
        isBreaking: mansetFlags.isBreaking,
        breakingUntil: !hasCapability(user.role as Role, "manset")
          ? undefined
          : body.isBreaking === false
            ? null
            : body.breakingUntil === undefined
              ? undefined
              : body.breakingUntil
                ? new Date(body.breakingUntil)
                : null,
        isFeatured: mansetFlags.isFeatured,
        mansetOrder: body.mansetOrder,
        isSideManset: mansetFlags.isSideManset,
        sideOrder: body.sideOrder,
        isSpotlight: mansetFlags.isSpotlight,
        isSponsored: body.isSponsored,
        lastAutosavedAt: new Date(),
        sourceAgency:
          body.sourceAgency === undefined
            ? undefined
            : emptyNull(body.sourceAgency),
        commentsClosed: body.commentsClosed,
        pressAdNo:
          body.pressAdNo === undefined
            ? undefined
            : emptyNull(body.pressAdNo),
        relatedArticleId:
          body.relatedArticleId === undefined
            ? undefined
            : emptyNull(body.relatedArticleId),
        redirectUrl:
          body.redirectUrl === undefined
            ? undefined
            : emptyNull(body.redirectUrl),
        updateNote:
          body.updateNote === undefined
            ? undefined
            : emptyNull(body.updateNote),
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        videoProvider:
          body.videoProvider === undefined ? undefined : body.videoProvider,
        videoId: body.videoId === undefined ? undefined : body.videoId,
        videoDuration:
          body.videoDuration === undefined ? undefined : body.videoDuration,
        videoPoster:
          body.videoPoster === undefined
            ? undefined
            : emptyNull(body.videoPoster),
        videoOrientation: body.videoOrientation,
        videoTranscript:
          body.videoTranscript === undefined
            ? undefined
            : body.videoTranscript,
        videoSource:
          body.videoSource === undefined
            ? undefined
            : emptyNull(body.videoSource),
        videoIsLive: body.videoIsLive,
        videoLiveEndsAt:
          body.videoLiveEndsAt === undefined
            ? undefined
            : body.videoLiveEndsAt
              ? new Date(body.videoLiveEndsAt)
              : null,
        categoryId: body.categoryId,
        publishedAt: times.publishedAt,
        scheduledAt: times.scheduledAt,
        ...(tags
          ? {
              tags: {
                create: tags.map((t) => ({ tagId: t.id })),
              },
            }
          : {}),
      },
      include: articleInclude,
    });

    await recordArticleChange({
      articleId: article.id,
      editorId: user.id,
      action: "article.update",
      snapshot: mapArticle(article),
      note: body.updateNote,
    });

    if (article.status === "ARSIV") {
      const { clearArticleFromLayouts } = await import("../lib/front-layout.js");
      await clearArticleFromLayouts(article.id);
    }

    if (article.status === "YAYINDA") {
      void notifyAuthorIfPublished({
        articleId: article.id,
        previousStatus: existing.status,
        nextStatus: "YAYINDA",
      });
      if (existing.status !== "YAYINDA") {
        void import("../lib/bik-stats.js").then((m) => m.bumpBikPublished(1));
      }
      if (
        body.isFeatured !== undefined ||
        body.isSideManset !== undefined
      ) {
        const { syncHomeSlotsFromArticleFlags } = await import(
          "../lib/front-layout.js"
        );
        await syncHomeSlotsFromArticleFlags({
          articleId: article.id,
          isFeatured:
            body.isFeatured !== undefined
              ? body.isFeatured
              : article.isFeatured,
          isSideManset:
            body.isSideManset !== undefined
              ? body.isSideManset
              : article.isSideManset,
        });
      }
      const t = articleRevalidateTargets(article.slug, article.category.slug);
      void revalidateWeb(t.paths, [...t.tags, "manset", "anasayfa"]);
    }

    return c.json(mapArticle(article));
  },
);

/** Panel: önbellek yenile */
articleRoutes.post(
  "/:id/revalidate",
  requireAuth,
  requireRole(...WRITE_ROLES),
  async (c) => {
    const id = c.req.param("id");
    const article = await prisma.article.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!article) {
      throw new HTTPException(404, { message: "Haber bulunamadı" });
    }
    const t = articleRevalidateTargets(article.slug, article.category.slug);
    await revalidateWeb(t.paths, t.tags);
    return c.json({ ok: true as const, paths: t.paths });
  },
);

/** Editör kilidi — 5 dk */
articleRoutes.post(
  "/:id/lock",
  requireAuth,
  requireRole(...WRITE_ROLES),
  async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Haber bulunamadı" });
    }
    if (
      existing.lockedById &&
      existing.lockedById !== user.id &&
      existing.lockedAt &&
      Date.now() - existing.lockedAt.getTime() < 5 * 60 * 1000
    ) {
      throw new HTTPException(409, {
        message: await lockHeldByMessage(existing.lockedById),
      });
    }
    const article = await prisma.article.update({
      where: { id },
      data: { lockedById: user.id, lockedAt: new Date() },
      include: articleInclude,
    });
    return c.json(mapArticle(article));
  },
);

articleRoutes.post(
  "/:id/unlock",
  requireAuth,
  requireRole(...WRITE_ROLES),
  async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Haber bulunamadı" });
    }
    if (
      existing.lockedById &&
      existing.lockedById !== user.id &&
      user.role !== "ADMIN"
    ) {
      throw new HTTPException(403, { message: "Kilidi sen tutmuyorsun" });
    }
    const article = await prisma.article.update({
      where: { id },
      data: { lockedById: null, lockedAt: null },
      include: articleInclude,
    });
    return c.json(mapArticle(article));
  },
);

articleRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Haber bulunamadı" });
    }
    // Soft path: yayıncılar arşivler. ADMIN kalıcı silebilir (arşiv veya force=1).
    const force = c.req.query("force") === "1";
    if (existing.status !== "ARSIV" && !force) {
      throw new HTTPException(400, {
        message:
          "Önce arşivleyin veya kalıcı silmede force=1 kullanın (yalnız ADMIN)",
      });
    }
    await prisma.article.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: c.get("user").id,
        action: "article.delete.hard",
        entityType: "article",
        entityId: id,
        meta: JSON.stringify({
          title: existing.title,
          slug: existing.slug,
          status: existing.status,
          force,
        }),
      },
    });
    return c.json({ ok: true as const });
  },
);
