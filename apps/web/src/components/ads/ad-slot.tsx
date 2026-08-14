import {
  AD_SLOTS,
  type AdPublic,
  type AdSlotCode,
} from "@yenihaber/shared";
import styles from "./ad-slot.module.css";
import { AdRenderer } from "./ad-renderer";
import { fetchAdForSlot } from "./fetch-ad";

type Props = {
  code: AdSlotCode;
  className?: string;
};

/**
 *   <AdSlot code="article-top" />
 * Aktif reklam yoksa null — boş kutu yok.
 */
export async function AdSlot({ code, className }: Props) {
  const slot = AD_SLOTS[code];
  if (!slot) return null;

  const ad = await fetchAdForSlot(code);
  if (!ad) return null;

  const deviceClass =
    slot.device === "desktop"
      ? styles.desktopOnly
      : slot.device === "mobile"
        ? styles.mobileOnly
        : "";

  return (
    <div
      data-ad-slot={code}
      className={[styles.wrap, deviceClass, className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Reklam"
    >
      <AdRenderer ad={ad} slotCode={code} />
    </div>
  );
}

export type { AdPublic };
