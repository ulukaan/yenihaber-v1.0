/**
 * Kategori aksan rengi — admin'den gelen color; yoksa site accent.
 */
export function categoryThemeColor(color?: string | null): string {
  const c = color?.trim();
  if (c && /^#[0-9A-Fa-f]{6}$/.test(c)) return c;
  return "var(--yh-accent)";
}

/** @deprecated kategori bazlı palet kaldırıldı */
export const CATEGORY_COLORS: Record<string, string> = {};
