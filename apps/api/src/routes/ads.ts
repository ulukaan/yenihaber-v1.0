import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  AdCreateSchema,
  AdUpdateSchema,
  CacheTags,
  PAGE_LABELS,
  isValidSlot,
  slotsByPage,
  type AdSlotCode,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import {
  archiveExpiredAds,
  getActiveAds,
  pickAd,
  toAdminJson,
  toPublic,
  trackAdEvent,
  type AdRow,
} from "../lib/ads.js";
import { revalidateWeb } from "../lib/revalidate.js";

export const adRoutes = new Hono<{ Variables: AuthVariables }>();

function revalidateAds() {
  void revalidateWeb(["/"], [CacheTags.anasayfa, CacheTags.reklam]);
}

function emptyToNull(v: string | null | undefined) {
  if (v === undefined || v === null || v === "") return null;
  return v;
}

function parseDate(v: string | null | undefined): Date | null {
  const s = emptyToNull(v ?? null);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Panel form: sabit alan kataloğu */
adRoutes.get("/slots", (c) => {
  return c.json({
    byPage: slotsByPage(),
    pageLabels: PAGE_LABELS,
  });
});

/** Public: alan için tek aktif reklam (rotasyon) */
adRoutes.get("/slot/:code", async (c) => {
  const code = c.req.param("code");
  if (!isValidSlot(code)) {
    throw new HTTPException(404, { message: "Geçersiz reklam alanı" });
  }
  const ads = await getActiveAds(code as AdSlotCode);
  const ad = pickAd(ads);
  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return c.json({ ad: ad ? toPublic(ad) : null });
});

/** Public: gösterim / tıklama */
adRoutes.post("/track", async (c) => {
  try {
    const body = (await c.req.json()) as {
      adId?: string;
      event?: string;
    };
    if (
      typeof body.adId !== "string" ||
      (body.event !== "impression" && body.event !== "click")
    ) {
      return c.body(null, 400);
    }
    await trackAdEvent(body.adId, body.event);
  } catch {
    /* ignore */
  }
  return c.body(null, 204);
});

/** Admin listesi */
adRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const status = c.req.query("status")?.trim();
    const slot = c.req.query("slot")?.trim();
    const q = c.req.query("q")?.trim();
    const rows = await prisma.ad.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(slot ? { slotCode: slot } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { advertiser: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
    return c.json({
      data: rows.map((r) =>
        toAdminJson({
          ...r,
          type: r.type as AdRow["type"],
          device: r.device as AdRow["device"],
          status: r.status as AdRow["status"],
        }),
      ),
    });
  },
);

adRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const actor = c.get("user");
    const body = AdCreateSchema.parse(await c.req.json());
    if (!isValidSlot(body.slotCode)) {
      throw new HTTPException(400, { message: "Geçersiz alan kodu" });
    }
    const created = await prisma.ad.create({
      data: {
        slotCode: body.slotCode,
        name: body.name.trim(),
        advertiser: emptyToNull(body.advertiser ?? null),
        type: body.type,
        imageUrl: emptyToNull(body.imageUrl ?? null),
        imageUrlMobile: emptyToNull(body.imageUrlMobile ?? null),
        targetUrl: emptyToNull(body.targetUrl ?? null),
        htmlCode: emptyToNull(body.htmlCode ?? null),
        adsenseSlotId: emptyToNull(body.adsenseSlotId ?? null),
        device: body.device,
        startAt: parseDate(body.startAt ?? null),
        endAt: parseDate(body.endAt ?? null),
        weight: body.weight,
        status: body.status,
        createdById: actor.id,
      },
    });
    revalidateAds();
    return c.json(
      toAdminJson({
        ...created,
        type: created.type as AdRow["type"],
        device: created.device as AdRow["device"],
        status: created.status as AdRow["status"],
      }),
      201,
    );
  },
);

adRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const body = AdUpdateSchema.parse(await c.req.json());
    const existing = await prisma.ad.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Reklam yok" });
    if (body.slotCode && !isValidSlot(body.slotCode)) {
      throw new HTTPException(400, { message: "Geçersiz alan kodu" });
    }
    const updated = await prisma.ad.update({
      where: { id },
      data: {
        ...(body.slotCode !== undefined ? { slotCode: body.slotCode } : {}),
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.advertiser !== undefined
          ? { advertiser: emptyToNull(body.advertiser) }
          : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.imageUrl !== undefined
          ? { imageUrl: emptyToNull(body.imageUrl) }
          : {}),
        ...(body.imageUrlMobile !== undefined
          ? { imageUrlMobile: emptyToNull(body.imageUrlMobile) }
          : {}),
        ...(body.targetUrl !== undefined
          ? { targetUrl: emptyToNull(body.targetUrl) }
          : {}),
        ...(body.htmlCode !== undefined
          ? { htmlCode: emptyToNull(body.htmlCode) }
          : {}),
        ...(body.adsenseSlotId !== undefined
          ? { adsenseSlotId: emptyToNull(body.adsenseSlotId) }
          : {}),
        ...(body.device !== undefined ? { device: body.device } : {}),
        ...(body.startAt !== undefined
          ? { startAt: parseDate(body.startAt) }
          : {}),
        ...(body.endAt !== undefined ? { endAt: parseDate(body.endAt) } : {}),
        ...(body.weight !== undefined ? { weight: body.weight } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });
    revalidateAds();
    return c.json(
      toAdminJson({
        ...updated,
        type: updated.type as AdRow["type"],
        device: updated.device as AdRow["device"],
        status: updated.status as AdRow["status"],
      }),
    );
  },
);

adRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    await prisma.ad.delete({ where: { id } }).catch(() => {
      throw new HTTPException(404, { message: "Reklam yok" });
    });
    revalidateAds();
    return c.json({ ok: true as const });
  },
);

adRoutes.post(
  "/archive-expired",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const n = await archiveExpiredAds();
    return c.json({ ok: true as const, archived: n });
  },
);
