import { SiteHeader } from "@/components/site-header/site-header";
import { ServiceStrip } from "@/components/service-strip/service-strip";
import { BreakingBar } from "@/components/breaking-bar/breaking-bar";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { AdSlot } from "@/components/ads/ad-slot";
import { MastheadAdSlot } from "@/components/ads/masthead-ad-slot";
import { StickyBottomAdSlot } from "@/components/ads/sticky-bottom-slot";
import { CookieBanner } from "@/components/cookie-banner/cookie-banner";
import {
  SiteAdsGate,
  SiteMainShell,
} from "@/components/site-chrome/site-ads-gate";
import styles from "./site-layout.module.css";

/**
 * /secim: tam sayfa seçim — header, servis, son dakika, footer, reklam yok
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteAdsGate>
        <MastheadAdSlot className={styles.adMasthead} />
      </SiteAdsGate>
      <SiteAdsGate>
        <SiteHeader />
      </SiteAdsGate>
      <SiteAdsGate>
        <ServiceStrip />
      </SiteAdsGate>
      <SiteAdsGate>
        <BreakingBar />
      </SiteAdsGate>
      <SiteMainShell
        leftRail={<AdSlot code="rail-left" />}
        rightRail={<AdSlot code="rail-right" />}
      >
        {children}
      </SiteMainShell>
      <SiteAdsGate>
        <AdSlot code="footer" className={styles.adFooter} />
      </SiteAdsGate>
      <SiteAdsGate>
        <SiteFooter />
      </SiteAdsGate>
      <SiteAdsGate>
        <StickyBottomAdSlot />
      </SiteAdsGate>
      <CookieBanner />
    </>
  );
}
