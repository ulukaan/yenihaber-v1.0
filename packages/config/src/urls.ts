/** Loopback / geliştirme adresleri — canlıda asla yedek olarak kullanılmaz */

const LOOPBACK =
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?/i;

export function isLoopbackUrl(url: string | undefined | null): boolean {
  const v = (url ?? "").trim();
  if (!v) return true;
  return LOOPBACK.test(v) || v.includes("localhost:") || v.includes("127.0.0.1");
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** İlk geçerli, loopback olmayan URL */
export function firstPublicUrl(
  ...candidates: Array<string | undefined | null>
): string {
  for (const c of candidates) {
    const v = (c ?? "").trim();
    if (!v || isLoopbackUrl(v)) continue;
    return stripSlash(v);
  }
  return "";
}

function isProd(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production";
}

/**
 * API kökü. Tarayıcıda her zaman aynı origin `/api/v1` (http/https ve CORS kırılmaz).
 */
export function resolveApiBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
  originHint?: string,
): string {
  if (typeof window !== "undefined") return "/api/v1";

  const explicit = firstPublicUrl(
    env.API_INTERNAL_URL,
    env.NEXT_PUBLIC_API_URL,
    env.API_PUBLIC_URL,
  );
  if (explicit) {
    if (isProd(env) && explicit.startsWith("http://")) {
      return `https://${explicit.slice("http://".length)}`;
    }
    return explicit;
  }
  if (isProd(env)) {
    const site = firstPublicUrl(
      originHint,
      env.PUBLIC_SITE_URL,
      env.NEXT_PUBLIC_SITE_URL,
      env.NEXT_PUBLIC_WEB_URL,
    );
    if (site) {
      const httpsSite = site.startsWith("http://")
        ? `https://${site.slice("http://".length)}`
        : site;
      return `${httpsSite}/api/v1`;
    }
    return "/api/v1";
  }
  return "/api/v1";
}

/** Site origin. Canlıda localhost:3000 yok. */
export function resolveSiteOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = firstPublicUrl(
    env.PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_WEB_URL,
  );
  if (explicit) {
    if (isProd(env) && explicit.startsWith("http://")) {
      return `https://${explicit.slice("http://".length)}`;
    }
    return explicit;
  }
  if (isProd(env)) return "";
  return "http://localhost:3000";
}

/** Admin origin. Tanımsızsa boş — localhost:3001 üretilmez. */
export function resolveAdminOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return firstPublicUrl(env.ADMIN_PUBLIC_URL, env.NEXT_PUBLIC_ADMIN_URL);
}

export function resolveRevalidateOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return firstPublicUrl(
    env.WEB_REVALIDATE_URL,
    env.NEXT_PUBLIC_WEB_URL,
    env.PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_SITE_URL,
  );
}

export function siteHref(
  path: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const origin = resolveSiteOrigin(env);
  const p = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${p}` : p;
}

/** CORS listesi — canlıda localhost atılır */
export function resolveCorsOrigins(
  raw: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const parts = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cleaned = (isProd(env)
    ? parts.filter((p) => !isLoopbackUrl(p))
    : parts
  ).map((p) =>
    isProd(env) && p.startsWith("http://")
      ? `https://${p.slice("http://".length)}`
      : p,
  );
  const site = resolveSiteOrigin(env);
  if (site && !cleaned.includes(site)) cleaned.push(site);
  if (!cleaned.length && !isProd(env)) {
    return ["http://localhost:3000", "http://localhost:3001"];
  }
  return cleaned;
}
