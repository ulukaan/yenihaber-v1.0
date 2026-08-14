import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { prisma } from "@yenihaber/database";
import {
  ElectionBallotPatchSchema,
  ElectionResultPatchSchema,
  COLOR_DISTANCE_WARN,
  colorDistance,
  PARTY_COLOR_PALETTE,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";
import {
  buildStrip,
  mapRace,
  readStripCache,
  recomputeSeats,
  refreshStripCache,
} from "../lib/elections";

export const electionRoutes = new Hono<{ Variables: AuthVariables }>();

/** Public: şerit — cache JSON, 30 sn */
electionRoutes.get("/strip", async (c) => {
  let strip = await readStripCache();
  if (!strip) {
    const active = await prisma.setting.findUnique({
      where: { key: "election.active_id" },
    });
    if (active?.value) {
      strip = await refreshStripCache(active.value);
    } else {
      const live = await prisma.election.findFirst({
        where: { status: "live" },
        orderBy: { updatedAt: "desc" },
      });
      if (live) strip = await refreshStripCache(live.id);
    }
  }
  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return c.json({ strip });
});

/** Public: /secim paket */
electionRoutes.get("/live", async (c) => {
  const slug = c.req.query("slug");
  const election = slug
    ? await prisma.election.findUnique({ where: { slug } })
    : await prisma.election.findFirst({
        where: { status: { in: ["live", "closed"] } },
        orderBy: { updatedAt: "desc" },
      });
  if (!election) return c.json({ election: null, strip: null, races: [] });

  const races = await prisma.electionRace.findMany({
    where: { electionId: election.id },
    orderBy: { sortOrder: "asc" },
    select: { id: true, type: true },
  });

  const duzceCb = await prisma.electionRegion.findFirst({
    where: { electionId: election.id, slug: "duzce-cb" },
  });

  const mapped = (
    await Promise.all(
      races.map((r) =>
        mapRace(
          r.id,
          r.type === "cumhurbaskanligi" && duzceCb
            ? { compareRegionId: duzceCb.id }
            : undefined,
        ),
      ),
    )
  ).filter(Boolean);

  const strip = await buildStrip(election.id);
  c.header("Cache-Control", "public, max-age=15, stale-while-revalidate=45");
  return c.json({
    election: {
      id: election.id,
      name: election.name,
      slug: election.slug,
      kind: election.kind,
      status: election.status,
    },
    strip,
    races: mapped,
  });
});

electionRoutes.get("/races/:id", async (c) => {
  const compareRegionId = c.req.query("compareRegionId") || undefined;
  const race = await mapRace(c.req.param("id")!, { compareRegionId });
  if (!race) throw new HTTPException(404, { message: "Yarış yok" });
  return c.json({ race });
});

/** Admin: liste */
electionRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const rows = await prisma.election.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { races: true, parties: true } },
      },
    });
    return c.json({
      data: rows.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        kind: e.kind,
        status: e.status,
        raceCount: e._count.races,
        partyCount: e._count.parties,
        updatedAt: e.updatedAt.toISOString(),
      })),
      colorPalette: PARTY_COLOR_PALETTE,
    });
  },
);

electionRoutes.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id")!;
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        regions: { orderBy: { sortOrder: "asc" } },
        parties: { orderBy: { sortOrder: "asc" }, include: { alliance: true } },
        alliances: true,
        races: {
          orderBy: { sortOrder: "asc" },
          include: {
            region: true,
            candidates: {
              include: { party: true },
              orderBy: { listOrder: "asc" },
            },
          },
        },
      },
    });
    if (!election) throw new HTTPException(404, { message: "Seçim yok" });
    const raceMaps = await Promise.all(
      election.races.map((r) => mapRace(r.id)),
    );
    return c.json({
      election,
      races: raceMaps.filter(Boolean),
      colorPalette: PARTY_COLOR_PALETTE,
    });
  },
);

electionRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = z
      .object({
        name: z.string().min(3),
        slug: z.string().min(2),
        kind: z.enum(["yerel", "genel"]).default("yerel"),
        status: z.enum(["draft", "live", "closed"]).default("draft"),
      })
      .parse(await c.req.json());
    const election = await prisma.election.create({ data: body });
    return c.json({ election }, 201);
  },
);

electionRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id")!;
    const body = z
      .object({
        name: z.string().min(3).optional(),
        status: z.enum(["draft", "live", "closed"]).optional(),
        kind: z.enum(["yerel", "genel"]).optional(),
      })
      .parse(await c.req.json());
    const election = await prisma.election.update({ where: { id }, data: body });
    if (body.status) await refreshStripCache(id);
    return c.json({ election });
  },
);

const PartyBodySchema = z.object({
  name: z.string().min(2),
  shortName: z.string().optional().default(""),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logoUrl: z.string().optional().nullable(),
  allianceId: z.string().optional().nullable(),
  forceColor: z.boolean().optional().default(false),
});

/** Parti ekle — renk zorunlu + yakınlık uyarısı */
electionRoutes.post(
  "/:id/parties",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const electionId = c.req.param("id")!;
    const body = PartyBodySchema.parse(await c.req.json());

    const existing = await prisma.electionParty.findMany({
      where: { electionId },
      select: { id: true, name: true, color: true },
    });
    const close = existing.find(
      (p) => colorDistance(p.color, body.color) < COLOR_DISTANCE_WARN,
    );
    if (close && !body.forceColor) {
      return c.json(
        {
          conflict: true as const,
          message: `“${close.name}” ile renk çok yakın. Yine de kullanılsın mı?`,
          nearParty: close.name,
        },
        409,
      );
    }

    const party = await prisma.electionParty.create({
      data: {
        electionId,
        name: body.name,
        shortName: body.shortName || body.name.slice(0, 12),
        color: body.color.toUpperCase(),
        logoUrl: body.logoUrl || null,
        allianceId: body.allianceId || null,
        sortOrder: existing.length,
      },
    });
    return c.json({ party }, 201);
  },
);

/** Parti güncelle — renk / logo / ad */
electionRoutes.patch(
  "/parties/:partyId",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const partyId = c.req.param("partyId")!;
    const body = PartyBodySchema.partial()
      .extend({
        name: z.string().min(2).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
      })
      .parse(await c.req.json());

    const current = await prisma.electionParty.findUnique({
      where: { id: partyId },
    });
    if (!current) throw new HTTPException(404, { message: "Parti yok" });

    if (body.color) {
      const others = await prisma.electionParty.findMany({
        where: { electionId: current.electionId, NOT: { id: partyId } },
        select: { name: true, color: true },
      });
      const close = others.find(
        (p) => colorDistance(p.color, body.color!) < COLOR_DISTANCE_WARN,
      );
      if (close && !body.forceColor) {
        return c.json(
          {
            conflict: true as const,
            message: `“${close.name}” ile renk çok yakın. Yine de kullanılsın mı?`,
            nearParty: close.name,
          },
          409,
        );
      }
    }

    const party = await prisma.electionParty.update({
      where: { id: partyId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.shortName !== undefined
          ? { shortName: body.shortName || body.name?.slice(0, 12) || current.shortName }
          : {}),
        ...(body.color !== undefined
          ? { color: body.color.toUpperCase() }
          : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
        ...(body.allianceId !== undefined
          ? { allianceId: body.allianceId || null }
          : {}),
      },
    });
    await refreshStripCache(current.electionId);
    return c.json({ party });
  },
);

electionRoutes.delete(
  "/parties/:partyId",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const partyId = c.req.param("partyId")!;
    const current = await prisma.electionParty.findUnique({
      where: { id: partyId },
    });
    if (!current) throw new HTTPException(404, { message: "Parti yok" });
    await prisma.electionParty.delete({ where: { id: partyId } });
    await refreshStripCache(current.electionId);
    return c.json({ ok: true });
  },
);

electionRoutes.post(
  "/:id/regions",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const electionId = c.req.param("id")!;
    const body = z
      .object({
        name: z.string().min(2),
        slug: z.string().min(2),
        level: z.enum(["ulke", "il", "ilce", "belde"]),
        parentId: z.string().optional().nullable(),
        ballotTotal: z.number().int().min(0).optional().default(0),
      })
      .parse(await c.req.json());
    const region = await prisma.electionRegion.create({
      data: {
        electionId,
        name: body.name,
        slug: body.slug,
        level: body.level,
        parentId: body.parentId || null,
        ballotTotal: body.ballotTotal ?? 0,
      },
    });
    return c.json({ region }, 201);
  },
);

