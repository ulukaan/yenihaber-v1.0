import { unstable_cache } from "next/cache";
import type { ApiMenu, ApiMenuItem, MainNav, MenuLocation } from "@yenihaber/shared";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function fetchMenu(location: MenuLocation): Promise<ApiMenu | null> {
  try {
    const res = await fetch(`${API}/menus/${location}`, {
      next: { tags: ["menu"], revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { menu: ApiMenu | null };
    return data.menu;
  } catch {
    return null;
  }
}

export const getCachedMenu = unstable_cache(
  async (location: MenuLocation) => fetchMenu(location),
  ["site-menu"],
  { tags: ["menu"], revalidate: 60 },
);

export function filterMenuByDevice(
  items: ApiMenuItem[],
  device: "desktop" | "mobile",
): ApiMenuItem[] {
  return items
    .filter((i) => i.device === "all" || i.device === device)
    .map((i) => ({
      ...i,
      children: filterMenuByDevice(i.children, device),
    }));
}

/** Geçici köprü — mevcut SiteHeaderChrome MainNav bekliyor */
export function menuItemsToMainNav(items: ApiMenuItem[]): MainNav {
  return items
    .filter((i) => i.type !== "heading" && i.href)
    .map((i) => ({
      id: i.id,
      label: i.resolvedLabel,
      href: i.href || "#",
      accent: Boolean(i.badgeText),
      children: i.children
        .filter((c) => c.href)
        .map((c) => ({
          id: c.id,
          label: c.resolvedLabel,
          href: c.href || "#",
        })),
    }));
}

export function activeIconIds(menu: ApiMenu | null): string[] {
  if (!menu) return ["search", "weather", "prayer", "theme"];
  return menu.items
    .filter((i) => i.type === "icon" && i.isActive && i.refId)
    .map((i) => i.refId!);
}
