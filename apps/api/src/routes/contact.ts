import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { prisma } from "@yenihaber/database";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { clientIp, hashIp } from "../lib/ip.js";

export const contactRoutes = new Hono<{ Variables: AuthVariables }>();

const Topics = [
  "genel",
  "ihbar",
  "duzeltme",
  "reklam",
  "kvkk",
] as const;

const ContactInputSchema = z.object({
  name: z.string().max(120).optional().default(""),
  email: z
    .string()
    .max(200)
    .optional()
    .default("")
    .transform((v) => v.trim())
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Geçersiz e-posta",
    }),
  topic: z.enum(Topics).default("genel"),
  subject: z.string().max(200).optional().default(""),
  body: z.string().min(10).max(4000),
  /** honeypot */
  website: z.string().max(200).optional().default(""),
});

const rate = new Map<string, { n: number; t: number }>();
function rateOk(key: string, max = 5, windowMs = 60 * 60 * 1000) {
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

function mapMsg(r: {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string;
  body: string;
  status: string;
  createdAt: Date;
  readAt: Date | null;
}) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    topic: r.topic,
    subject: r.subject,
    body: r.body,
    status: r.status as "new" | "read" | "archived",
    createdAt: r.createdAt.toISOString(),
    readAt: r.readAt?.toISOString() ?? null,
  };
}

/** Public gönderim */
contactRoutes.post("/", async (c) => {
  const body = ContactInputSchema.parse(await c.req.json());
  if (body.website && body.website.trim()) {
    return c.json({ ok: true as const }, 201);
  }
  const ip = clientIp(c.req.raw.headers);
  const ipH = hashIp(ip);
  if (!rateOk(`cm:${ipH}`)) {
    throw new HTTPException(429, {
      message: "Çok fazla mesaj. Biraz sonra deneyin.",
    });
  }

  const row = await prisma.contactMessage.create({
    data: {
      name: body.name?.trim() || "",
      email: (body.email || "").trim().toLowerCase(),
      topic: body.topic,
      subject: body.subject?.trim() || "",
      body: body.body.trim(),
      status: "new",
      ipHash: ipH,
    },
  });

  return c.json({ ok: true as const, id: row.id }, 201);
});

/** Admin: liste */
contactRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MODERATOR"),
  async (c) => {
    const status = c.req.query("status")?.trim();
    const rows = await prisma.contactMessage.findMany({
      where: status ? { status } : { status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return c.json({ data: rows.map(mapMsg) });
  },
);

/** Admin: okundu / arşiv */
contactRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MODERATOR"),
  async (c) => {
    const id = c.req.param("id");
    const body = z
      .object({
        status: z.enum(["new", "read", "archived"]),
      })
      .parse(await c.req.json());
    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Mesaj yok" });

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: body.status,
        readAt:
          body.status === "read" || body.status === "archived"
            ? existing.readAt ?? new Date()
            : null,
      },
    });
    return c.json(mapMsg(updated));
  },
);

contactRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    await prisma.contactMessage.delete({ where: { id } }).catch(() => {
      throw new HTTPException(404, { message: "Mesaj yok" });
    });
    return c.json({ ok: true as const });
  },
);
