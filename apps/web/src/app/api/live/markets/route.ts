import { getMarketsSnapshot } from "@yenihaber/shared";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Canlı döviz / altın / kripto — Next üzerinden (Hono API şart değil).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";
  const data = await getMarketsSnapshot(force);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
