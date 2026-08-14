import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  CommentInputSchema,
  CommentSelfEditSchema,
  CommentStatusSchema,
  type CommentStatus,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { clientIp, hashIp } from "../lib/ip.js";
import {
  applyCommentStatus,
  purgeTrashedComments,
} from "../lib/comment-moderation.js";
import {
  isHassasKategori,
  normalizeDisplayName,
  triyaj,
} from "../lib/comment-triage.js";
import { z } from "zod";

export const commentRoutes = new Hono<{ Variables: AuthVariables }>();

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RATE_MINUTE_MAX = 3;
const RATE_DAY_MAX = 15;
const EDIT_WINDOW_MS = 2 * 60_000;

const MOD_ROLES = ["ADMIN", "EDITOR", "MODERATOR"] as const;

const minuteBucket = new Map<string, { n: number; t: number }>();

function minuteOk(key: string): boolean {
  const now = Date.now();
  const row = minuteBucket.get(key);
  if (!row || now - row.t > MINUTE_MS) {
    minuteBucket.set(key, { n: 1, t: now });
    return true;
  }
  if (row.n >= RATE_MINUTE_MAX) return false;
  row.n += 1;
  return true;
}

async function verifyTurnstile(
  token: string | null | undefined,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

function mapPublicComment(row: {
  id: string;
  name: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  moderatedAt?: Date | null;
  moderatedById?: string | null;
  articleId: string;
  parentId: string | null;
  isQuick?: boolean;
}) {
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    status: row.status as CommentStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
    moderatedAt: row.moderatedAt?.toISOString() ?? null,
    moderatedById: row.moderatedById ?? null,
    articleId: row.articleId,
    parentId: row.parentId,
    isQuick: Boolean(row.isQuick),
  };
}

function editableUntilIso(createdAt: Date): string {
  return new Date(createdAt.getTime() + EDIT_WINDOW_MS).toISOString();
}

