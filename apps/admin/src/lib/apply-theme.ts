import type { SettingsMap } from "@yenihaber/shared";

/**
 * Görünüm ayarlarını document'e basar — site + panel aynı marka renkleri.
 * Panel vurgu boşsa site accent kullanılır.
 */
export function applyAppearanceToDocument(appearance: SettingsMap): void {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  const primary = appearance["theme.primary"] || "#2B2D42";
  const siteAccent = appearance["theme.accent"] || "#EF233C";
  const panelAccent =
    appearance["panel.accent"]?.trim() || siteAccent;
  const link = appearance["theme.link"] || "#1D4ED8";
  const breaking = appearance["theme.breaking"] || "#E10600";

  r.style.setProperty("--site-primary", primary);
  r.style.setProperty("--site-accent", siteAccent);
  r.style.setProperty("--site-link", link);
  r.style.setProperty("--site-breaking", breaking);
  r.style.setProperty("--color-accent", siteAccent);
  r.style.setProperty("--yh-accent", panelAccent);
  r.style.setProperty("--yh-primary", primary);
  r.style.setProperty("--yh-ink", primary);
  r.style.setProperty("--yh-link", link);
  r.style.setProperty("--yh-breaking", breaking);

  r.dataset.panelSidebar = appearance["panel.sidebar"] || "dark";
  r.dataset.panelDensity = appearance["panel.density"] || "comfortable";
}
