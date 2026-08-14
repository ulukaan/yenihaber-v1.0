import "server-only";
import type { NextRequest } from "next/server";
import { getApiApp } from "@yenihaber/api/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failJson(stage: string, error: unknown, origin: string) {
  return Response.json(
    {
      ok: false,
      stage,
      error: error instanceof Error ? error.message : String(error),
      node: process.version,
      hasDbUrl: Boolean(process.env.DATABASE_URL?.trim()),
    },
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

async function handle(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  try {
    const app = getApiApp();
    return await app.fetch(req);
  } catch (error) {
    console.error("API route", error);
    const msg = error instanceof Error ? error.message : String(error);
    const stage = /prisma|datasource|P1001|P1017|engine/i.test(msg)
      ? "prisma-connect"
      : /ortam|JWT|DATABASE_URL/i.test(msg)
        ? "load-env"
        : "load-api";
    return failJson(stage, error, origin);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
