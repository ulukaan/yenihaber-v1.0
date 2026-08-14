import {
  resolveAdminOrigin,
  resolveApiBaseUrl,
  resolveSiteOrigin,
  siteHref,
} from "@yenihaber/config";

export const API_BASE = resolveApiBaseUrl();
export const SITE_ORIGIN = resolveSiteOrigin();
export const ADMIN_ORIGIN = resolveAdminOrigin();

export { siteHref, resolveApiBaseUrl, resolveSiteOrigin, resolveAdminOrigin };
