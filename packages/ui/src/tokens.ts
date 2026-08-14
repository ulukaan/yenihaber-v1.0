/**
 * Tasarım token seti — uygulamalar `var(--yh-*)` kullanır.
 * Kaynak: packages/ui/src/theme.css
 *
 * Tip: Newsreader (başlık) + Inter (gövde), clamp akışkan ölçek
 * Gövde min 17px · latin-ext · uppercase yok (TR)
 */

export const tokens = {
  ink: "var(--yh-ink)",
  muted: "var(--yh-muted)",
  faint: "var(--yh-faint)",
  line: "var(--yh-border)",
  surface: "var(--yh-surface-page)",
  dark: "var(--yh-dark)",
  accent: "var(--yh-accent)",
  accentHover: "var(--yh-accent-hover)",
  ok: "var(--yh-success)",
  warn: "var(--yh-warning)",
  danger: "var(--yh-danger)",
  radius: "var(--yh-radius)",
  section: "var(--yh-section)",
  fontSerif: "var(--yh-font-serif)",
  fontSans: "var(--yh-font-sans)",
  textDisplay: "var(--yh-text-display)",
  textHeading: "var(--yh-text-heading)",
  textBody: "var(--yh-text-body)",
  textUi: "var(--yh-text-ui)",
  textMeta: "var(--yh-text-meta)",
  fsManset: "var(--yh-fs-manset)",
  fsGovde: "var(--yh-fs-govde)",
  fsKart: "var(--yh-fs-kart)",
  fsListe: "var(--yh-fs-liste)",
  fsMeta: "var(--yh-fs-meta)",
} as const;

/** Mobil → masaüstü referans (px, dokümantasyon) */
export const TYPE_SCALE = {
  manset: { mobile: 26, desktop: 36 },
  h1: { mobile: 26, desktop: 34 },
  h2: { mobile: 21, desktop: 25 },
  h3: { mobile: 18, desktop: 20 },
  h4: { mobile: 17, desktop: 18 },
  h5: { mobile: 15, desktop: 16 },
  h6: { mobile: 13, desktop: 14 },
  spot: { mobile: 17, desktop: 19 },
  govde: { mobile: 17, desktop: 18 },
  kart: { mobile: 15, desktop: 16 },
  liste: { mobile: 14, desktop: 15 },
  buton: 15,
  meta: { mobile: 12, desktop: 13 },
  rozet: { mobile: 11, desktop: 12 },
  /** Geri uyum */
  display: 36,
  heading: 20,
  body: 18,
  ui: 15,
  metaLegacy: 13,
} as const;

export const COLOR_SCALE = {
  ink: "#14181F",
  muted: "#5A6472",
  faint: "#8A94A3",
  line: "#E3E6EB",
  surface: "#F6F7F9",
  dark: "#101826",
  accent: "#1F5FA8",
} as const;
