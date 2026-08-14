import { prisma } from "@yenihaber/database";
import {
  isValidSlot,
  type AdPublic,
  type AdSlotCode,
  type AdCreativeType,
  type AdDevice,
  type AdStatus,
} from "@yenihaber/shared";

export type AdRow = {
  id: string;
  slotCode: string;
  name: string;
  advertiser: string | null;
  type: AdCreativeType;
  imageUrl: string | null;
  imageUrlMobile: string | null;
  targetUrl: string | null;
  htmlCode: string | null;
  adsenseSlotId: string | null;
  device: AdDevice;
  startAt: Date | null;
  endAt: Date | null;
  weight: number;
  status: AdStatus;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(r: {
  id: string;
  slotCode: string;
  name: string;
  advertiser: string | null;
  type: string;
  imageUrl: string | null;
  imageUrlMobile: string | null;
  targetUrl: string | null;
  htmlCode: string | null;
  adsenseSlotId: string | null;
  device: string;
  startAt: Date | null;
  endAt: Date | null;
  weight: number;
  status: string;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}): AdRow {
  return {
    id: r.id,
    slotCode: r.slotCode,
    name: r.name,
    advertiser: r.advertiser,
    type: r.type as AdCreativeType,
    imageUrl: r.imageUrl,
    imageUrlMobile: r.imageUrlMobile,
    targetUrl: r.targetUrl,
    htmlCode: r.htmlCode,
    adsenseSlotId: r.adsenseSlotId,
    device: r.device as AdDevice,
    startAt: r.startAt,
    endAt: r.endAt,
    weight: r.weight,
    status: r.status as AdStatus,
    impressions: r.impressions,
    clicks: r.clicks,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function getActiveAds(slotCode: AdSlotCode): Promise<AdRow[]> {
  if (!isValidSlot(slotCode)) return [];
  const now = new Date();
  const rows = await prisma.ad.findMany({
    where: {
      slotCode,
      status: "active",
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: { weight: "desc" },
  });
  return rows.map(mapRow);
}

/** Ağırlıklı rastgele seçim */
export function pickAd(ads: AdRow[]): AdRow | null {
  if (ads.length === 0) return null;
  if (ads.length === 1) return ads[0]!;
  const total = ads.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0);
  let roll = Math.random() * total;
  for (const ad of ads) {
    roll -= Math.max(1, ad.weight);
    if (roll <= 0) return ad;
  }
  return ads[ads.length - 1]!;
}

export function toPublic(ad: AdRow): AdPublic {
  return {
    id: ad.id,
    type: ad.type,
    imageUrl: ad.imageUrl,
    imageUrlMobile: ad.imageUrlMobile,
    targetUrl: ad.targetUrl,
    htmlCode: ad.htmlCode,
    adsenseSlotId: ad.adsenseSlotId,
    device: ad.device,
  };
}

export function toAdminJson(ad: AdRow) {
  return {
    ...toPublic(ad),
    slotCode: ad.slotCode,
    name: ad.name,
    advertiser: ad.advertiser,
    weight: ad.weight,
    status: ad.status,
    startAt: ad.startAt?.toISOString() ?? null,
    endAt: ad.endAt?.toISOString() ?? null,
    impressions: ad.impressions,
    clicks: ad.clicks,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  };
}

/** Basit bellek tamponu — 30 sn'de bir flush */
const impressBuf = new Map<string, number>();
const clickBuf = new Map<string, number>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushTrack() {
  flushTimer = null;
  const imp = [...impressBuf.entries()];
  const clk = [...clickBuf.entries()];
  impressBuf.clear();
  clickBuf.clear();
  await Promise.all([
    ...imp.map(([id, n]) =>
      prisma.ad
        .update({
          where: { id },
          data: { impressions: { increment: n } },
        })
        .catch(() => null),
    ),
    ...clk.map(([id, n]) =>
      prisma.ad
        .update({
          where: { id },
          data: { clicks: { increment: n } },
        })
        .catch(() => null),
    ),
  ]);
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => void flushTrack(), 30_000);
}

export async function trackAdEvent(
  adId: string,
  event: "impression" | "click",
) {
  const map = event === "click" ? clickBuf : impressBuf;
  map.set(adId, (map.get(adId) ?? 0) + 1);
  scheduleFlush();
}

/** Süresi dolan aktif reklamları arşivle */
export async function archiveExpiredAds(): Promise<number> {
  const now = new Date();
  const result = await prisma.ad.updateMany({
    where: {
      status: "active",
      endAt: { not: null, lt: now },
    },
    data: { status: "archived" },
  });
  return result.count;
}
