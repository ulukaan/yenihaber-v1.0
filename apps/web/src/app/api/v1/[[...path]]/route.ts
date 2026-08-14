import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hono API — Hostinger’da tek Next süreci. /api/v1/*
 */
async function handle(req: NextRequest) {
  try {
    const { getApiApp } = await import("@yenihaber/api/app");
    return getApiApp().fetch(req);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "API yüklenemedi";
    console.error("API route", error);
    return Response.json({ message }, { status: 503 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
