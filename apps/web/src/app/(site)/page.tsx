import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";
import type { ApiTag } from "@yenihaber/shared";
import {
  CacheTags,
  HOME_RAIL_MIN_ARTICLES,
  HOME_RAIL_MAX_RECOMMENDED,
} from "@yenihaber/shared";
import { publicApi } from "@/lib/server-api";
import { MansetStage } from "@/components/manset-stage/manset-stage";
import { HeadlineGrid } from "@/components/headline-grid/headline-grid";
import { LatestFeed } from "@/components/latest-feed/latest-feed";
import { CategoryRail } from "@/components/category-rail/category-rail";
import { SportPanel } from "@/components/sport-panel/sport-panel";
import { EconomyStrip } from "@/components/economy-strip/economy-strip";
import { ColumnsShowcase } from "@/components/columns-showcase/columns-showcase";
import { AuthorsRail } from "@/components/authors-rail/authors-rail";
import { FeaturedTags } from "@/components/featured-tags/featured-tags";
import { AdSlot } from "@/components/ads/ad-slot";
import { SitePollCard } from "@/components/poll-card/poll-card";
import { StoriesStrip } from "@/components/stories-strip/stories-strip";
import { SurmansetStrip } from "@/components/surmanset-strip/surmanset-strip";
import { CinemaRail } from "@/components/cinema-rail/cinema-rail";
import { phaseFlags } from "@/lib/phase-flags";
import styles from "./page.module.css";

/** ISR yedek — asıl tazelik revalidateTag ile */
export const revalidate = 300;

type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  homeOrder?: number;
};

type CatBlock = {
  category: HomeCategory;
  articles: Awaited<ReturnType<typeof publicApi.articles.list>>["data"];
};

const getHomeManset = unstable_cache(
  async () => publicApi.manset.get(),
  ["home-manset-v1"],
  { tags: [CacheTags.anasayfa, CacheTags.manset], revalidate: 60 },
);

const getHomeLatest = unstable_cache(
  async () => publicApi.articles.list({ page: 1, limit: 30 }),
  ["home-latest-v1"],
  { tags: [CacheTags.anasayfa, "articles"], revalidate: 120 },
);

const getHomeCategories = unstable_cache(
  async () => publicApi.categories.list({ home: true }),
  ["home-categories-v1"],
  { tags: [CacheTags.anasayfa, CacheTags.seritler], revalidate: 120 },
);

const getHomeStories = unstable_cache(
  async () => publicApi.stories.list().catch(() => ({ data: [] as Awaited<ReturnType<typeof publicApi.stories.list>>["data"] })),
  ["home-stories-v1"],
  { tags: [CacheTags.anasayfa, CacheTags.hikaye], revalidate: 60 },
);

const getHomeSurmanset = unstable_cache(
  async () =>
    publicApi.articles.list({ side: 1, page: 1, limit: 15 }).then((r) => r.data),
  ["home-surmanset-v1"],
  { tags: [CacheTags.anasayfa, CacheTags.manset, "articles"], revalidate: 60 },
);

function fetchRailArticles(slug: string, bypassCache: boolean) {
  const run = async () => {
    const res = await publicApi.articles.list({
      categorySlug: slug,
      page: 1,
      limit: 12,
    });
    return res.data;
  };
  if (bypassCache) return run();
  return unstable_cache(run, ["home-rail-articles-v1", slug], {
    tags: [CacheTags.anasayfa, CacheTags.seritler, CacheTags.kategori(slug)],
    revalidate: 300,
  })();
}

/**
 * Sıra: Manşet → seçki → sabit reklamlar → kategori şeritleri
 * Reklamlar sürüklenebilir değil; şeritler arasında sabit indekste.
 */
