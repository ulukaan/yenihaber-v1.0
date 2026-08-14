import { prisma } from "@yenihaber/database";
import {
  allocateDhondt,
  type ApiElectionCandidate,
  type ApiElectionRace,
  type ApiElectionStrip,
  type ElectionRaceType,
} from "@yenihaber/shared";

function ballotPct(open: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((open / total) * 1000) / 10;
}

function initialsOf(name: string, fallback = "") {
  if (fallback.trim()) return fallback.trim().slice(0, 3).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export async function mapRace(
  raceId: string,
  opts?: { compareRegionId?: string },
): Promise<ApiElectionRace | null> {
  const race = await prisma.electionRace.findUnique({
    where: { id: raceId },
    include: {
      region: true,
      candidates: {
        include: { party: { include: { alliance: true } } },
        orderBy: { listOrder: "asc" },
      },
      seats: { include: { party: { include: { alliance: true } } } },
      results: true,
      election: { include: { alliances: true } },
    },
  });
  if (!race) return null;

  function pack(regionId: string) {
    const votesByCand = new Map<string, number>();
    let latest: Date | null = null;
    for (const r of race!.results) {
      if (r.regionId !== regionId) continue;
      votesByCand.set(
        r.candidateId,
        (votesByCand.get(r.candidateId) ?? 0) + r.votes,
      );
      if (!latest || r.updatedAt > latest) latest = r.updatedAt;
    }
    const totalVotes = [...votesByCand.values()].reduce((s, n) => s + n, 0);
    const candidates: ApiElectionCandidate[] = race!.candidates
      .filter((c) => votesByCand.has(c.id) || c.listOrder < 100)
      .map((c) => {
        const votes = votesByCand.get(c.id) ?? 0;
        return {
          id: c.id,
          name: c.name,
          initials: initialsOf(c.name, c.initials),
          photoUrl: c.photoUrl,
          listOrder: c.listOrder,
          showInStrip: c.showInStrip,
          stripPin: c.stripPin,
          party: c.party
            ? {
                id: c.party.id,
                name: c.party.name,
                shortName: c.party.shortName,
                color: c.party.color,
                logoUrl: c.party.logoUrl,
                allianceId: c.party.allianceId,
                allianceName: c.party.alliance?.name ?? null,
                allianceColor: c.party.alliance?.color ?? null,
              }
            : null,
          votes,
          percent:
            totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0,
        };
      })
      .filter((c) => c.votes > 0 || race!.type !== "milletvekili")
      .sort((a, b) => b.votes - a.votes || a.listOrder - b.listOrder);
    return { votesByCand, totalVotes, candidates, latest };
  }

  const primary = pack(race.regionId);
  let compare: ApiElectionRace["compare"] = null;
  if (opts?.compareRegionId) {
    const region = await prisma.electionRegion.findUnique({
      where: { id: opts.compareRegionId },
    });
    if (region) {
      const sec = pack(opts.compareRegionId);
      compare = {
        region: {
          id: region.id,
          name: region.name,
          level: region.level,
          ballotTotal: region.ballotTotal,
          ballotOpen: region.ballotOpen,
          ballotPct: ballotPct(region.ballotOpen, region.ballotTotal),
          source: region.source,
          sourceUpdatedAt: region.sourceUpdatedAt?.toISOString() ?? null,
        },
        candidates: sec.candidates,
        totalVotes: sec.totalVotes,
        updatedAt: sec.latest?.toISOString() ?? null,
      };
    }
  }

  // milletvekili seçilenler (listOrder >= 100)
  const elected =
    race.type === "milletvekili"
      ? race.candidates
          .filter((c) => c.listOrder >= 100)
          .map((c) => ({
            id: c.id,
            name: c.name,
            initials: initialsOf(c.name, c.initials),
            photoUrl: c.photoUrl,
            listOrder: c.listOrder,
            showInStrip: false,
            stripPin: null,
            party: c.party
              ? {
                  id: c.party.id,
                  name: c.party.name,
                  shortName: c.party.shortName,
                  color: c.party.color,
                  logoUrl: c.party.logoUrl,
                  allianceId: c.party.allianceId,
                  allianceName: c.party.alliance?.name ?? null,
                  allianceColor: c.party.alliance?.color ?? null,
                }
              : null,
            votes: 0,
            percent: 0,
          }))
      : [];

  return {
    id: race.id,
    type: race.type as ElectionRaceType,
    name: race.name,
    seatCount: race.seatCount,
    round: race.round,
    status: race.status,
    note: race.note,
    noteTone: race.noteTone,
    isFeatured: race.isFeatured,
    region: {
      id: race.region.id,
      name: race.region.name,
      level: race.region.level,
      ballotTotal: race.region.ballotTotal,
      ballotOpen: race.region.ballotOpen,
      ballotPct: ballotPct(race.region.ballotOpen, race.region.ballotTotal),
      source: race.region.source,
      sourceUpdatedAt: race.region.sourceUpdatedAt?.toISOString() ?? null,
    },
    candidates: primary.candidates,
    elected,
    seats: race.seats
      .map((s) => ({
        partyId: s.partyId,
        partyName: s.party.name,
        color: s.party.color,
        seats: s.seatCount,
        voteShare: Math.round(s.voteShare * 10) / 10,
        confirmed: s.confirmed,
        allianceId: s.party.allianceId,
        allianceName: s.party.alliance?.name ?? null,
        logoUrl: s.party.logoUrl,
      }))
      .sort((a, b) => b.seats - a.seats || b.voteShare - a.voteShare),
    alliances: race.election.alliances.map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
    })),
    totalVotes: primary.totalVotes,
    updatedAt: primary.latest?.toISOString() ?? null,
    compare,
  };
}

