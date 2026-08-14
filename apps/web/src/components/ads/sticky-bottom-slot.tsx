import { fetchAdForSlot } from "./fetch-ad";
import { StickyBottomAd } from "./sticky-bottom-ad";

/** Sunucu: reklam yoksa hiç basma */
export async function StickyBottomAdSlot() {
  const ad = await fetchAdForSlot("sticky-bottom");
  if (!ad) return null;
  return <StickyBottomAd ad={ad} />;
}
