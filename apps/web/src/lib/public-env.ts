import {
  resolveAdminOrigin,
  resolveApiBaseUrl,
  resolveSiteOrigin,
  siteHref,
} from "@yenihaber/config";

function webApiBase(): string {
  if (typeof window !== "undefined") return "/api/v1";
  const resolved = resolveApiBaseUrl();
  if (
    !resolved ||
    resolved.includes("127.0.0.1") ||
    resolved.includes("localhost")
  ) {
    const site = resolveSiteOrigin();
    return site ? `${site}/api/v1` : "/api/v1";
  }
  return resolved;
}

export const API_BASE = webApiBase();
export const SITE_ORIGIN = resolveSiteOrigin();
export const ADMIN_ORIGIN = resolveAdminOrigin();

export { siteHref, resolveApiBaseUrl, resolveSiteOrigin, resolveAdminOrigin };
