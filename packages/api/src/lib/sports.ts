/**
 * ESPN public API — Süper Lig skor, program, puan.
 * Kaynak: site.api.espn.com (ücretsiz, anahtar yok)
 */

import type {
  ApiSportFixture,
  ApiSportMatch,
  ApiSports,
  ApiSportStanding,
} from "@yenihaber/shared";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const SUPER_LIG = "tur.1";

/** Canlı çeşitlilik için (kendi ligi de dahil) */
const LIVE_LEAGUES = [
  "tur.1",
  "eng.1",
  "esp.1",
  "ger.1",
  "ita.1",
] as const;

const HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "Yenihaber/1.0 (+sports-panel)",
};

type CacheEntry = { at: number; data: ApiSports };
let cache: CacheEntry | null = null;
const TTL_MS = 45_000;

const FALLBACK: ApiSports = {
  live: [],
  recent: [],
  fixtures: [],
  standings: [],
  leagueName: "Süper Lig",
  source: "fallback",
  updatedAt: new Date().toISOString(),
};

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type EspnCompetitor = {
  homeAway?: string;
  score?: string;
  team?: { displayName?: string; shortDisplayName?: string; abbreviation?: string };
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  shortName?: string;
  status?: {
    type?: {
      state?: string;
      completed?: boolean;
      description?: string;
      shortDetail?: string;
      detail?: string;
    };
    displayClock?: string;
    period?: number;
  };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    status?: EspnEvent["status"];
  }>;
};

type EspnScoreboard = {
  leagues?: Array<{ name?: string; abbreviation?: string }>;
  events?: EspnEvent[];
};

type EspnStandingEntry = {
  team?: { displayName?: string; shortDisplayName?: string };
  stats?: Array<{ name?: string; value?: number; displayValue?: string }>;
};

type EspnStandings = {
  children?: Array<{
    standings?: { entries?: EspnStandingEntry[] };
  }>;
  standings?: Array<{ entries?: EspnStandingEntry[] }>;
};

function teamName(c?: EspnCompetitor): string {
  return (
    c?.team?.displayName?.trim() ||
    c?.team?.shortDisplayName?.trim() ||
    c?.team?.abbreviation?.trim() ||
    "—"
  );
}

