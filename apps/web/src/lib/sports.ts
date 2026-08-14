import type { ApiSports } from "@yenihaber/shared";
import { publicApi } from "@/lib/server-api";

const empty: ApiSports = {
  live: [],
  recent: [],
  fixtures: [],
  standings: [],
  leagueName: "Süper Lig",
  source: "",
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
