import { Hono } from "hono";
import { prisma } from "@yenihaber/database";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";

export const logRoutes = new Hono<{ Variables: AuthVariables }>();

/** Operasyon logları (AuditLog) — yalnız yönetici */
logRoutes.get("/", requireAuth, requireRole("ADMIN"), async (c) => {
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 40)));
  const action = c.req.query("action")?.trim() || "";
  const q = c.req.query("q")?.trim() || "";

  const where = {
    ...(action ? { action: { contains: action } } : {}),
    ...(q
      ? {
          OR: [
            { entityType: { contains: q } },
            { entityId: { contains: q } },
            { action: { contains: q } },
            { meta: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      meta: r.meta,
      createdAt: r.createdAt.toISOString(),
      actor: r.actor
        ? { id: r.actor.id, name: r.actor.name, email: r.actor.email }
        : null,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

logRoutes.get("/actions", requireAuth, requireRole("ADMIN"), async (c) => {
  const groups = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { action: true },
    orderBy: { _count: { action: "desc" } },
    take: 40,
  });
  return c.json({
    data: groups.map((g) => ({
      action: g.action,
      count: g._count.action,
    })),
  });
});
