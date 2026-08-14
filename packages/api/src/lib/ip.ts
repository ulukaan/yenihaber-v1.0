import { createHash } from "node:crypto";

/** 5651 / tekrar engeli — ham IP kullanıcıya gösterilmez */
export function hashIp(ip: string | undefined | null): string {
  const raw = (ip || "unknown").trim() || "unknown";
  const salt = process.env.IP_HASH_SALT || "yenihaber-ip-salt";
  return createHash("sha256").update(`${salt}:${raw}`).digest("hex").slice(0, 40);
}

/** Yorum/tepki mükerrer — IP + User-Agent */
export function hashIpUa(
  ip: string | undefined | null,
  userAgent: string | undefined | null,
): string {
  const salt = process.env.IP_HASH_SALT || "yenihaber-ip-salt";
  const raw = `${(ip || "unknown").trim()}|${(userAgent || "").trim().slice(0, 240)}`;
  return createHash("sha256").update(`${salt}:ipua:${raw}`).digest("hex").slice(0, 40);
}

export function clientIp(headers: Headers, fallback = "unknown"): string {
  const xf = headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || fallback;
  return headers.get("x-real-ip")?.trim() || fallback;
}

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|wget|curl|python-requests|headless|phantom|selenium|lighthouse|pagespeed/i;

export function isBotUserAgent(ua: string | undefined | null): boolean {
  if (!ua?.trim()) return true;
  return BOT_UA.test(ua);
}
