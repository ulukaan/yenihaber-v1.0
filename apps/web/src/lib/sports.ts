import type { ApiSports } from "@yenihaber/shared";
import { publicApi } from "@/lib/api";
import {
  fixtures as fallbackFixtures,
  liveScores as fallbackLive,
  standings as fallbackStandings,
} from "@/lib/live-data";

const empty: ApiSports = {
  live: fallbackLive.map((m, i) => ({
    id: `demo-live-${i}`,
    league: m.league,
    home: m.home,
    away: m.away,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    minute: m.minute,
    status:
      m.minute.endsWith("'") || m.minute === "HT"
        ? ("live" as const)
        : m.minute === "MS" || m.minute === "FT"
          ? ("finished" as const)
          : ("scheduled" as const),
    kickoff: null,
  })),
  recent: [],
  fixtures: fallbackFixtures.map((f, i) => ({
    id: `demo-fix-${i}`,
    time: f.time,
    home: f.home,
    away: f.away,
    league: f.league,
    kickoff: null,
  })),
  standings: fallbackStandings.map((r) => ({
    pos: r.pos,
    team: r.team,
    played: r.played,
    pts: r.pts,
  })),
  leagueName: "Süper Lig",
  source: "demo",
  updatedAt: new Date().toISOString(),
};

/** Sunucu tarafı spor verisi (API → ESPN proxy) */
export async function getSports(): Promise<ApiSports> {
  try {
    return await publicApi.sports.get();
  } catch {
    return empty;
  }
}
