import { z } from "zod";

export const ElectionRaceTypeSchema = z.enum([
  "baskanlik",
  "meclis",
  "il_genel",
  "muhtarlik",
  "milletvekili",
  "cumhurbaskanligi",
]);
export type ElectionRaceType = z.infer<typeof ElectionRaceTypeSchema>;

export const ElectionStatusSchema = z.enum(["draft", "live", "closed"]);
export type ElectionStatus = z.infer<typeof ElectionStatusSchema>;

export type ApiElectionParty = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoUrl: string | null;
  allianceId: string | null;
  allianceName: string | null;
  allianceColor: string | null;
};

export type ApiElectionCandidate = {
  id: string;
  name: string;
  initials: string;
  photoUrl: string | null;
  listOrder: number;
  showInStrip: boolean;
  stripPin: number | null;
  party: ApiElectionParty | null;
  votes: number;
  percent: number;
};

export type ApiElectionSeat = {
  partyId: string;
  partyName: string;
  color: string;
  seats: number;
  voteShare: number;
  confirmed: boolean;
  allianceId: string | null;
  allianceName: string | null;
  logoUrl: string | null;
};

/** İttifak — meclis/TBMM hemicycle kartları */
export type ApiElectionAlliance = {
  id: string;
  name: string;
  color: string;
};

export type ApiElectionRace = {
  id: string;
  type: ElectionRaceType;
  name: string;
  seatCount: number | null;
  round: number;
  status: string;
  note: string | null;
  noteTone: string;
  isFeatured: boolean;
  region: {
    id: string;
    name: string;
    level: string;
    ballotTotal: number;
    ballotOpen: number;
    ballotPct: number;
    source: string;
    sourceUpdatedAt: string | null;
  };
  candidates: ApiElectionCandidate[];
  /** Milletvekili kazananlar */
  elected?: ApiElectionCandidate[];
  seats: ApiElectionSeat[];
  /** Seçime bağlı ittifaklar (koltuk grupları için) */
  alliances: ApiElectionAlliance[];
  totalVotes: number;
  updatedAt: string | null;
  /** CB ülke vs il karşılaştırması */
  compare?: {
    region: ApiElectionRace["region"];
    candidates: ApiElectionCandidate[];
    totalVotes: number;
    updatedAt: string | null;
  } | null;
};

export type ApiElectionStrip = {
  enabled: boolean;
  electionId: string;
  raceId: string;
  title: string;
  live: boolean;
  clock: string;
  ballotPct: number;
  ballotLabel: string;
  candidates: Array<{
    id: string;
    name: string;
    initials: string;
    photoUrl: string | null;
    partyName: string;
    partyShortName: string;
    partyLogoUrl: string | null;
    allianceName: string | null;
    allianceColor: string | null;
    color: string;
    percent: number;
    leading: boolean;
    /** 1–2: header’da sabit slot; diğerleri oy sırasına göre döner */
    stripPin: number | null;
  }>;
  moreCount: number;
  href: string;
  updatedAt: string;
};

export type ApiElectionBundle = {
  election: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    status: ElectionStatus;
  };
  strip: ApiElectionStrip | null;
  races: ApiElectionRace[];
};

export const ElectionResultPatchSchema = z.object({
  candidateId: z.string().min(1),
  votes: z.number().int().min(0),
  source: z.enum(["ajans", "manuel"]).optional().default("manuel"),
});

export const ElectionBallotPatchSchema = z.object({
  ballotOpen: z.number().int().min(0).optional(),
  ballotTotal: z.number().int().min(0).optional(),
  source: z.enum(["ajans", "manuel"]).optional(),
});

export * from "./dhondt";