/** İttifak oluştur */
electionRoutes.post(
  "/:id/alliances",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const electionId = c.req.param("id")!;
    const body = z
      .object({
        name: z.string().min(2),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      })
      .parse(await c.req.json());
    const alliance = await prisma.electionAlliance.create({
      data: {
        electionId,
        name: body.name,
        color: body.color.toUpperCase(),
      },
    });
    return c.json({ alliance }, 201);
  },
);

electionRoutes.post(
  "/:id/races",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const electionId = c.req.param("id")!;
    const body = z
      .object({
        regionId: z.string(),
        type: z.enum([
          "baskanlik",
          "meclis",
          "il_genel",
          "muhtarlik",
          "milletvekili",
          "cumhurbaskanligi",
        ]),
        name: z.string().min(3),
        seatCount: z.number().int().positive().optional().nullable(),
        round: z.number().int().min(1).max(2).default(1),
        isFeatured: z.boolean().optional().default(false),
      })
      .parse(await c.req.json());

    if (body.isFeatured) {
      await prisma.electionRace.updateMany({
        where: { electionId, isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const race = await prisma.electionRace.create({
      data: {
        electionId,
        regionId: body.regionId,
        type: body.type,
        name: body.name,
        seatCount: body.seatCount ?? null,
        round: body.round,
        isFeatured: body.isFeatured,
      },
    });
    return c.json({ race }, 201);
  },
);

/** Yarış meta — featured (üst bar), ad, not tonu */
electionRoutes.patch(
  "/races/:raceId",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const raceId = c.req.param("raceId")!;
    const body = z
      .object({
        name: z.string().min(3).optional(),
        isFeatured: z.boolean().optional(),
        note: z.string().optional().nullable(),
        noteTone: z.enum(["info", "warn", "ok"]).optional(),
        seatCount: z.number().int().positive().optional().nullable(),
      })
      .parse(await c.req.json());

    const current = await prisma.electionRace.findUnique({
      where: { id: raceId },
    });
    if (!current) throw new HTTPException(404, { message: "Yarış yok" });

    if (body.isFeatured === true) {
      await prisma.electionRace.updateMany({
        where: { electionId: current.electionId, isFeatured: true },
        data: { isFeatured: false },
      });
    }

    await prisma.electionRace.update({
      where: { id: raceId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.isFeatured !== undefined
          ? { isFeatured: body.isFeatured }
          : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        ...(body.noteTone !== undefined ? { noteTone: body.noteTone } : {}),
        ...(body.seatCount !== undefined
          ? { seatCount: body.seatCount }
          : {}),
      },
    });

    await refreshStripCache(current.electionId);
    const mapped = await mapRace(raceId);
    return c.json({ race: mapped });
  },
);

electionRoutes.post(
  "/races/:raceId/candidates",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const raceId = c.req.param("raceId")!;
    const body = z
      .object({
        name: z.string().min(2),
        partyId: z.string().optional().nullable(),
        initials: z.string().optional().default(""),
        photoUrl: z.string().optional().nullable(),
        listOrder: z.number().int().optional(),
        showInStrip: z.boolean().optional().default(false),
        stripPin: z.number().int().optional().nullable(),
      })
      .parse(await c.req.json());

    const count = await prisma.electionCandidate.count({ where: { raceId } });
    const cand = await prisma.electionCandidate.create({
      data: {
        raceId,
        name: body.name,
        partyId: body.partyId || null,
        initials: body.initials,
        photoUrl: body.photoUrl || null,
        listOrder: body.listOrder ?? count + 1,
        showInStrip: body.showInStrip,
        stripPin: body.stripPin ?? null,
      },
    });
    return c.json({ candidate: cand }, 201);
  },
);

/** Aday güncelle */
electionRoutes.patch(
  "/candidates/:candidateId",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const candidateId = c.req.param("candidateId")!;
    const body = z
      .object({
        name: z.string().min(2).optional(),
        partyId: z.string().optional().nullable(),
        initials: z.string().optional(),
        photoUrl: z.string().optional().nullable(),
        listOrder: z.number().int().optional(),
        showInStrip: z.boolean().optional(),
        stripPin: z.number().int().optional().nullable(),
      })
      .parse(await c.req.json());

    const current = await prisma.electionCandidate.findUnique({
      where: { id: candidateId },
      include: { race: { select: { electionId: true } } },
    });
    if (!current) throw new HTTPException(404, { message: "Aday yok" });

    const candidate = await prisma.electionCandidate.update({
      where: { id: candidateId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.partyId !== undefined
          ? { partyId: body.partyId || null }
          : {}),
        ...(body.initials !== undefined ? { initials: body.initials } : {}),
        ...(body.photoUrl !== undefined
          ? { photoUrl: body.photoUrl || null }
          : {}),
        ...(body.listOrder !== undefined ? { listOrder: body.listOrder } : {}),
        ...(body.showInStrip !== undefined
          ? { showInStrip: body.showInStrip }
          : {}),
        ...(body.stripPin !== undefined
          ? { stripPin: body.stripPin ?? null }
          : {}),
      },
    });
    await refreshStripCache(current.race.electionId);
    return c.json({ candidate });
  },
);

