import {
  DEFAULT_MAIN_NAV,
  type ApiMenuItem,
} from "@yenihaber/shared";
import { publicApi } from "@/lib/api";
import {
  activeIconIds,
  getCachedMenu,
  menuItemsToMainNav,
} from "@/lib/menus";
import { SiteHeaderChrome } from "./site-header-chrome";

function parseMotif(
  raw: string | undefined,
): "seljuk" | "baklava" | "rumi" | "none" {
  const v = (raw ?? "seljuk").trim().toLowerCase();
  if (v === "baklava" || v === "rumi" || v === "none" || v === "seljuk") {
    return v;
  }
  return "seljuk";
}

function parseOpacity(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 10;
  return Math.min(40, Math.max(0, Math.round(n)));
}

/** Üst menü + yan menü — menus tablosu (cache tag: menu) */
export async function SiteHeader() {
  let categories: { name: string; slug: string }[] = [];
  let liveYouTubeUrl = "";
  let mainNav = DEFAULT_MAIN_NAV;
  let sideItems: ApiMenuItem[] = [];
  let iconIds = ["search", "weather", "prayer", "theme", "social"];
  let headerMotif: "seljuk" | "baklava" | "rumi" | "none" = "seljuk";
  let headerMotifOpacity = 10;

  try {
    const [cats, settings, headerMenu, sidebarMenu, iconsMenu] =
      await Promise.all([
        publicApi.categories.list(),
        publicApi.settings.get(),
        getCachedMenu("header"),
        getCachedMenu("sidebar"),
        getCachedMenu("icons"),
      ]);
    categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
    liveYouTubeUrl = settings.liveYouTubeUrl?.trim() ?? "";
    headerMotif = parseMotif(settings["site.headerMotif"]);
    headerMotifOpacity = parseOpacity(settings["site.headerMotifOpacity"]);
    if (headerMenu?.items?.length) {
      mainNav = menuItemsToMainNav(headerMenu.items);
    }
    if (sidebarMenu?.items?.length) {
      sideItems = sidebarMenu.items;
    }
    iconIds = activeIconIds(iconsMenu);
  } catch {
    try {
      categories = (await publicApi.categories.list()).map((c) => ({
        name: c.name,
        slug: c.slug,
      }));
    } catch {
      categories = [];
    }
  }

  return (
    <SiteHeaderChrome
      mainNav={mainNav}
      categories={categories}
      sideItems={sideItems}
      liveYouTubeUrl={liveYouTubeUrl}
      iconIds={iconIds}
      headerMotif={headerMotif}
      headerMotifOpacity={headerMotifOpacity}
      showElectionStrip
    />
  );
}
