import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_ORIGIN } from "@/lib/public-env";

/**
 * Panel sunucu tarafı → site draftMode (gizli anahtar istemciye sızmaz).
 * ?path=/haber/slug — önizlenecek sayfa
 */
export async function GET(req: NextRequest) {
  const site = SITE_ORIGIN;
  if (!site) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_SITE_URL tanımlı değil" },
      { status: 500 },
    );
  }
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
