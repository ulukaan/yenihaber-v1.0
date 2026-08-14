/** Site ayarlarından :root CSS değişkenleri (web layout) */
export function themeStyleFromSettings(s: Record<string, string>): string {
  const primary = s["theme.primary"] || "#2B2D42";
  const accent = s["theme.accent"] || "#EF233C";
  const link = s["theme.link"] || "#1D4ED8";
  const breaking = s["theme.breaking"] || "#E10600";
  /* Metin rengi (--color-ink / --yh-ink) burada EZİLMEZ — koyu temada theme.css döndürür */
  return `:root{
  --site-primary:${primary};
  --site-accent:${accent};
  --site-link:${link};
  --site-breaking:${breaking};
  --color-accent:${accent};
  --yh-accent:${accent};
  --yh-primary:${accent};
  --yh-link:${link};
  --yh-breaking:${breaking};
}`;
}
