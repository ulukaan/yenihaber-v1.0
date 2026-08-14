import { AD_SLOTS } from "@yenihaber/shared";
import { fetchAdForSlot } from "./fetch-ad";
import { MastheadAdReveal } from "./masthead-ad-reveal";

type Props = {
  className?: string;
};

/**
 * Masthead — reklam varsa sayfa açılışında gösterilir (içerik aşağı kayar).
 */
export async function MastheadAdSlot({ className }: Props) {
  const slot = AD_SLOTS.masthead;
  if (!slot) return null;

  const ad = await fetchAdForSlot("masthead");
  if (!ad) return null;

  return <MastheadAdReveal ad={ad} className={className} />;
}
