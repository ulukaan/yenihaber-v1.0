import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLoopbackUrl, resolveApiBaseUrl } from "@yenihaber/config";

function apiBase(request: NextRequest): string {
  const fromEnv = resolveApiBaseUrl();
  if (fromEnv && !fromEnv.startsWith("/") && !isLoopbackUrl(fromEnv)) {
    return fromEnv;
  }
  return `${request.nextUrl.origin}/api/v1`;
}

/**
 * Redirect + bakım modu
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const api = apiBase(request);

  if (
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/brand")
  ) {
    try {
      const res = await fetch(`${api}/settings`, {
        next: { revalidate: 15 },
      });
      if (res.ok) {
        const s = (await res.json()) as Record<string, string>;
        if (s["site.maintenanceEnabled"] === "1") {
          const white = (s["site.maintenanceWhitelistIp"] || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "";
          if (!ip || !white.includes(ip)) {
            if (!pathname.startsWith("/bakim")) {
              const url = request.nextUrl.clone();
              url.pathname = "/bakim";
              return NextResponse.rewrite(url);
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (
    !pathname.startsWith("/kategori/") &&
    !pathname.startsWith("/haber/") &&
    !pathname.startsWith("/etiket/")
  ) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(
      `${api}/redirects/lookup?path=${encodeURIComponent(pathname)}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return NextResponse.next();
    const data = (await res.json()) as {
      found?: boolean;
      toPath?: string;
      code?: number;
    };
    if (data.found && data.toPath && data.toPath !== pathname) {
      const url = request.nextUrl.clone();
      const target = data.toPath;
      if (target.startsWith("http")) {
        return NextResponse.redirect(target, data.code ?? 301);
      }
      url.pathname = target.split("?")[0]!;
      return NextResponse.redirect(url, data.code ?? 301);
    }
  } catch {
    /* API yok */
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
