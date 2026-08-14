import { createHash } from "node:crypto";
import { z } from "zod";
import { resolveCorsOrigins } from "./urls";

/** JWT yoksa DATABASE_URL’den türetilir — Hostinger panelinde unutulmasın diye */
export function ensureJwtSecret(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const existing = (env.JWT_SECRET ?? "").trim();
  if (existing.length >= 16) return existing;
  const seed = (env.DATABASE_URL ?? env.HOSTNAME ?? "yenihaber").trim();
  const derived = createHash("sha256").update(`yh-jwt:${seed}`).digest("hex");
  env.JWT_SECRET = derived;
  return derived;
}

const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default("api/v1"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ApiEnv = Omit<z.infer<typeof apiEnvSchema>, "CORS_ORIGIN"> & {
  CORS_ORIGIN: string;
};

export function loadApiEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  ensureJwtSecret(source);
  const parsed = apiEnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Geçersiz API ortamı: ${details}`);
  }
  return {
    ...parsed.data,
    CORS_ORIGIN: resolveCorsOrigins(parsed.data.CORS_ORIGIN, source).join(","),
  };
}
