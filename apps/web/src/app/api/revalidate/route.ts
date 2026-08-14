import { expandCacheTags } from "@yenihaber/shared";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Panel/API → site önbellek temizliği.
 * Header: x-revalidate-secret = REVALIDATE_SECRET
 * Body: { paths?: string[]; tags?: string[] }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  let body: { paths?: string[]; tags?: string[] } = {};
  try {
    body = (await req.json()) as { paths?: string[]; tags?: string[] };
  } catch {
    body = {};
  }

  const paths = body.paths?.length ? body.paths : ["/"];
  const tags = expandCacheTags(body.tags ?? []);

  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      /* path yoksa yut */
    }
  }
  for (const t of tags) {
    try {
      revalidateTag(t);
    } catch {
      /* */
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    paths,
    tags,
    at: new Date().toISOString(),
  });
}
