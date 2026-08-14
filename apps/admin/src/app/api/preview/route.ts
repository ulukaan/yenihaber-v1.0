import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Panel sunucu tarafı → site draftMode (gizli anahtar istemciye sızmaz).
 * ?path=/haber/slug — önizlenecek sayfa
 */
export async function GET(req: NextRequest) {
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "REVALIDATE_SECRET tanımlı değil" },
      { status: 500 },
    );
  }
  const pathParam = req.nextUrl.searchParams.get("path") || "/";
  const path = pathParam.startsWith("/") ? pathParam : `/${pathParam}`;
  redirect(
    `${site}/api/draft?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`,
  );
}
