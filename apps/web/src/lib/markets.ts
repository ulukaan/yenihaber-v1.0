import type { ApiMarkets, ApiMarketItem } from "@yenihaber/shared";
import { getMarketsSnapshot } from "@yenihaber/shared";
import { publicApi } from "@/lib/api";
import { marketBorsa as fallbackBorsa } from "@/lib/live-data";

export type { ApiMarketItem, ApiMarkets };

function isUsable(item: ApiMarketItem): boolean {
  const v = (item.value ?? "").trim();
  return Boolean(v) && v !== "—" && v !== "-" && v.toLowerCase() !== "n/a";
}

function snapshotUsable(data: ApiMarkets): boolean {
  return (
    data.fx.some(isUsable) ||
    data.gold.some(isUsable) ||
    data.crypto.some(isUsable)
  );
}

const empty: ApiMarkets = {
  fx: [
    { code: "USD", label: "Dolar", value: "—", change: "—", up: true },
    { code: "EUR", label: "Euro", value: "—", change: "—", up: true },
    { code: "GBP", label: "Sterlin", value: "—", change: "—", up: true },
  ],
  gold: [
    { code: "GA", label: "Gram", value: "—", change: "—", up: true },
    { code: "C", label: "Çeyrek", value: "—", change: "—", up: true },
  ],
  crypto: [
    { code: "BTC", label: "Bitcoin", value: "—", change: "—", up: false },
    { code: "ETH", label: "Ethereum", value: "—", change: "—", up: true },
  ],
  source: "yok",
  updatedAt: new Date().toISOString(),
};

/**
 * Piyasa verisi: canlidoviz/TCMB doğrudan (Hostinger’da Hono API yoksa da çalışır).
 */
export async function getMarkets(): Promise<ApiMarkets> {
  try {
    const live = await getMarketsSnapshot();
    if (snapshotUsable(live)) return live;
  } catch {
    /* Hono / dış API */
  }
  try {
    const viaApi = await publicApi.markets.get();
    if (snapshotUsable(viaApi)) return viaApi;
  } catch {
    /* boş */
  }
  return empty;
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
