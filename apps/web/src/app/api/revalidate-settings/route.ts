import { expandCacheTags } from "@yenihaber/shared";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Legacy: ayarlar kaydı. Tercihen /api/revalidate + tags: ["ayarlar"] kullanın.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const hdr = req.headers.get("x-revalidate-secret");
  if (!secret || hdr !== secret) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }
  for (const t of expandCacheTags(["ayarlar"])) {
    revalidateTag(t);
  }
  return NextResponse.json({ revalidated: true, tags: expandCacheTags(["ayarlar"]) });
}
