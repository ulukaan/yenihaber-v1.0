import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";

export const redirectRoutes = new Hono<{ Variables: AuthVariables }>();

/** Public lookup — middleware */
redirectRoutes.get("/lookup", async (c) => {
  const raw = (c.req.query("path") ?? "").trim();
  if (!raw.startsWith("/")) {
    throw new HTTPException(400, { message: "path / ile başlamalı" });
  }
  // sorgu/hash kırp
  const path = raw.split("?")[0]!.split("#")[0]!;
  const row = await prisma.redirect.findUnique({ where: { fromPath: path } });
  if (!row) return c.json({ found: false as const });
  return c.json({
    found: true as const,
    fromPath: row.fromPath,
    toPath: row.toPath,
    code: row.code,
  });
});

redirectRoutes.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const rows = await prisma.redirect.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return c.json({
    data: rows.map((r) => ({
      fromPath: r.fromPath,
      toPath: r.toPath,
      code: r.code,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});
