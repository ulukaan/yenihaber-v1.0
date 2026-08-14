import { getMarketsSnapshot } from "@yenihaber/shared";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Kind = "fx" | "gold" | "crypto";

function isKind(v: string): v is Kind {
  return v === "fx" || v === "gold" || v === "crypto";
}

/**
 * Tek kategori: /api/live/markets/fx | gold | crypto
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const { kind } = await context.params;
  if (!isKind(kind)) {
    return NextResponse.json({ message: "Geçersiz tür" }, { status: 404 });
  }
  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";
  const data = await getMarketsSnapshot(force);
  return NextResponse.json({
    items: data[kind],
    source: data.source,
    updatedAt: data.updatedAt,
  });
}