electionRoutes.delete(
  "/candidates/:candidateId",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const candidateId = c.req.param("candidateId")!;
    const current = await prisma.electionCandidate.findUnique({
      where: { id: candidateId },
      include: { race: { select: { electionId: true } } },
    });
    if (!current) throw new HTTPException(404, { message: "Aday yok" });
    await prisma.electionCandidate.delete({ where: { id: candidateId } });
    await refreshStripCache(current.race.electionId);
    return c.json({ ok: true });
  },
);

/** Sonuç toplu güncelle + D'Hondt */
electionRoutes.put(
  "/races/:raceId/results",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const raceId = c.req.param("raceId")!;
    const body = z
      .object({
        regionId: z.string().optional(),
        results: z.array(ElectionResultPatchSchema).min(1),
        ballot: ElectionBallotPatchSchema.optional(),
        note: z.string().optional().nullable(),
        noteTone: z.enum(["info", "warn", "ok"]).optional(),
        recomputeSeats: z.boolean().optional().default(true),
      })
      .parse(await c.req.json());

    const race = await prisma.electionRace.findUnique({ where: { id: raceId } });
    if (!race) throw new HTTPException(404, { message: "Yarış yok" });
    const regionId = body.regionId || race.regionId;

    await prisma.$transaction(async (tx) => {
      for (const row of body.results) {
        await tx.electionResult.upsert({
          where: {
            raceId_regionId_candidateId: {
              raceId,
              regionId,
              candidateId: row.candidateId,
            },
          },
          create: {
            raceId,
            regionId,
            candidateId: row.candidateId,
            votes: row.votes,
            source: row.source,
          },
          update: {
            votes: row.votes,
            source: row.source,
          },
        });
      }

      if (body.ballot) {
        await tx.electionRegion.update({
          where: { id: regionId },
          data: {
            ...(body.ballot.ballotOpen !== undefined
              ? { ballotOpen: body.ballot.ballotOpen }
              : {}),
            ...(body.ballot.ballotTotal !== undefined
              ? { ballotTotal: body.ballot.ballotTotal }
              : {}),
            ...(body.ballot.source
              ? { source: body.ballot.source, sourceUpdatedAt: new Date() }
              : { sourceUpdatedAt: new Date() }),
          },
        });
      }

      if (body.note !== undefined || body.noteTone) {
        await tx.electionRace.update({
          where: { id: raceId },
          data: {
            ...(body.note !== undefined ? { note: body.note } : {}),
            ...(body.noteTone ? { noteTone: body.noteTone } : {}),
          },
        });
      }
    });

    if (
      body.recomputeSeats &&
      (race.type === "meclis" || race.type === "milletvekili" || race.type === "il_genel")
    ) {
      await recomputeSeats(raceId);
    }

    await refreshStripCache(race.electionId);
    const mapped = await mapRace(raceId);
    return c.json({ race: mapped });
  },
);

electionRoutes.post(
  "/races/:raceId/recompute-seats",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const raceId = c.req.param("raceId")!;
    await recomputeSeats(raceId);
    const mapped = await mapRace(raceId);
    return c.json({ race: mapped });
  },
);

electionRoutes.post(
  "/:id/refresh-strip",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const strip = await refreshStripCache(c.req.param("id")!);
    return c.json({ strip });
  },
);
