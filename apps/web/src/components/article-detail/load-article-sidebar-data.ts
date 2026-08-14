import type { ApiArticle, ApiCategory } from "@yenihaber/shared";
import { publicApi } from "@/lib/api";
import { getMarkets } from "@/lib/markets";
import { getFuelPrices } from "@/lib/fuel";
import { weather as weatherFallback } from "@/lib/live-data";
import type { ArticleSidebarData } from "./article-sidebar";

/**
 * Haber yan paneli verisi — sunucuda 1 kez; akıştaki her satırda yeniden basılır.
 */
export async function loadArticleSidebarData(
  mostRead: ApiArticle[],
): Promise<ArticleSidebarData> {
  const [breakingRes, catsRes, markets, fuel, prayer, pollRes] =
    await Promise.all([
      publicApi.articles.breaking().catch(() => [] as ApiArticle[]),
      publicApi.categories.list().catch(() => [] as ApiCategory[]),
      getMarkets(),
      getFuelPrices(),
      publicApi.prayer.get("duzce").catch(() => null),
      publicApi.polls.active().catch(() => ({ poll: null })),
    ]);

  return {
    breaking: breakingRes.slice(0, 8),
    mostRead: mostRead.slice(0, 8),
    categories: catsRes.slice(0, 10),
    quotes: {
      usd: markets.fx.find((x) => /USD/i.test(x.code)) ?? markets.fx[0],
      eur: markets.fx.find((x) => /EUR/i.test(x.code)) ?? markets.fx[1],
      gold: markets.gold[0],
    },
    weather: {
      city: weatherFallback.city,
      temp: weatherFallback.temp,
      desc: weatherFallback.desc,
    },
    prayer: prayer
      ? { city: prayer.city, next: prayer.next }
      : null,
    fuel: fuel.items.slice(0, 3).map((f) => ({
      name: f.name,
      price: f.price,
    })),
    generalPoll: pollRes.poll,
  };
}
