/**
 * Site ayarları — key-value (Setting tablosu)
 * Grup = panel sekmesi; değer her zaman string (JSON gerekmez)
 */

export const SETTINGS_GROUPS = [
  "site",
  "appearance",
  "seo",
  "integrations",
  "social",
  "content",
  "email",
  "legal",
  "footer",
] as const;

export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
  site: "Site kimliği",
  appearance: "Görünüm",
  seo: "SEO",
  integrations: "Entegrasyonlar",
  social: "Sosyal medya",
  content: "İçerik",
  email: "E-posta",
  legal: "Yasal",
  footer: "Footer",
};

/** Hazır paletler — kontrast testli */
export const THEME_PALETTES = [
  {
    id: "radikal",
    label: "Radikal",
    primary: "#2B2D42",
    accent: "#EF233C",
    link: "#1D4ED8",
    breaking: "#E10600",
  },
  {
    id: "gece",
    label: "Gece",
    primary: "#0F172A",
    accent: "#38BDF8",
    link: "#7DD3FC",
    breaking: "#F43F5E",
  },
  {
    id: "orman",
    label: "Orman",
    primary: "#14532D",
    accent: "#16A34A",
    link: "#15803D",
    breaking: "#DC2626",
  },
  {
    id: "deniz",
    label: "Deniz",
    primary: "#0C4A6E",
    accent: "#0284C7",
    link: "#0369A1",
    breaking: "#EA580C",
  },
  {
    id: "kahve",
    label: "Kahve",
    primary: "#44403C",
    accent: "#B45309",
    link: "#92400E",
    breaking: "#B91C1C",
  },
  {
    id: "mor",
    label: "Mor",
    primary: "#3B0764",
    accent: "#7C3AED",
    link: "#6D28D9",
    breaking: "#DB2777",
  },
  {
    id: "kurumsal",
    label: "Kurumsal",
    primary: "#1E293B",
    accent: "#0F766E",
    link: "#0E7490",
    breaking: "#BE123C",
  },
  {
    id: "custom",
    label: "Özel renk",
    primary: "",
    accent: "",
    link: "",
    breaking: "",
  },
] as const;

export type ThemePaletteId = (typeof THEME_PALETTES)[number]["id"];

