import { listCities, DEFAULT_CITY_SLUG } from "@yenihaber/shared";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * 81 il listesi — GET /api/live/prayer/cities
 */
export async function GET() {
  return NextResponse.json({
    cities: listCities(),
    defaultCity: DEFAULT_CITY_SLUG,
  });
}