/** Parti oylarını topla → D'Hondt → ElectionSeat yaz */
export async function recomputeSeats(raceId: string) {
  const race = await prisma.electionRace.findUnique({
    where: { id: raceId },
    include: {
      candidates: { include: { party: true } },
      results: true,
    },
  });
  if (!race || !race.seatCount || race.seatCount < 1) return [];

  const votesByParty = new Map<string, number>();
  for (const r of race.results) {
    if (r.regionId !== race.regionId) continue;
    const cand = race.candidates.find((c) => c.id === r.candidateId);
    if (!cand?.partyId) continue;
    votesByParty.set(
      cand.partyId,
      (votesByParty.get(cand.partyId) ?? 0) + r.votes,
    );
  }

  // meclis: parti satırları candidate olabilir — partyId üzerinden
  for (const c of race.candidates) {
    if (!c.partyId) continue;
    if (!votesByParty.has(c.partyId)) votesByParty.set(c.partyId, 0);
  }

  const input = [...votesByParty.entries()].map(([id, votes]) => ({ id, votes }));
  const alloc = allocateDhondt(input, race.seatCount);

  await prisma.$transaction(async (tx) => {
    await tx.electionSeat.deleteMany({ where: { raceId } });
    for (const row of alloc) {
      if (row.seats === 0 && row.voteShare === 0) continue;
      await tx.electionSeat.create({
        data: {
          raceId,
          partyId: row.id,
          seatCount: row.seats,
          voteShare: row.voteShare,
          confirmed: false,
        },
      });
    }
  });

  return alloc;
}

export async function buildStrip(
  electionId: string,
): Promise<ApiElectionStrip | null> {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
  });
  if (!election || election.status === "draft") return null;

  const race = await prisma.electionRace.findFirst({
    where: {
      electionId,
      isFeatured: true,
      type: { in: ["baskanlik", "cumhurbaskanligi"] },
    },
    orderBy: { sortOrder: "asc" },
  });
  if (!race) return null;

  const mapped = await mapRace(race.id);
  if (!mapped) return null;

  const pinned = mapped.candidates.filter(
    (c) => c.showInStrip || c.stripPin != null,
  );
  const ordered =
    pinned.length > 0
      ? [...pinned].sort(
          (a, b) =>
            (a.stripPin ?? 999) - (b.stripPin ?? 999) || b.percent - a.percent,
        )
      : [...mapped.candidates].sort((a, b) => b.percent - a.percent);

  /** Header: sabit 1–2 + dönen havuz (3–4) için yeterli aday */
  const top = ordered.slice(0, 12);
  const moreCount = Math.max(0, mapped.candidates.length - top.length);
  const clock = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(mapped.updatedAt || Date.now()));

  const leadPct = Math.max(0, ...top.map((c) => c.percent));

  return {
    enabled: election.status === "live",
    electionId: election.id,
    raceId: mapped.id,
    title: mapped.name,
    live: election.status === "live",
    clock,
    ballotPct: mapped.region.ballotPct,
    ballotLabel: `%${mapped.region.ballotPct.toLocaleString("tr-TR")} sandık`,
    candidates: top.map((c) => ({
      id: c.id,
      name: c.name,
      initials: c.initials,
      photoUrl: c.photoUrl,
      partyName: c.party?.name ?? "Bağımsız",
      partyShortName: c.party?.shortName || c.party?.name || "Bağımsız",
      partyLogoUrl: c.party?.logoUrl ?? null,
      allianceName: c.party?.allianceName ?? null,
      allianceColor: c.party?.allianceColor ?? null,
      color: c.party?.color ?? "#6B7280",
      percent: c.percent,
      leading: c.percent === leadPct && leadPct > 0,
      stripPin: c.stripPin,
    })),
    moreCount,
    href: `/secim`,
    updatedAt: mapped.updatedAt || new Date().toISOString(),
  };
}

/** Strip JSON cache (settings) — 30 sn public cache */
export async function refreshStripCache(electionId: string) {
  const strip = await buildStrip(electionId);
  await prisma.setting.upsert({
    where: { key: "election.strip_json" },
    create: {
      key: "election.strip_json",
      value: JSON.stringify(strip),
      groupName: "content",
    },
    update: {
      value: JSON.stringify(strip),
      groupName: "content",
    },
  });
  await prisma.setting.upsert({
    where: { key: "election.active_id" },
    create: {
      key: "election.active_id",
      value: electionId,
      groupName: "content",
    },
    update: { value: electionId, groupName: "content" },
  });
  return strip;
}

export async function readStripCache(): Promise<ApiElectionStrip | null> {
  const row = await prisma.setting.findUnique({
    where: { key: "election.strip_json" },
  });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as ApiElectionStrip;
  } catch {
    return null;
  }
}
