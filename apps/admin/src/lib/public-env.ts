import {
  resolveApiBaseUrl,
  resolveSiteOrigin,
  siteHref,
} from "@yenihaber/config";

export const API_BASE = resolveApiBaseUrl();
export const SITE_ORIGIN = resolveSiteOrigin();

export { siteHref, resolveApiBaseUrl, resolveSiteOrigin };
