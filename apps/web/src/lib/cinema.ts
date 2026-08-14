import type { ApiCinema } from "@yenihaber/shared";
import { publicApi } from "@/lib/api";

const empty: ApiCinema = {
  films: [],
  source: "beyazperde",
  listUrl: "https://www.beyazperde.com/filmler/vizyondakiler/sinema-sayisi/",
  updatedAt: new Date().toISOString(),
};

/** Sunucu tarafı vizyon verisi (API → Beyazperde) */
export async function getCinema(): Promise<ApiCinema> {
  try {
    return await publicApi.cinema.get();
  } catch {
    return empty;
  }
}