/** Varsayılanlar — dotted key */
export const SETTINGS_DEFAULTS: Record<string, { group: SettingsGroup; value: string }> = {
  // site
  "site.name": { group: "site", value: "Düzce Radikal" },
  "site.tagline": { group: "site", value: "Düzce ve bölgeden gündem" },
  "site.url": { group: "site", value: "https://duzceradikal.com" },
  "site.logoLight": { group: "site", value: "" },
  "site.logoDark": { group: "site", value: "" },
  "site.logoMobile": { group: "site", value: "" },
  "site.favicon": { group: "site", value: "" },
  "site.timezone": { group: "site", value: "Europe/Istanbul" },
  "site.dateFormat": { group: "site", value: "dd.MM.yyyy HH:mm" },
  "site.maintenanceEnabled": { group: "site", value: "0" },
  "site.maintenanceMessage": {
    group: "site",
    value: "Site bakımda. Kısa süre içinde döneceğiz.",
  },
  "site.maintenanceWhitelistIp": { group: "site", value: "" },
  /** Üst bar Selçuklu motif: seljuk | baklava | none */
  "site.headerMotif": { group: "site", value: "seljuk" },
  /** Opaklık 0–100 */
  "site.headerMotifOpacity": { group: "site", value: "10" },
  // legacy bridge keys kept for old consumers (synced from site.*)
  siteName: { group: "site", value: "Düzce Radikal" },
  siteTagline: { group: "site", value: "Düzce ve bölgeden gündem" },
  contactEmail: { group: "site", value: "" },
  liveYouTubeUrl: { group: "site", value: "" },

  // appearance — site tema
  "theme.paletteId": { group: "appearance", value: "radikal" },
  "theme.primary": { group: "appearance", value: "#2B2D42" },
  "theme.accent": { group: "appearance", value: "#EF233C" },
  "theme.link": { group: "appearance", value: "#1D4ED8" },
  "theme.breaking": { group: "appearance", value: "#E10600" },
  "theme.font": { group: "appearance", value: "system" },
  "theme.modeSupport": { group: "appearance", value: "both" },
  "theme.defaultMode": { group: "appearance", value: "light" },
  // panel tema (ayrı blok)
  "panel.accent": { group: "appearance", value: "#EF233C" },
  "panel.sidebar": { group: "appearance", value: "dark" },
  "panel.density": { group: "appearance", value: "comfortable" },

  // seo
  "seo.titleTemplate": { group: "seo", value: "%s | Düzce Radikal" },
  "seo.defaultDescription": {
    group: "seo",
    value:
      "Düzce ve bölgeden son dakika, manşet, gündem, spor, ekonomi ve daha fazlası.",
  },
  "seo.defaultOgImage": { group: "seo", value: "" },
  "seo.robotsTxt": {
    group: "seo",
    value: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml",
  },
  "seo.searchConsoleCode": { group: "seo", value: "" },
  "seo.sitemapEnabled": { group: "seo", value: "1" },

  // integrations
  "integrations.gaId": { group: "integrations", value: "" },
  "integrations.gtmId": { group: "integrations", value: "" },
  "integrations.adsenseClient": { group: "integrations", value: "" },
  "integrations.facebookPixel": { group: "integrations", value: "" },
  "integrations.pushPublicKey": { group: "integrations", value: "" },

  // social
  "social.facebook": { group: "social", value: "" },
  "social.x": { group: "social", value: "" },
  "social.instagram": { group: "social", value: "" },
  "social.youtube": { group: "social", value: "" },
  "social.whatsapp": { group: "social", value: "" },

  // content
  "content.homeMansetCount": { group: "content", value: "12" },
  "content.pageSize": { group: "content", value: "12" },
  "content.excerptMaxChars": { group: "content", value: "160" },
  "content.commentsEnabled": { group: "content", value: "1" },
  "content.commentsAutoApprove": { group: "content", value: "0" },
  "content.commentsCloseAfterDays": { group: "content", value: "30" },
  "content.breakingBandEnabled": { group: "content", value: "1" },
  /** Habere kapak yoksa kullanılan varsayılan görsel URL */
  "content.defaultCoverUrl": {
    group: "content",
    value: "/brand/default-cover.svg",
  },
  /** Okunma sayısı bu eşiğin altındaysa sitede gizlenir */
  "content.viewCountMinShow": { group: "content", value: "500" },
  /**
   * Tepki yapılandırması JSON:
   * { minShow, items:[{id,label,emoji,enabled,order}] }
   */
  "reactions.config": {
    group: "content",
    value: "",
  },
  /** /secim kırmızı bar — marka adı (boşsa gösterilmez) */
  "content.electionCenterName": { group: "content", value: "" },
  /** /secim kırmızı bar — alt başlık (boşsa gösterilmez) */
  "content.electionCenterLabel": {
    group: "content",
    value: "",
  },
  /** /secim kırmızı bar — logo URL (boşsa site.logoDark / varsayılan) */
  "content.electionCenterLogo": { group: "content", value: "" },

  // email
  "email.fromName": { group: "email", value: "Düzce Radikal" },
  "email.fromAddress": { group: "email", value: "" },
  "email.smtpHost": { group: "email", value: "" },
  "email.smtpPort": { group: "email", value: "587" },
  "email.smtpUser": { group: "email", value: "" },
  "email.smtpPass": { group: "email", value: "" },
  "email.smtpSecure": { group: "email", value: "0" },

  // legal
  "legal.cookieBannerEnabled": { group: "legal", value: "1" },
  "legal.cookieText": {
    group: "legal",
    value:
      "Deneyiminizi iyileştirmek için çerez kullanıyoruz. Detaylar için gizlilik politikamızı inceleyin.",
  },
  "legal.privacyUrl": { group: "legal", value: "/gizlilik" },
  "legal.termsUrl": { group: "legal", value: "/kullanim-sartlari" },

  // footer — metin / bloklar (sütun linkleri Menü → Footer)
  "footer.citation": {
    group: "footer",
    value: "Bu sitedeki içerikler kaynak gösterilmeden alıntılanamaz.",
  },
  "footer.newsletterEnabled": { group: "footer", value: "1" },
  "footer.newsletterKicker": { group: "footer", value: "E-posta bülteni" },
  "footer.newsletterTitle": {
    group: "footer",
    value: "Günün manşetleri sabah kutunuzda",
  },
  "footer.newsletterPromise": {
    group: "footer",
    value:
      "Günde tek e-posta, reklam yok. Abonelik e-postanızdaki onay linkiyle tamamlanır.",
  },
  "footer.tipEnabled": { group: "footer", value: "1" },
  "footer.tipKicker": { group: "footer", value: "Haber ihbarı" },
  "footer.tipTitle": { group: "footer", value: "İhbar hattı" },
  "footer.tipBody": {
    group: "footer",
    value:
      "Olay, belge veya yerel haber ipucu için yazın. Kaynağınız isterseniz gizli tutulur.",
  },
  "footer.servicesEnabled": { group: "footer", value: "1" },
  "footer.servicesLabel": { group: "footer", value: "Hızlı erişim" },
  "footer.servicesJson": {
    group: "footer",
    value: JSON.stringify(
      [
        {
          href: "/servis/namaz",
          label: "Namaz vakitleri",
          hint: "Düzce",
          icon: "moon",
        },
        {
          href: "/servis/nobetci-eczane",
          label: "Nöbetçi eczane",
          hint: "İl / ilçe",
          icon: "cross",
        },
        {
          href: "/servis/vefat",
          label: "Vefat ilanları",
          hint: "MEBİS",
          icon: "flower",
        },
        {
          href: "/servis/hava",
          label: "Hava durumu",
          hint: "Günlük özet",
          icon: "cloud",
        },
        {
          href: "/servis/doviz",
          label: "Döviz & piyasa",
          hint: "Kur özeti",
          icon: "trend",
        },
        {
          href: "/servis/vizyon",
          label: "Vizyondaki filmler",
          hint: "Sinema",
          icon: "film",
        },
      ],
      null,
      0,
    ),
  },
};

/** Public GET’te asla dönmesin */
export const SETTINGS_SECRET_KEYS = new Set([
  "email.smtpPass",
  "email.smtpUser",
  "email.smtpHost",
  "email.smtpPort",
  "email.smtpSecure",
]);

export function isSettingsGroup(v: string): v is SettingsGroup {
  return (SETTINGS_GROUPS as readonly string[]).includes(v);
}

/** WCAG relative luminance */
export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6 && h.length !== 3) return 0;
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const L1 = relativeLuminance(hexA);
  const L2 = relativeLuminance(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Metin zemin üzerinde AA (4.5) */
export function passesContrastAA(
  fg: string,
  bg: string,
  min = 4.5,
): { ok: boolean; ratio: number } {
  const ratio = contrastRatio(fg, bg);
  return { ok: ratio >= min, ratio: Math.round(ratio * 100) / 100 };
}

export type SettingsMap = Record<string, string>;

export type SettingsBundle = {
  byGroup: Record<SettingsGroup, SettingsMap>;
  flat: SettingsMap;
  secretsMasked?: boolean;
};
