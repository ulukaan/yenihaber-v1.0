import type { AdPublic, AdSlotCode } from "@yenihaber/shared";

const baseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");

export async function fetchAdForSlot(
  code: AdSlotCode | string,
): Promise<AdPublic | null> {
  try {
    const res = await fetch(`${baseUrl}/ads/slot/${encodeURIComponent(code)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ad: AdPublic | null };
    return data.ad ?? null;
  } catch {
    return null;
  }
}
