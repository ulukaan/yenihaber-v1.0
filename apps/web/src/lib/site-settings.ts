import { unstable_cache } from "next/cache";
import { themeStyleFromSettings } from "./theme-css";

const API =
  process.env.API_INTERNAL_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:4000/api/v1";

export type SiteSettings = Record<string, string>;

async function fetchPublicSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API}/settings`, {
      next: { revalidate: 30, tags: ["ayarlar", "settings"] },
    });
    if (!res.ok) return {};
    return (await res.json()) as SiteSettings;
  } catch {
    return {};
  }
}

/** Cache'li site ayarları — kaydetmede revalidateTag("ayarlar") */
export const getSiteSettings = unstable_cache(
  async () => fetchPublicSettings(),
  ["site-settings-v1"],
  { revalidate: 30, tags: ["ayarlar", "settings"] },
);

export { themeStyleFromSettings };