function scoreOf(c?: EspnCompetitor): number {
  const n = Number(c?.score ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function fmtClockTr(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function mapMinute(
  status: EspnEvent["status"] | undefined,
  kickoff: string | undefined,
): { minute: string; state: ApiSportMatch["status"] } {
  const state = status?.type?.state ?? "pre";
  if (state === "in") {
    const desc = (status?.type?.description ?? "").toLowerCase();
    const detail = (status?.type?.shortDetail ?? "").toUpperCase();
    if (
      desc.includes("half") ||
      detail === "HT" ||
      detail.includes("HALFTIME")
    ) {
      return { minute: "HT", state: "live" };
    }
    const clock = (status?.displayClock ?? "").trim();
    if (clock && clock !== "0'") {
      const bare = clock.endsWith("'") ? clock : `${clock}'`;
      return { minute: bare, state: "live" };
    }
    return { minute: "Canlı", state: "live" };
  }
  if (state === "post") {
    return { minute: "MS", state: "finished" };
  }
  return { minute: fmtClockTr(kickoff), state: "scheduled" };
}

function eventToMatch(e: EspnEvent, league: string): ApiSportMatch | null {
  const comp = e.competitions?.[0];
  const status = comp?.status ?? e.status;
  const comps = comp?.competitors ?? [];
  const home = comps.find((c) => c.homeAway === "home") ?? comps[0];
  const away = comps.find((c) => c.homeAway === "away") ?? comps[1];
  if (!home || !away) return null;

  const { minute, state } = mapMinute(status, e.date);
  return {
    id: String(e.id ?? `${teamName(home)}-${teamName(away)}-${e.date ?? ""}`),
    league,
    home: teamName(home),
    away: teamName(away),
    homeScore: state === "scheduled" ? 0 : scoreOf(home),
    awayScore: state === "scheduled" ? 0 : scoreOf(away),
    minute,
    status: state,
    kickoff: e.date ?? null,
  };
}

async function scoreboard(
  league: string,
  dates?: string,
): Promise<{ leagueName: string; matches: ApiSportMatch[] }> {
  const qs = dates ? `?dates=${dates}` : "";
  const data = await fetchJson<EspnScoreboard>(`${ESPN}/${league}/scoreboard${qs}`);
  const leagueName =
    data?.leagues?.[0]?.name?.replace(/^Turkish\s+/i, "") ?? league;
  const nameMap: Record<string, string> = {
    "Turkish Super Lig": "Süper Lig",
    "Super Lig": "Süper Lig",
    "English Premier League": "Premier League",
    "Spanish LALIGA": "La Liga",
    "German Bundesliga": "Bundesliga",
    "Italian Serie A": "Serie A",
    "French Ligue 1": "Ligue 1",
    "UEFA Champions League": "Şampiyonlar Ligi",
    "UEFA Europa League": "Avrupa Ligi",
  };
  const pretty = nameMap[data?.leagues?.[0]?.name ?? ""] ?? leagueName;

  const matches = (data?.events ?? [])
    .map((e) => eventToMatch(e, pretty))
    .filter((m): m is ApiSportMatch => Boolean(m));

  return { leagueName: pretty, matches };
}

async function fetchStandings(): Promise<ApiSportStanding[]> {
  const data = await fetchJson<EspnStandings>(
    `https://site.api.espn.com/apis/v2/sports/soccer/${SUPER_LIG}/standings`,
  );
  const entries =
    data?.children?.[0]?.standings?.entries ??
    data?.standings?.[0]?.entries ??
    [];

  const rows = entries.map((entry, i) => {
    const stats = entry.stats ?? [];
    const get = (name: string) =>
      stats.find((s) => s.name === name)?.value ?? 0;
    return {
      pos: Number(get("rank")) || i + 1,
      team:
        entry.team?.displayName?.trim() ||
        entry.team?.shortDisplayName?.trim() ||
        "—",
      played: Number(get("gamesPlayed")) || 0,
      pts: Number(get("points")) || 0,
      diff: Number(get("pointDifferential")) || 0,
    };
  });

  rows.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.diff - a.diff ||
      a.pos - b.pos ||
      a.team.localeCompare(b.team, "tr"),
  );

  return rows.map((r, i) => ({
    pos: i + 1,
    team: r.team,
    played: r.played,
    pts: r.pts,
  }));
}

function dedupeMatches(list: ApiSportMatch[]): ApiSportMatch[] {
  const seen = new Set<string>();
  const out: ApiSportMatch[] = [];
  for (const m of list) {
    const key = `${m.league}|${m.home}|${m.away}|${m.kickoff ?? m.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

/**
 * Spor paneli verisi (cache 45 sn).
 */
export async function getSportsSnapshot(force = false): Promise<ApiSports> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.data;
  }

  const now = new Date();
  const superRange = `${ymd(addDays(now, -10))}-${ymd(addDays(now, 14))}`;

  const [superSb, standings, ...otherBoards] = await Promise.all([
    scoreboard(SUPER_LIG, superRange),
    fetchStandings(),
    ...LIVE_LEAGUES.filter((l) => l !== SUPER_LIG).map((l) => scoreboard(l)),
  ]);

  const allLivePool = dedupeMatches([
    ...superSb.matches,
    ...otherBoards.flatMap((b) => b.matches),
  ]);
  const live = allLivePool
    .filter((m) => m.status === "live")
    .sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""));

  const superMatches = superSb.matches;
  const recent = superMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""))
    .slice(0, 8);

  // Canlı yoksa panoda Avrupa/Türkiye biten son skorlar da
  const recentGlobal =
    recent.length > 0
      ? recent
      : allLivePool
          .filter((m) => m.status === "finished")
          .sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""))
          .slice(0, 8);

  const fixtures: ApiSportFixture[] = superMatches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? ""))
    .slice(0, 12)
    .map((m) => ({
      id: m.id,
      time: m.minute,
      home: m.home,
      away: m.away,
      league: m.league,
      kickoff: m.kickoff,
    }));

  const hasAny =
    live.length + recentGlobal.length + fixtures.length + standings.length > 0;

  const data: ApiSports = hasAny
    ? {
        live,
        recent: recentGlobal,
        fixtures,
        standings: standings.length ? standings : FALLBACK.standings,
        leagueName: superSb.leagueName || "Süper Lig",
        source: "espn",
        updatedAt: new Date().toISOString(),
      }
    : { ...FALLBACK, updatedAt: new Date().toISOString() };

  cache = { at: Date.now(), data };
  return data;
}
