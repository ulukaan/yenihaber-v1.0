import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  CacheTags,
  PaidListingCreateSchema,
  PaidListingKindSchema,
  PaidListingStatusSchema,
  PaidListingUpdateSchema,
  slugify,
  type ApiPaidListing,
  type PaidListingKind,
  type PaidListingStatus,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { revalidateWeb } from "../lib/revalidate.js";

export const listingRoutes = new Hono<{ Variables: AuthVariables }>();

function revalidateListings() {
  void revalidateWeb(
    ["/ilanlar", "/servis/vefat", "/servis"],
    [CacheTags.ilanlar],
  );
}

function emptyStr(v: string | null | undefined): string | null {
  if (v === undefined || v === null || v === "") return null;
  return v.trim() || null;
}

function parseDate(v: string | null | undefined): Date | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function asKind(v: string): PaidListingKind {
  const p = PaidListingKindSchema.safeParse(v);
  return p.success ? p.data : "diger";
}

function asStatus(v: string): PaidListingStatus {
  const p = PaidListingStatusSchema.safeParse(v);
  return p.success ? p.data : "draft";
}

function mapListing(row: {
  id: string;
  slug: string;
  kind: string;
  title: string;
  body: string;
  personName: string | null;
  imageUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  customerNote: string | null;
  priceTry: number;
  durationDays: number;
  status: string;
  featured: boolean;
  startAt: Date | null;
  endAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiPaidListing {
  return {
    id: row.id,
    slug: row.slug,
    kind: asKind(row.kind),
    title: row.title,
    body: row.body,
    personName: row.personName,
    imageUrl: row.imageUrl,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    customerNote: row.customerNote,
    priceTry: row.priceTry,
    durationDays: row.durationDays,
    status: asStatus(row.status),
    featured: row.featured,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || `ilan-${Date.now().toString(36)}`;
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const existing = await prisma.paidListing.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

function isPubliclyVisible(row: {
  status: string;
  startAt: Date | null;
  endAt: Date | null;
}): boolean {
  if (row.status !== "active") return false;
  const now = Date.now();
  if (row.startAt && row.startAt.getTime() > now) return false;
  if (row.endAt && row.endAt.getTime() < now) return false;
  return true;
}

/** Public — yayındaki ilanlar */
listingRoutes.get("/", async (c) => {
  const kind = c.req.query("kind");
  const now = new Date();
  const rows = await prisma.paidListing.findMany({
    where: {
      status: "active",
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
      ...(kind ? { kind } : {}),
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return c.json({ data: rows.map(mapListing) });
});

listingRoutes.get("/admin", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const status = c.req.query("status");
  const kind = c.req.query("kind");
  const q = (c.req.query("q") ?? "").trim();
  const rows = await prisma.paidListing.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(kind ? { kind } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { personName: { contains: q } },
              { body: { contains: q } },
              { contactName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });
  return c.json({ data: rows.map(mapListing) });
});

listingRoutes.get("/:idOrSlug", async (c) => {
  const key = c.req.param("idOrSlug");
  const row = await prisma.paidListing.findFirst({
    where: {
      OR: [{ id: key }, { slug: key }],
    },
  });
  if (!row) throw new HTTPException(404, { message: "İlan bulunamadı" });
  if (!isPubliclyVisible(row)) {
    throw new HTTPException(404, { message: "İlan bulunamadı" });
  }
  return c.json({ listing: mapListing(row) });
});

listingRoutes.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const body = PaidListingCreateSchema.parse(await c.req.json());
  const user = c.get("user");
  const slug = await uniqueSlug(emptyStr(body.slug) || body.title);
  const status = body.status;
  const startAt = parseDate(body.startAt) ?? (status === "active" ? new Date() : null);
  let endAt = parseDate(body.endAt);
  if (!endAt && status === "active" && startAt) {
    endAt = new Date(startAt.getTime() + body.durationDays * 86_400_000);
  }
  const row = await prisma.paidListing.create({
    data: {
      slug,
      kind: body.kind,
      title: body.title.trim(),
      body: body.body ?? "",
      personName: emptyStr(body.personName),
      imageUrl: emptyStr(body.imageUrl),
      contactName: emptyStr(body.contactName),
      contactPhone: emptyStr(body.contactPhone),
      customerNote: emptyStr(body.customerNote),
      priceTry: body.priceTry,
      durationDays: body.durationDays,
      status,
      featured: body.featured,
      startAt,
      endAt,
      publishedAt: status === "active" ? new Date() : null,
      createdById: user.id,
    },
  });
  revalidateListings();
  return c.json({ listing: mapListing(row) }, 201);
});

listingRoutes.patch("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.paidListing.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "İlan bulunamadı" });
  const body = PaidListingUpdateSchema.parse(await c.req.json());

  const nextStatus = body.status ?? asStatus(existing.status);
  const nextDuration = body.durationDays ?? existing.durationDays;
  let startAt =
    body.startAt !== undefined
      ? parseDate(body.startAt)
      : existing.startAt;
  if (nextStatus === "active" && !startAt) startAt = new Date();
  let endAt =
    body.endAt !== undefined ? parseDate(body.endAt) : existing.endAt;
  if (
    nextStatus === "active" &&
    !endAt &&
    startAt &&
    (body.status === "active" || body.durationDays !== undefined)
  ) {
    endAt = new Date(startAt.getTime() + nextDuration * 86_400_000);
  }

  let slug = existing.slug;
  if (body.slug !== undefined && emptyStr(body.slug)) {
    slug = await uniqueSlug(emptyStr(body.slug)!, id);
  } else if (body.title && body.title.trim() !== existing.title) {
    // slug sabitle — sadece elle değiştirilir
  }

  const row = await prisma.paidListing.update({
    where: { id },
    data: {
      ...(body.kind !== undefined ? { kind: body.kind } : {}),
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.personName !== undefined
        ? { personName: emptyStr(body.personName) }
        : {}),
      ...(body.imageUrl !== undefined
        ? { imageUrl: emptyStr(body.imageUrl) }
        : {}),
      ...(body.contactName !== undefined
        ? { contactName: emptyStr(body.contactName) }
        : {}),
      ...(body.contactPhone !== undefined
        ? { contactPhone: emptyStr(body.contactPhone) }
        : {}),
      ...(body.customerNote !== undefined
        ? { customerNote: emptyStr(body.customerNote) }
        : {}),
      ...(body.priceTry !== undefined ? { priceTry: body.priceTry } : {}),
      ...(body.durationDays !== undefined
        ? { durationDays: body.durationDays }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.featured !== undefined ? { featured: body.featured } : {}),
      startAt,
      endAt,
      slug,
      publishedAt:
        nextStatus === "active"
          ? existing.publishedAt ?? new Date()
          : existing.publishedAt,
    },
  });
  revalidateListings();
  return c.json({ listing: mapListing(row) });
});

listingRoutes.delete("/:id", requireAuth, requireRole("ADMIN"), async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.paidListing.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "İlan bulunamadı" });
  await prisma.paidListing.delete({ where: { id } });
  revalidateListings();
  return c.json({ ok: true as const });
});

/** Süresi dolan aktif ilanları expired yap */
listingRoutes.post(
  "/expire-due",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const now = new Date();
    const res = await prisma.paidListing.updateMany({
      where: {
        status: "active",
        endAt: { lt: now },
      },
      data: { status: "expired" },
    });
    if (res.count > 0) revalidateListings();
    return c.json({ ok: true as const, expired: res.count });
  },
);