export default async function HomePage() {
  const { isEnabled: preview } = await draftMode();

  let manset: Awaited<ReturnType<typeof publicApi.manset.get>> | null = null;
  let latest: Awaited<ReturnType<typeof publicApi.articles.list>> = {
    data: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
  };
  let categories: Awaited<ReturnType<typeof publicApi.categories.list>> = [];
  let authors: Awaited<ReturnType<typeof publicApi.authors.list>> = [];
  let featuredTags: ApiTag[] = [];
  let spotlight: Awaited<
    ReturnType<typeof publicApi.articles.list>
  >["data"] = [];
  let generalPoll: Awaited<
    ReturnType<typeof publicApi.polls.active>
  >["poll"] = null;
  let stories: Awaited<ReturnType<typeof publicApi.stories.list>>["data"] = [];
  let surmanset: Awaited<
    ReturnType<typeof publicApi.articles.list>
  >["data"] = [];

  try {
    const [m, l, cats, auths, tagsRes, spotlightRes, pollRes, storiesRes, sideItems] =
      await Promise.all([
        preview ? publicApi.manset.get() : getHomeManset(),
        preview ? publicApi.articles.list({ page: 1, limit: 30 }) : getHomeLatest(),
        preview
          ? publicApi.categories.list({ home: true })
          : getHomeCategories(),
        publicApi.authors.list({ columnistsOnly: true, limit: 12 }),
        publicApi.tags.list({ featured: true, limit: 8 }).catch(() => ({
          data: [] as ApiTag[],
          meta: {
            page: 1,
            limit: 8,
            total: 0,
            totalPages: 1,
            counts: { all: 0, featured: 0, rare: 0, similar: 0 },
            rareHint: "",
          },
        })),
        publicApi.articles
          .list({ page: 1, limit: 4, spotlight: true })
          .catch(() => ({
            data: [] as Awaited<
              ReturnType<typeof publicApi.articles.list>
            >["data"],
            meta: { page: 1, limit: 4, total: 0, totalPages: 1 },
          })),
        phaseFlags.polls
          ? publicApi.polls.active().catch(() => ({ poll: null }))
          : Promise.resolve({ poll: null }),
        phaseFlags.stories
          ? preview
            ? publicApi.stories.list().catch(() => ({ data: [] }))
            : getHomeStories()
          : Promise.resolve({ data: [] }),
        preview
          ? publicApi.articles
              .list({ side: 1, page: 1, limit: 15 })
              .then((r) => r.data)
              .catch(
                () =>
                  [] as Awaited<
                    ReturnType<typeof publicApi.articles.list>
                  >["data"],
              )
          : getHomeSurmanset().catch(
              () =>
                [] as Awaited<
                  ReturnType<typeof publicApi.articles.list>
                >["data"],
            ),
      ]);
    manset = m;
    latest = l;
    categories = cats;
    authors = auths;
    featuredTags = tagsRes.data as ApiTag[];
    spotlight = spotlightRes.data ?? [];
    generalPoll = pollRes.poll;
    stories = storiesRes.data ?? [];
    surmanset = sideItems;
  } catch (error) {
    console.error("anasayfa API", error);
  }

  const sortedCats = [...categories]
    .sort(
      (a, b) =>
        (a.homeOrder ?? 0) - (b.homeOrder ?? 0) ||
        a.name.localeCompare(b.name, "tr"),
    )
    .slice(0, HOME_RAIL_MAX_RECOMMENDED + 3);

  const byCategory = await Promise.all(
    sortedCats.map(async (cat) => {
      try {
        const articles = await fetchRailArticles(cat.slug, preview);
        return { category: cat, articles } satisfies CatBlock;
      } catch {
        return { category: cat, articles: [] } satisfies CatBlock;
      }
    }),
  );

  const mansetIds = new Set([
    ...(manset?.main ?? []).map((a) => a.id),
    ...(manset?.side ?? []).map((a) => a.id),
    ...(manset?.items ?? []).map((x) => x.article.id),
  ]);
  const featuredIds = new Set((manset?.featured ?? []).map((a) => a.id));
  const surmansetIds = new Set(surmanset.map((a) => a.id));

  const spotlightPicks = spotlight.filter(
    (a) =>
      !mansetIds.has(a.id) &&
      !featuredIds.has(a.id) &&
      !surmansetIds.has(a.id),
  );
  const notOnManset = latest.data.filter(
    (a) =>
      !mansetIds.has(a.id) &&
      !featuredIds.has(a.id) &&
      !surmansetIds.has(a.id),
  );
  const picks =
    spotlightPicks.length > 0
      ? spotlightPicks.slice(0, 4)
      : notOnManset.slice(0, 4);
  const pickIds = new Set(picks.map((p) => p.id));
  const feed = notOnManset.filter((a) => !pickIds.has(a.id));

  /** Manşet / sürmanşet / öne çıkan tek kullanımlı; seçki şeritleri boğmasın */
  const usedIds = new Set<string>([
    ...mansetIds,
    ...featuredIds,
    ...surmansetIds,
  ]);

  const rails: CatBlock[] = [];
  for (const block of byCategory) {
    const fresh = block.articles.filter((a) => !usedIds.has(a.id));
    const pool = fresh.length >= HOME_RAIL_MIN_ARTICLES ? fresh : block.articles;
    if (pool.length < HOME_RAIL_MIN_ARTICLES) continue;
    const take = pool.slice(0, 1 + 3);
    for (const a of take) usedIds.add(a.id);
    rails.push({ category: block.category, articles: take });
    if (rails.length >= HOME_RAIL_MAX_RECOMMENDED) break;
  }

  const showAfterDunya = rails.some((r) => r.category.slug === "dunya");

  return (
    <div className={styles.root}>
      <div className={`yh-container ${styles.page}`}>
        <MansetStage
          items={manset?.items}
          featured={manset?.featured ?? []}
          layout={manset?.layout ?? "vitrin"}
          mainItems={manset?.main ?? []}
          sideItems={manset?.side ?? []}
          settings={manset?.settings}
        />

        <AdSlot code="home-billboard" className={styles.adBand} />

        <FeaturedTags tags={featuredTags} />

        <SurmansetStrip items={surmanset} title="Sürmanşet" />

        <div className={styles.topBand}>
          <HeadlineGrid
            items={picks.length ? picks : latest.data}
            title="Günün seçtikleri"
          />
          <div className={styles.sideCol}>
            <LatestFeed items={feed.length ? feed : latest.data} limit={10} />
            {phaseFlags.polls && generalPoll ? (
              <div className={styles.pollSlot}>
                <SitePollCard poll={generalPoll} variant="rail" />
              </div>
            ) : null}
          </div>
        </div>

        {/* Hikaye → reklam → kategori şeritleri */}
        {phaseFlags.stories ? <StoriesStrip items={stories} /> : null}

        <CinemaRail />

        <AdSlot code="home-inline-1" className={styles.adBand} />

        {rails.map(({ category, articles }, index) => {
          const isSport = category.slug === "spor";
          const isEconomy = category.slug === "ekonomi";

          return (
            <div key={category.id} className={styles.railSlot}>
              {isSport ? (
                <div className={styles.panelAbove}>
                  <SportPanel />
                </div>
              ) : null}
              {isEconomy ? (
                <div className={styles.panelAbove}>
                  <EconomyStrip />
                </div>
              ) : null}
              <CategoryRail
                title={category.name}
                slug={category.slug}
                articles={articles}
                accentColor={category.color}
              />
              {/* İkinci reklam: 3. şeritten sonra — üst üste iki reklam olmasın */}
              {index === 2 ? (
                <AdSlot code="home-inline-2" className={styles.adBand} />
              ) : null}
              {category.slug === "dunya" && authors.length ? (
                <>
                  <ColumnsShowcase authors={authors} />
                  <AuthorsRail authors={authors} />
                </>
              ) : null}
            </div>
          );
        })}

        {!showAfterDunya && authors.length ? (
          <div className={styles.railSlot}>
            <ColumnsShowcase authors={authors} />
            <AuthorsRail authors={authors} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
