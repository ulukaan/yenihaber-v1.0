/**
 * İzomorfik yüzey — tarayıcı bundle’ına girebilir.
 * JWT / crypto / SMTP için `@yenihaber/config/server`.
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
