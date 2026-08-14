import { getPrayerTimes, DEFAULT_CITY_SLUG } from "@yenihaber/shared";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Namaz vakitleri — GET /api/live/prayer?city=duzce
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? DEFAULT_CITY_SLUG;
  const force = url.searchParams.get("refresh") === "1";
  const data = await getPrayerTimes(city, force);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
    },
  });
}
