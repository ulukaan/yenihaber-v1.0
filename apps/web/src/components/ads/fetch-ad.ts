import { fetchInternalApi } from "@/lib/hono-fetch";
import type { AdPublic, AdSlotCode } from "@yenihaber/shared";

export async function fetchAdForSlot(
  code: AdSlotCode | string,
): Promise<AdPublic | null> {
  try {
    const res = await fetchInternalApi(
      `/ads/slot/${encodeURIComponent(code)}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { ad: AdPublic | null };
    return data.ad ?? null;
  } catch {
    return null;
  }
}
