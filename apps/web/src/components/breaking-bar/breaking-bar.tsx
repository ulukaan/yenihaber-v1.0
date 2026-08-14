import { publicApi } from "@/lib/api";
import { BreakingTicker } from "@/components/breaking-ticker/breaking-ticker";

/** Header altı son dakika şeridi — tüm sayfalarda */
export async function BreakingBar() {
  let items: Awaited<ReturnType<typeof publicApi.articles.breaking>> = [];

  try {
    items = await publicApi.articles.breaking();
  } catch {
    items = [];
  }

  if (!items.length) {
    try {
      const latest = await publicApi.articles.list({ page: 1, limit: 10 });
      items = latest.data;
    } catch {
      items = [];
    }
  }

  return <BreakingTicker items={items.slice(0, 12)} />;
}
