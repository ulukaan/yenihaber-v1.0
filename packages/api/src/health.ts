import { prisma } from "@yenihaber/database";
import { loadApiEnv } from "@yenihaber/config/server";

export type ApiHealth = {
  ok: boolean;
  service: "yenihaber-api";
  stage: "ok" | "load-env" | "prisma-connect";
  node: string;
  hasDbUrl: boolean;
  error?: string;
};

function fail(
  stage: ApiHealth["stage"],
  error: unknown,
): ApiHealth {
  return {
    ok: false,
    service: "yenihaber-api",
    stage,
    node: process.version,
    hasDbUrl: Boolean(process.env.DATABASE_URL?.trim()),
    error: error instanceof Error ? error.message : String(error),
  };
}

/** Konuşkan health — 503’te stage belli olsun */
export async function apiHealthPayload(): Promise<ApiHealth> {
  const base = {
    service: "yenihaber-api" as const,
    node: process.version,
    hasDbUrl: Boolean(process.env.DATABASE_URL?.trim()),
  };

  try {
    loadApiEnv(process.env);
  } catch (error) {
    return fail("load-env", error);
  }

  try {
    const ping = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("prisma ping timeout 5s")), 5000);
    });
    await Promise.race([ping, timeout]);
    return { ok: true, stage: "ok", ...base };
  } catch (error) {
    return fail("prisma-connect", error);
  }
}
