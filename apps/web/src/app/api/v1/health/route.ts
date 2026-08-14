import { apiHealthPayload } from "@yenihaber/api/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await apiHealthPayload();
  return Response.json(body, { status: body.ok ? 200 : 503 });
}
