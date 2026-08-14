import "server-only";
import type { NextRequest } from "next/server";
import { getApiApp } from "@yenihaber/api/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hono API — aynı Node süreci. Dinamik import Hostinger’da paketi
 * çözemeyince 503 “API yüklenemedi” dönüyordu.
 */
async function handle(req: NextRequest) {
  try {
    return await getApiApp().fetch(req);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "API yüklenemedi";
    console.error("API route", error);
    const origin = req.headers.get("origin") ?? "*";
    return Response.json(
      { message },
      {
        status: 503,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods":
            "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        },
      },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
