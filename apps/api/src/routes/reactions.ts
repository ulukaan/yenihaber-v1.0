import { prisma } from "@yenihaber/database";
import {
  REACTION_ORDER,
  ReactionPostSchema,
  parseReactionConfig,
  type ReactionType,
} from "@yenihaber/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { clientIp, hashIpUa } from "../lib/ip.js";
import { peekDefaultCoverUrl, loadSettingsFlat } from "../lib/settings.js";

export const reactionRoutes = new Hono<{ Variables: AuthVariables }>();

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;
const rateBucket = new Map<string, { n: number; t: number }>();

function rateOk(key: string): boolean {
  const now = Date.now();
  const row = rateBucket.get(key);
  if (!row || now - row.t > RATE_WINDOW_MS) {
    rateBucket.set(key, { n: 1, t: now });
    return true;
  }
  if (row.n >= RATE_MAX) return false;
  row.n += 1;
  return true;
}

function emptyCounts(): Record<ReactionType, number> {
  return {
    begendim: 0,
    destek: 0,
    sasirdim: 0,
    uzuldum: 0,
    kizdim: 0,
  };
}

async function loadCounts(articleId: string) {
  const rows = await prisma.articleReactionCount.findMany({
    where: { articleId },
  });
  const counts = emptyCounts();
  let total = 0;
  for (const row of rows) {
    if ((REACTION_ORDER as string[]).includes(row.type)) {
      counts[row.type as ReactionType] = row.count;
      total += row.count;
    }
  }
  return { counts, total };
}

async function reactionConfig() {
  const flat = await loadSettingsFlat();
  return parseReactionConfig(flat["reactions.config"]);
}

/** GET /reactions/config — aktif tepkiler (public) */
reactionRoutes.get("/config", async (c) => {
  const config = await reactionConfig();
  return c.json({
    minShow: config.minShow,
    items: config.items.filter((i) => i.enabled),
  });
});

/** GET /reactions/insights — editör: en çok tepki alanlar */
reactionRoutes.get(
  "/insights",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
  const type = (c.req.query("type") || "kizdim") as ReactionType;
  if (!(REACTION_ORDER as string[]).includes(type)) {
    throw new HTTPException(400, { message: "Geçersiz tepki tipi" });
  }
  const take = Math.min(30, Math.max(5, Number(c.req.query("limit") || 12)));
  const rows = await prisma.articleReactionCount.findMany({
    where: { type, count: { gt: 0 } },
    orderBy: { count: "desc" },
    take,
    include: {
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          coverImage: true,
          category: { select: { name: true, slug: true } },
        },
      },
    },
  });
  return c.json({
    type,
    data: rows
      .filter((r) => r.article.status === "YAYINDA")
      .map((r) => ({
        articleId: r.articleId,
        count: r.count,
        title: r.article.title,
        slug: r.article.slug,
        coverImage: r.article.coverImage || peekDefaultCoverUrl(),
        categoryName: r.article.category.name,
        publishedAt: r.article.publishedAt?.toISOString() ?? null,
      })),
  });
  },
);

/** GET /reactions/:articleId */
reactionRoutes.get("/:articleId", async (c) => {
  const articleId = c.req.param("articleId");
  if (articleId === "config" || articleId === "insights") {
    throw new HTTPException(404, { message: "Bulunamadı" });
  }
  const article = await prisma.article.findFirst({
    where: { id: articleId, status: "YAYINDA" },
    select: { id: true },
  });
  if (!article) throw new HTTPException(404, { message: "Haber bulunamadı" });

  const { counts, total } = await loadCounts(articleId);
  const config = await reactionConfig();
  return c.json({
    articleId,
    counts,
    total,
    minShow: config.minShow,
    items: config.items.filter((i) => i.enabled),
  });
});

/**
 * POST /reactions/:articleId
 * - yoksa ekle
 * - aynı tip → geri al (toggle)
 * - farklı tip → önceki sil, yeni yaz (switch)
 */
reactionRoutes.post("/:articleId", async (c) => {
  const articleId = c.req.param("articleId");
  const body = ReactionPostSchema.parse(await c.req.json());
  const type = body.type;
  const ip = clientIp(c.req.raw.headers);
  const ua = c.req.header("user-agent") || "";
  const voter = hashIpUa(ip, ua);

  if (!rateOk(`rx:${voter}`)) {
    throw new HTTPException(429, { message: "Çok fazla istek. Biraz bekleyin." });
  }

  const config = await reactionConfig();
  const allowed = config.items.find((i) => i.id === type && i.enabled);
  if (!allowed) {
    throw new HTTPException(400, { message: "Bu tepki kapalı" });
  }

  const article = await prisma.article.findFirst({
    where: { id: articleId, status: "YAYINDA" },
    select: { id: true },
  });
  if (!article) throw new HTTPException(404, { message: "Haber bulunamadı" });

  const existing = await prisma.reactionVote.findUnique({
    where: { articleId_ipHash: { articleId, ipHash: voter } },
  });

  const { action, mine } = await prisma.$transaction(async (tx) => {
    if (existing && existing.type === type) {
      await tx.reactionVote.delete({ where: { id: existing.id } });
      await tx.articleReactionCount.updateMany({
        where: { articleId, type, count: { gt: 0 } },
        data: { count: { decrement: 1 } },
      });
      return { action: "remove" as const, mine: null as ReactionType | null };
    }

    if (existing && existing.type !== type) {
      const prev = existing.type as ReactionType;
      await tx.reactionVote.update({
        where: { id: existing.id },
        data: { type },
      });
      await tx.articleReactionCount.updateMany({
        where: { articleId, type: prev, count: { gt: 0 } },
        data: { count: { decrement: 1 } },
      });
      await tx.articleReactionCount.upsert({
        where: { articleId_type: { articleId, type } },
        create: { articleId, type, count: 1 },
        update: { count: { increment: 1 } },
      });
      return { action: "switch" as const, mine: type as ReactionType | null };
    }

    await tx.reactionVote.create({
      data: { articleId, type, ipHash: voter },
    });
    await tx.articleReactionCount.upsert({
      where: { articleId_type: { articleId, type } },
      create: { articleId, type, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { action: "add" as const, mine: type as ReactionType | null };
  });

  const { counts, total } = await loadCounts(articleId);
  return c.json(
    {
      articleId,
      counts,
      total,
      mine,
      action,
      already: action === "remove",
      type: mine,
      minShow: config.minShow,
      items: config.items.filter((i) => i.enabled),
    },
    action === "add" ? 201 : 200,
  );
});
