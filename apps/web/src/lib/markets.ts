import type { ApiMarkets, ApiMarketItem } from "@yenihaber/shared";
import { publicApi } from "@/lib/api";
import {
  marketFx as fallbackFx,
  marketGold as fallbackGold,
  marketBorsa as fallbackBorsa,
  marketStrip as fallbackStrip,
} from "@/lib/live-data";

export type { ApiMarketItem, ApiMarkets };

const empty: ApiMarkets = {
  fx: fallbackFx.map((i) => ({
    code: i.label,
    label: i.label,
    value: i.value,
    change: i.change,
    up: i.up,
  })),
  gold: fallbackGold.map((i) => ({
    code: i.label,
    label: i.label,
    value: i.value,
    change: i.change,
    up: i.up,
  })),
  crypto: [
    {
      code: "BTC",
      label: "Bitcoin",
      value: "—",
      change: "—",
      up: false,
    },
    {
      code: "ETH",
      label: "Ethereum",
      value: "—",
      change: "—",
      up: true,
    },
    {
      code: "BNB",
      label: "BNB",
      value: "—",
      change: "—",
      up: true,
    },
    {
      code: "XRP",
      label: "XRP",
      value: "—",
      change: "—",
      up: true,
    },
    {
      code: "SOL",
      label: "Solana",
      value: "—",
      change: "—",
      up: true,
    },
  ],
  source: "demo",
  updatedAt: new Date().toISOString(),
};

/** Sunucu tarafı piyasa verisi (API proxy → canlidoviz) */
export async function getMarkets(): Promise<ApiMarkets> {
  try {
    return await publicApi.markets.get();
  } catch {
    return empty;
  }
}

export function toStripItems(markets: ApiMarkets): ApiMarketItem[] {
  const bistLike = fallbackBorsa[0];
  return [
    ...markets.fx.slice(0, 3),
    markets.gold[0] ?? {
      code: "GA",
      label: "ALTIN",
      value: "—",
      change: "—",
      up: true,
    },
    markets.crypto[0] ?? {
      code: "BTC",
      label: "BTC",
      value: "—",
      change: "—",
      up: true,
    },
    {
      code: "XU100",
      label: bistLike?.label ?? "BİST 100",
      value: bistLike?.value ?? "—",
      change: bistLike?.change ?? "—",
      up: bistLike?.up ?? true,
    },
  ];
}

export { fallbackStrip };
