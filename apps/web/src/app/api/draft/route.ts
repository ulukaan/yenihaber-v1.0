import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Editör önizleme — ISR/data cache atlanır.
 * GET /api/draft?secret=REVALIDATE_SECRET&path=/
 * Kapat: /api/draft?secret=...&disable=1
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  const dm = await draftMode();
  const disable = req.nextUrl.searchParams.get("disable") === "1";
  if (disable) dm.disable();
  else dm.enable();

  const path = req.nextUrl.searchParams.get("path") || "/";
  redirect(path.startsWith("/") ? path : "/");
}
