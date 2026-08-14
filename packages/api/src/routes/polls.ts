import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Prisma } from "@yenihaber/database";
import { prisma } from "@yenihaber/database";
import {
  PollCreateSchema,
  PollUpdateSchema,
  PollVoteSchema,
} from "@yenihaber/shared";
import {
  optionalAuth,
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";
import { clientIp } from "../lib/ip";
import {
  buildVoterHash,
  isPollWindowOpen,
  mapPoll,
  type PollRow,
} from "../lib/polls";

export const pollRoutes = new Hono<{ Variables: AuthVariables }>();

const pollInclude = {
  options: { orderBy: { sortOrder: "asc" as const } },
  article: { select: { title: true, slug: true } },
} as const;

const rate = new Map<string, { n: number; t: number }>();
function rateOk(key: string, max = 12, windowMs = 60_000) {
  const now = Date.now();
  const row = rate.get(key);
  if (!row || now - row.t > windowMs) {
    rate.set(key, { n: 1, t: now });
    return true;
  }
  if (row.n >= max) return false;
  row.n += 1;
  return true;
}

function parseDate(v: string | null | undefined): Date | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function emptyArticleId(v: string | null | undefined): string | null {
  if (!v || !v.trim()) return null;
  return v.trim();
}

async function loadPoll(id: string) {
  return prisma.poll.findUnique({
    where: { id },
    include: pollInclude,
  });
}

async function findActiveGeneral() {
  const now = new Date();
  const rows = await prisma.poll.findMany({
    where: {
      status: "active",
      articleId: null,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
    },
    include: pollInclude,
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
  return (
    rows.find((r) => !r.endAt || r.endAt.getTime() >= now.getTime()) ?? null
  );
}

async function closeOtherGenerals(exceptId?: string) {
  await prisma.poll.updateMany({
    where: {
      articleId: null,
      status: "active",
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { status: "closed" },
  });
}

/** Public: günün anketi (genel) */
pollRoutes.get("/active", async (c) => {
  const poll = await findActiveGeneral();
  c.header("Cache-Control", "public, max-age=20, stale-while-revalidate=40");
  return c.json({ poll: poll ? mapPoll(poll as PollRow) : null });
});

/** Public: habere bağlı */
pollRoutes.get("/article/:articleId", async (c) => {
  const articleId = c.req.param("articleId");
  const now = new Date();
  const poll = await prisma.poll.findFirst({
    where: {
      articleId,
      status: "active",
      OR: [{ startAt: null }, { startAt: { lte: now } }],
    },
    include: pollInclude,
    orderBy: { updatedAt: "desc" },
  });
  if (!poll || (poll.endAt && poll.endAt.getTime() < now.getTime())) {
    return c.json({ poll: null });
  }
  return c.json({ poll: mapPoll(poll as PollRow) });
});

/** Public: arşiv */
pollRoutes.get("/archive", async (c) => {
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const limit = Math.min(40, Math.max(1, Number(c.req.query("limit") || 20)));
  const now = new Date();
  const where: Prisma.PollWhereInput = {
    OR: [
      { status: "closed" },
      { status: "active", endAt: { lt: now } },
    ],
  };
  const [total, rows] = await Promise.all([
    prisma.poll.count({ where }),
    prisma.poll.findMany({
      where,
      include: pollInclude,
      orderBy: [{ endAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return c.json({
    data: rows.map((r) => mapPoll(r as PollRow)),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** Admin: aktif genel */
pollRoutes.get(
  "/meta/active-general",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const poll = await findActiveGeneral();
    return c.json({ poll: poll ? mapPoll(poll as PollRow) : null });
  },
);

/** Admin: liste — auth; query status/q */
pollRoutes.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const status = c.req.query("status")?.trim();
  const q = c.req.query("q")?.trim();
  const rows = await prisma.poll.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { question: { contains: q } } : {}),
    },
    include: pollInclude,
    orderBy: { updatedAt: "desc" },
    take: 120,
  });
  const activeGeneral = await findActiveGeneral();
  return c.json({
    data: rows.map((r) => mapPoll(r as PollRow)),
    activeGeneralId: activeGeneral?.id ?? null,
  });
});

/** Admin: oluştur */
pollRoutes.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const body = PollCreateSchema.parse(await c.req.json());
  const articleId = emptyArticleId(body.articleId ?? null);
  if (articleId) {
    const art = await prisma.article.findUnique({ where: { id: articleId } });
    if (!art) throw new HTTPException(400, { message: "Haber bulunamadı" });
  }

  if (body.status === "active" && !articleId) {
    const existing = await findActiveGeneral();
    if (existing && !body.forceActive) {
      return c.json(
        {
          conflict: true as const,
          message:
            "Şu an aktif bir genel anket var. Kapatılıp bu yayına alınsın mı?",
          activePoll: mapPoll(existing as PollRow),
        },
        409,
      );
    }
    if (existing && body.forceActive) await closeOtherGenerals();
  }

  const poll = await prisma.poll.create({
    data: {
      question: body.question.trim(),
      articleId,
      type: body.type,
      status: body.status,
      startAt: parseDate(body.startAt),
      endAt: parseDate(body.endAt),
      options: {
        create: body.options.map((o, i) => ({
          label: o.label.trim(),
          sortOrder: i,
        })),
      },
    },
    include: pollInclude,
  });
  return c.json({ poll: mapPoll(poll as PollRow) }, 201);
});

/** Oy */
pollRoutes.post("/:id/vote", async (c) => {
  const id = c.req.param("id");
  const body = PollVoteSchema.parse(await c.req.json());
  const ip = clientIp(c.req.raw.headers);
  const ua = c.req.header("user-agent") || "unknown";
  if (!rateOk(`poll:${ip}`)) {
    throw new HTTPException(429, { message: "Çok fazla istek" });
  }

  const user = await optionalAuth(c);
  const voterHash = buildVoterHash({
    ip,
    userAgent: ua,
    userId: user?.id,
  });

  const poll = await loadPoll(id);
  if (!poll || !isPollWindowOpen(poll)) {
    throw new HTTPException(400, { message: "Anket oylamaya kapalı" });
  }

  const optionIds = [...new Set(body.optionIds)];
  if (poll.type === "single" && optionIds.length !== 1) {
    throw new HTTPException(400, { message: "Tek seçenek seçin" });
  }

  const validIds = new Set(poll.options.map((o) => o.id));
  if (!optionIds.every((oid) => validIds.has(oid))) {
    throw new HTTPException(400, { message: "Geçersiz seçenek" });
  }

  const primaryOption = optionIds[0]!;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.pollVote.create({
        data: {
          pollId: id,
          optionId: primaryOption,
          userId: user?.id ?? null,
          voterHash,
        },
      });
      for (const oid of optionIds) {
        await tx.pollOption.update({
          where: { id: oid },
          data: { voteCount: { increment: 1 } },
        });
      }
      await tx.poll.update({
        where: { id },
        data: { totalVotes: { increment: 1 } },
      });
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const fresh = await loadPoll(id);
      return c.json({
        poll: fresh ? mapPoll(fresh as PollRow) : null,
        already: true as const,
      });
    }
    throw e;
  }

  const fresh = await loadPoll(id);
  return c.json({
    poll: fresh ? mapPoll(fresh as PollRow) : null,
    already: false as const,
  });
});

/** Public: detay */
pollRoutes.get("/:id", async (c) => {
  const poll = await loadPoll(c.req.param("id"));
  if (!poll || poll.status === "draft") {
    throw new HTTPException(404, { message: "Anket yok" });
  }
  return c.json({ poll: mapPoll(poll as PollRow) });
});

/** Admin: güncelle */
pollRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id")!;
    const body = PollUpdateSchema.parse(await c.req.json());
    const existing = await loadPoll(id);
    if (!existing) throw new HTTPException(404, { message: "Anket yok" });

    const articleId =
      body.articleId !== undefined
        ? emptyArticleId(body.articleId)
        : existing.articleId;

    if (body.articleId !== undefined && articleId) {
      const art = await prisma.article.findUnique({ where: { id: articleId } });
      if (!art) throw new HTTPException(400, { message: "Haber bulunamadı" });
    }

    const nextStatus = body.status ?? existing.status;
    if (nextStatus === "active" && !articleId) {
      const currentActive = await findActiveGeneral();
      if (currentActive && currentActive.id !== id && !body.forceActive) {
        return c.json(
          {
            conflict: true as const,
            message:
              "Şu an aktif bir genel anket var. Kapatılıp bu yayına alınsın mı?",
            activePoll: mapPoll(currentActive as PollRow),
          },
          409,
        );
      }
      if (currentActive && currentActive.id !== id && body.forceActive) {
        await closeOtherGenerals(id);
      }
    }

    await prisma.$transaction(async (tx) => {
      if (body.options) {
        const keepIds = body.options
          .map((o) => o.id)
          .filter((x): x is string => Boolean(x));
        if (keepIds.length) {
          await tx.pollOption.deleteMany({
            where: { pollId: id, id: { notIn: keepIds } },
          });
        } else {
          await tx.pollOption.deleteMany({ where: { pollId: id } });
        }
        let order = 0;
        for (const o of body.options) {
          if (o.id) {
            await tx.pollOption.updateMany({
              where: { id: o.id, pollId: id },
              data: { label: o.label.trim(), sortOrder: order },
            });
          } else {
            await tx.pollOption.create({
              data: {
                pollId: id,
                label: o.label.trim(),
                sortOrder: order,
              },
            });
          }
          order += 1;
        }
      }

      await tx.poll.update({
        where: { id },
        data: {
          ...(body.question !== undefined
            ? { question: body.question.trim() }
            : {}),
          ...(body.articleId !== undefined ? { articleId } : {}),
          ...(body.type !== undefined ? { type: body.type } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.startAt !== undefined
            ? { startAt: parseDate(body.startAt) }
            : {}),
          ...(body.endAt !== undefined ? { endAt: parseDate(body.endAt) } : {}),
        },
      });
    });

    const fresh = await loadPoll(id);
    return c.json({ poll: fresh ? mapPoll(fresh as PollRow) : null });
  },
);

pollRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    try {
      await prisma.poll.delete({ where: { id } });
    } catch {
      throw new HTTPException(404, { message: "Anket yok" });
    }
    return c.json({ ok: true as const });
  },
);
