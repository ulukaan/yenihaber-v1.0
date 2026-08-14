import { authJson, authOptions } from "@/lib/member-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return authOptions(req);
}

/** Hono yüklenmese de sağlık kontrolü Next’ten döner */
export function GET(req: Request) {
  return authJson(req, { ok: true, service: "yenihaber-api" });
}
