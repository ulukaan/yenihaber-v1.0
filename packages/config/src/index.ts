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

/**
 * Marka renkleri (kurumsal palet + haber sitesi kırmızı aksan — birhaber theme_color referansı).
 */
export const brandTheme = {
  primary: "#2B2D42",
  secondary: "#8D99AE",
  accent: "#EF233C",
  success: "#06D6A0",
  warning: "#FFD166",
  danger: "#EF476F",
  surface: "#F8F9FA",
  text: "#1A1B23",
  textMuted: "#5C6370",
  border: "#E2E5EB",
  darkBg: "#12131A",
  darkSurface: "#1C1E28",
} as const;

export const siteDefaults = {
  name: "Yenihaber",
  tagline: "Güncel haberler, son dakika ve yerel gündem",
  locale: "tr-TR",
  timezone: "Europe/Istanbul",
} as const;

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

export const navCategories = [
  { name: "Gündem", slug: "gundem" },
  { name: "Spor", slug: "spor" },
  { name: "Ekonomi", slug: "ekonomi" },
  { name: "Dünya", slug: "dunya" },
  { name: "Teknoloji", slug: "teknoloji" },
  { name: "Sağlık", slug: "saglik" },
] as const;

export {
  isLoopbackUrl,
  firstPublicUrl,
  resolveApiBaseUrl,
  resolveSiteOrigin,
  resolveAdminOrigin,
  resolveRevalidateOrigin,
  resolveCorsOrigins,
  siteHref,
} from "./urls";
