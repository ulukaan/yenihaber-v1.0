/**
 * Reklam alanları — TEK KAYNAK.
 * Site ve panel buradan beslenir. Yeni alan = buraya satır.
 */

export type AdDevice = "all" | "desktop" | "mobile";
export type AdPage =
  | "global"
  | "home"
  | "article"
  | "category"
  | "gallery"
  | "video";

export type AdSlotDef = {
  code: string;
  name: string;
  page: AdPage;
  device: AdDevice;
  sizes: { desktop?: string; mobile?: string };
  priority: 1 | 2 | 3;
  rotate: boolean;
  note: string;
};

export const AD_SLOTS = {
  masthead: {
    code: "masthead",
    name: "Header üstü billboard",
    page: "global",
    device: "all",
    sizes: { desktop: "970x90 / 728x90", mobile: "320x100" },
    priority: 1,
    rotate: true,
    note: "Logonun hemen üstü. Sitenin en pahalı alanı.",
  },
  "sticky-bottom": {
    code: "sticky-bottom",
    name: "Mobil yapışkan alt bar",
    page: "global",
    device: "mobile",
    sizes: { mobile: "320x50 / 320x100" },
    priority: 1,
    rotate: true,
    note: "Ekranın altına yapışır, kapatma zorunlu.",
  },
  "rail-left": {
    code: "rail-left",
    name: "Sol kolon (sayfa yanı)",
    page: "global",
    device: "desktop",
    sizes: { desktop: "160x600" },
    priority: 2,
    rotate: false,
    note: "İçerik solunda. dar ekranda gizlenir.",
  },
  "rail-right": {
    code: "rail-right",
    name: "Sağ kolon (sayfa yanı)",
    page: "global",
    device: "desktop",
    sizes: { desktop: "160x600" },
    priority: 2,
    rotate: false,
    note: "Sol kolonun eşi.",
  },
  footer: {
    code: "footer",
    name: "Footer üstü yatay",
    page: "global",
    device: "all",
    sizes: { desktop: "970x250", mobile: "336x280" },
    priority: 2,
    rotate: true,
    note: "Sayfa sonuna okuyanlar görür.",
  },
  interstitial: {
    code: "interstitial",
    name: "Geçiş reklamı",
    page: "global",
    device: "all",
    sizes: { desktop: "800x600", mobile: "320x480" },
    priority: 3,
    rotate: false,
    note: "Oturum başına 1 kez.",
  },
  "home-billboard": {
    code: "home-billboard",
    name: "Manşet altı yatay",
    page: "home",
    device: "all",
    sizes: { desktop: "970x250", mobile: "336x280" },
    priority: 1,
    rotate: true,
    note: "Manşetin hemen altı.",
  },
  "home-sidebar-1": {
    code: "home-sidebar-1",
    name: "Anasayfa sağ kolon 1",
    page: "home",
    device: "desktop",
    sizes: { desktop: "300x250" },
    priority: 1,
    rotate: true,
    note: "Sağ kolon üstü.",
  },
  "home-sidebar-sticky": {
    code: "home-sidebar-sticky",
    name: "Anasayfa sağ kolon (yapışkan)",
    page: "home",
    device: "desktop",
    sizes: { desktop: "300x600" },
    priority: 2,
    rotate: false,
    note: "position:sticky.",
  },
  "home-inline-1": {
    code: "home-inline-1",
    name: "Anasayfa blok arası 1",
    page: "home",
    device: "all",
    sizes: { desktop: "970x90", mobile: "336x280" },
    priority: 2,
    rotate: true,
    note: "Haber blokları arası.",
  },
  "home-inline-2": {
    code: "home-inline-2",
    name: "Anasayfa blok arası 2",
    page: "home",
    device: "all",
    sizes: { desktop: "970x90", mobile: "336x280" },
    priority: 3,
    rotate: true,
    note: "Sayfanın alt yarısı.",
  },
  "home-native": {
    code: "home-native",
    name: "Sponsorlu haber (akış içi)",
    page: "home",
    device: "all",
    sizes: { desktop: "haber kartı", mobile: "haber kartı" },
    priority: 3,
    rotate: true,
    note: "Sponsorlu etiketi zorunlu.",
  },
  "article-top": {
    code: "article-top",
    name: "Haber başlığı altı",
    page: "article",
    device: "all",
    sizes: { desktop: "728x90", mobile: "336x280" },
    priority: 1,
    rotate: true,
    note: "Spot altı.",
  },
  "article-inline": {
    code: "article-inline",
    name: "Yazı içi (paragraf arası)",
    page: "article",
    device: "all",
    sizes: { desktop: "336x280", mobile: "336x280" },
    priority: 1,
    rotate: true,
    note: "3. paragraftan sonra, sonra her 5'te bir.",
  },
  "article-bottom": {
    code: "article-bottom",
    name: "Haber sonu",
    page: "article",
    device: "all",
    sizes: { desktop: "728x90", mobile: "336x280" },
    priority: 2,
    rotate: true,
    note: "İlgili haberlerden önce.",
  },
  "article-sidebar-1": {
    code: "article-sidebar-1",
    name: "Haber sağ kolon 1",
    page: "article",
    device: "desktop",
    sizes: { desktop: "300x250" },
    priority: 1,
    rotate: true,
    note: "Sağ kolon üstü.",
  },
  "article-sidebar-sticky": {
    code: "article-sidebar-sticky",
    name: "Haber sağ kolon (yapışkan)",
    page: "article",
    device: "desktop",
    sizes: { desktop: "300x600" },
    priority: 2,
    rotate: false,
    note: "Uzun yazılarda takip eder.",
  },
  "category-top": {
    code: "category-top",
    name: "Kategori üstü yatay",
    page: "category",
    device: "all",
    sizes: { desktop: "970x90", mobile: "320x100" },
    priority: 2,
    rotate: true,
    note: "Kategori başlığı altı.",
  },
  "category-inline": {
    code: "category-inline",
    name: "Kategori listesi arası",
    page: "category",
    device: "all",
    sizes: { desktop: "728x90", mobile: "336x280" },
    priority: 3,
    rotate: true,
    note: "Her 6 haberde bir.",
  },
  "gallery-slide": {
    code: "gallery-slide",
    name: "Galeri slayt arası",
    page: "gallery",
    device: "all",
    sizes: { desktop: "728x90", mobile: "336x280" },
    priority: 3,
    rotate: true,
    note: "Her 4 fotoğrafta bir.",
  },
  "video-preroll": {
    code: "video-preroll",
    name: "Video öncesi",
    page: "video",
    device: "all",
    sizes: { desktop: "video", mobile: "video" },
    priority: 3,
    rotate: false,
    note: "5 sn sonra atlanabilir olmalı.",
  },
} as const satisfies Record<string, AdSlotDef>;

export type AdSlotCode = keyof typeof AD_SLOTS;

export function slotsByPage(): Record<AdPage, AdSlotDef[]> {
  const groups = {} as Record<AdPage, AdSlotDef[]>;
  for (const slot of Object.values(AD_SLOTS) as AdSlotDef[]) {
    (groups[slot.page] ??= []).push(slot);
  }
  return groups;
}

export const PAGE_LABELS: Record<AdPage, string> = {
  global: "Tüm sayfalar",
  home: "Anasayfa",
  article: "Haber ve köşe yazısı",
  category: "Kategori sayfaları",
  gallery: "Foto galeri",
  video: "Video",
};

export function isValidSlot(code: string): code is AdSlotCode {
  return code in AD_SLOTS;
}

export function getSlot(code: string): AdSlotDef | null {
  return isValidSlot(code) ? AD_SLOTS[code] : null;
}