/** Public: yalnızca ONAYLI, tek seviye ağaç, IP yok */
commentRoutes.get("/public", async (c) => {
  const articleId = c.req.query("articleId");
  if (!articleId) {
    throw new HTTPException(400, { message: "articleId gerekli" });
  }

  const rows = await prisma.comment.findMany({
    where: {
      articleId,
      status: "ONAYLI",
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      replies: {
        where: { status: "ONAYLI" },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });

  return c.json(
    rows.map((row) => ({
      ...mapPublicComment(row),
      replies: row.replies.map(mapPublicComment),
    })),
  );
});

/** Admin: çöp/red oranı (hızlı yorum) — %20 üstü alarm */
commentRoutes.get("/stats", requireAuth, async (c) => {
  const windowDays = Math.min(
    Number(c.req.query("days") || 7) || 7,
    30,
  );
  const since = new Date(Date.now() - windowDays * DAY_MS);

  const [quickYayin, quickKuyruk, quickRed] = await Promise.all([
    prisma.comment.count({
      where: { isQuick: true, status: "ONAYLI", createdAt: { gte: since } },
    }),
    prisma.comment.count({
      where: {
        isQuick: true,
        status: "BEKLEMEDE",
        createdAt: { gte: since },
      },
    }),
    prisma.comment.count({
      where: {
        isQuick: true,
        status: { in: ["COP", "REDDEDILDI"] },
        createdAt: { gte: since },
      },
    }),
  ]);

  const quickTotal = quickYayin + quickKuyruk + quickRed;
  const rejectRate = quickTotal > 0 ? quickRed / quickTotal : 0;

  return c.json({
    windowDays,
    quickTotal,
    quickYayin,
    quickKuyruk,
    quickRed,
    rejectRate,
    rejectRateAlert: rejectRate > 0.2 && quickTotal >= 10,
  });
});

/** Admin kuyruğu — sekmeler + sayım */
commentRoutes.get(
  "/",
  requireAuth,
  requireRole(...MOD_ROLES),
  async (c) => {
    const status = c.req.query("status")?.trim();
    const articleId = c.req.query("articleId");
    const q = c.req.query("q")?.trim();
    const page = Math.max(1, Number(c.req.query("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 50)));

    const where: {
      status?: string | { in: string[] };
      articleId?: string;
      OR?: Array<
        | { content: { contains: string } }
        | { name: { contains: string } }
      >;
    } = {};

    if (status === "COP") {
      // eski REDDEDILDI kayıtları çöp sekmesinde
      where.status = { in: ["COP", "REDDEDILDI"] };
    } else if (status) {
      where.status = status;
    }
    if (articleId) where.articleId = articleId;
    if (q) {
      where.OR = [
        { content: { contains: q } },
        { name: { contains: q } },
      ];
    }

    const [total, rows, groups] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        include: {
          article: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const counts = {
      BEKLEMEDE: 0,
      ONAYLI: 0,
      ARSIV: 0,
      COP: 0,
    };
    for (const g of groups) {
      if (g.status === "BEKLEMEDE") counts.BEKLEMEDE = g._count._all;
      else if (g.status === "ONAYLI") counts.ONAYLI = g._count._all;
      else if (g.status === "ARSIV") counts.ARSIV = g._count._all;
      else if (g.status === "COP" || g.status === "REDDEDILDI") {
        counts.COP += g._count._all;
      }
    }

    return c.json({
      data: rows.map((row) => ({
        ...mapPublicComment(row),
        article: row.article,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        counts,
      },
    });
  },
);

/** Toplu moderasyon */
commentRoutes.post(
  "/bulk",
  requireAuth,
  requireRole(...MOD_ROLES),
  async (c) => {
    const body = z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(200),
        status: CommentStatusSchema,
      })
      .parse(await c.req.json());

    const user = c.get("user");
    const ipH = hashIp(clientIp(c.req.raw.headers));
    const result = await applyCommentStatus({
      ids: body.ids,
      status: body.status,
      actorId: user.id,
      ipHash: ipH,
      cascade: true,
    });

    return c.json({ ok: true as const, ...result });
  },
);

/** Çöp temizliği (30 gün) — panel/cron tetik */
commentRoutes.post(
  "/purge-trash",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const purged = await purgeTrashedComments(30);
    return c.json({ ok: true as const, purged });
  },
);

commentRoutes.post("/", async (c) => {
  const body = CommentInputSchema.parse(await c.req.json());
  const isQuick = Boolean(body.isQuick);
  const content = body.content.trim();
  const name = normalizeDisplayName(body.name);
  const ua = c.req.header("user-agent")?.slice(0, 500) || null;

  // Honeypot — bota başarı yuttur
  if (body.website && body.website.trim().length > 0) {
    return c.json(
      {
        id: "ok",
        name,
        content,
        status: "BEKLEMEDE",
        createdAt: new Date().toISOString(),
        articleId: body.articleId,
        parentId: null,
        isQuick,
        editableUntil: null,
      },
      201,
    );
  }

  const ip = clientIp(c.req.raw.headers);
  const ipH = hashIp(ip);

  if (!minuteOk(`cm:${ipH}`)) {
    throw new HTTPException(429, {
      message: "Dakikada en fazla 3 yorum gönderebilirsiniz.",
    });
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const gunlukSayi = await prisma.comment.count({
    where: { ipHash: ipH, createdAt: { gte: dayStart } },
  });
  if (gunlukSayi >= RATE_DAY_MAX) {
    throw new HTTPException(429, {
      message: "Günlük yorum limitine ulaştınız (15).",
    });
  }

  if (!(await verifyTurnstile(body.captchaToken))) {
    throw new HTTPException(400, { message: "Doğrulama başarısız." });
  }

  const article = await prisma.article.findUnique({
    where: { id: body.articleId },
    include: { category: true },
  });
  if (!article || article.status !== "YAYINDA") {
    throw new HTTPException(404, { message: "Haber bulunamadı" });
  }

  const articleClosed = Boolean(
    (article as { commentsClosed?: boolean }).commentsClosed,
  );
  const categoryClosed =
    (article.category as { commentsEnabled?: boolean }).commentsEnabled ===
    false;
  if (articleClosed || categoryClosed) {
    throw new HTTPException(403, {
      message: "Bu haber yorumlara kapalıdır.",
    });
  }

  const hassasKategori =
    Boolean(article.category.disableQuickComment) ||
    isHassasKategori(article.category.slug, article.category.name);

  if (isQuick && hassasKategori) {
    throw new HTTPException(403, {
      message:
        "Bu haberde hızlı yorum kapalı. Aşağıdan detaylı yorum yazabilirsiniz.",
    });
  }

  if (isQuick) {
    const dup = await prisma.comment.findFirst({
      where: {
        articleId: body.articleId,
        ipHash: ipH,
        isQuick: true,
        content,
      },
    });
    if (dup) {
      throw new HTTPException(409, {
        message: "Bu ifadeyi bu habere zaten yazdınız.",
      });
    }
  }

  let parentId: string | null = isQuick
    ? null
    : body.parentId?.trim() || null;
  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, articleId: body.articleId },
    });
    if (!parent) {
      throw new HTTPException(400, { message: "Yanıtlanacak yorum yok" });
    }
    if (parent.parentId) parentId = parent.parentId;
  }

  const last = await prisma.comment.findFirst({
    where: { ipHash: ipH },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const sonYorumSaniye = last
    ? (Date.now() - last.createdAt.getTime()) / 1000
    : 9999;

  const oncedenOnayliCihaz = Boolean(
    await prisma.comment.findFirst({
      where: { ipHash: ipH, status: "ONAYLI" },
      select: { id: true },
    }),
  );

  const sonuc = triyaj(content, {
    hassasKategori: !isQuick && hassasKategori,
    sonYorumSaniye,
    gunlukSayi,
    oncedenOnayliCihaz,
    isQuick,
  });

  if (sonuc === "reddet") {
    if (isQuick) {
      await prisma.comment.create({
        data: {
          name,
          content,
          articleId: body.articleId,
          parentId: null,
          status: "COP",
          ipHash: ipH,
          userAgent: ua,
          isQuick: true,
          moderatedAt: new Date(),
        },
      });
    }
    throw new HTTPException(400, {
      message: "Yorum kurallara uymuyor.",
    });
  }

  const status = sonuc === "yayinla" ? "ONAYLI" : "BEKLEMEDE";

  const comment = await prisma.comment.create({
    data: {
      name,
      content,
      articleId: body.articleId,
      parentId,
      status,
      ipHash: ipH,
      userAgent: ua,
      isQuick,
    },
  });

  return c.json(
    {
      ...mapPublicComment(comment),
      editableUntil: editableUntilIso(comment.createdAt),
    },
    201,
  );
});

/** Yazar: 2 dk düzenleme (aynı IP hash) */
commentRoutes.patch("/:id/mine", async (c) => {
  const body = CommentSelfEditSchema.parse(await c.req.json());
  if (body.website && body.website.trim().length > 0) {
    return c.json({ ok: true }, 200);
  }

  const id = c.req.param("id");
  const ipH = hashIp(clientIp(c.req.raw.headers));
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing || existing.ipHash !== ipH) {
    throw new HTTPException(404, { message: "Yorum bulunamadı" });
  }
  if (Date.now() - existing.createdAt.getTime() > EDIT_WINDOW_MS) {
    throw new HTTPException(403, {
      message: "Düzenleme süresi doldu (2 dk).",
    });
  }
  if (existing.status === "COP" || existing.status === "REDDEDILDI") {
    throw new HTTPException(403, { message: "Bu yorum düzenlenemez" });
  }

  const content = body.content.trim();
  if (existing.isQuick && content.length > 280) {
    throw new HTTPException(400, {
      message: "Hızlı yorum en fazla 280 karakter",
    });
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: {
      content,
      status: existing.status === "ONAYLI" ? "BEKLEMEDE" : existing.status,
    },
  });

  return c.json({
    ...mapPublicComment(comment),
    editableUntil: editableUntilIso(existing.createdAt),
  });
});

commentRoutes.patch(
  "/:id",
  requireAuth,
  requireRole(...MOD_ROLES),
  async (c) => {
    const body = z
      .object({ status: CommentStatusSchema })
      .parse(await c.req.json());
    const id = c.req.param("id")!;
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Yorum bulunamadı" });
    }

    const user = c.get("user");
    const ipH = hashIp(clientIp(c.req.raw.headers));
    await applyCommentStatus({
      ids: [id],
      status: body.status,
      actorId: user.id,
      ipHash: ipH,
      cascade: true,
    });

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        article: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!comment) {
      throw new HTTPException(404, { message: "Yorum bulunamadı" });
    }

    return c.json({
      ...mapPublicComment(comment),
      article: comment.article,
    });
  },
);
