import { z } from "zod";

export const MenuLocationSchema = z.enum([
  "header",
  "footer",
  "sidebar",
  "icons",
]);
export type MenuLocation = z.infer<typeof MenuLocationSchema>;

export const MenuItemTypeSchema = z.enum([
  "category",
  "page",
  "tag",
  "link",
  "heading",
  "icon",
]);
export type MenuItemType = z.infer<typeof MenuItemTypeSchema>;

export const MenuDropdownTypeSchema = z.enum(["simple", "mega"]);
export type MenuDropdownType = z.infer<typeof MenuDropdownTypeSchema>;

export const MenuDeviceSchema = z.enum(["all", "desktop", "mobile"]);
export type MenuDevice = z.infer<typeof MenuDeviceSchema>;

export const MENU_LOCATION_META: Record<
  MenuLocation,
  { label: string; maxDepth: number; maxRoots: number; note: string }
> = {
  header: {
    label: "Üst menü",
    maxDepth: 2,
    maxRoots: 8,
    note: "7–8 kök; fazlası taşar",
  },
  footer: {
    label: "Footer",
    maxDepth: 1,
    maxRoots: 20,
    note: "Başlık satırı = sütun adı (Bağlantılar, Kurumsal); altındaki linkler o sütuna düşer",
  },
  sidebar: {
    label: "Yan menü",
    maxDepth: 2,
    maxRoots: 40,
    note: "Hamburger (☰) sol panel — buradaki sıra ve öğeler sitede açılır. Boşsa üst menü yedeği kullanılır. «Üst menüyü kopyala» ile hızlı doldur.",
  },
  icons: {
    label: "İkonlar",
    maxDepth: 1,
    maxRoots: 8,
    note: "Düz liste · mobilde ilk 3",
  },
};

/** Sabit kurumsal sayfalar — type=page refId */
export const MENU_STATIC_PAGES = [
  { id: "anasayfa", label: "Anasayfa", href: "/" },
  { id: "son-dakika", label: "Son dakika", href: "/son-dakika" },
  { id: "yazarlar", label: "Yazarlar", href: "/yazarlar" },
  { id: "video", label: "Video", href: "/video" },
  { id: "galeri", label: "Galeri", href: "/galeri" },
  { id: "ilanlar", label: "İlanlar", href: "/ilanlar" },
  { id: "secim", label: "Seçim", href: "/secim" },
  { id: "anketler", label: "Anketler", href: "/anketler" },
  { id: "servis", label: "Servisler", href: "/servis" },
  { id: "vizyon", label: "Vizyon", href: "/servis/vizyon" },
  { id: "kunye", label: "Künye", href: "/kunye" },
  { id: "iletisim", label: "İletişim", href: "/iletisim" },
  { id: "ihbar", label: "İhbar", href: "/ihbar" },
  { id: "kvkk", label: "KVKK", href: "/kvkk" },
  { id: "gizlilik", label: "Gizlilik", href: "/gizlilik" },
  { id: "reklam", label: "Reklam", href: "/reklam" },
  { id: "ara", label: "Ara", href: "/ara" },
  { id: "giris", label: "Giriş", href: "/giris" },
] as const;

export type MenuStaticPageId = (typeof MENU_STATIC_PAGES)[number]["id"];

export function menuStaticPageHref(id: string): string | null {
  return MENU_STATIC_PAGES.find((p) => p.id === id)?.href ?? null;
}

export function menuStaticPageLabel(id: string): string | null {
  return MENU_STATIC_PAGES.find((p) => p.id === id)?.label ?? null;
}

/** İkon şeridi sabitleri — type=icon refId */
export const MENU_ICON_PRESETS = [
  {
    id: "search",
    label: "Arama",
    icon: "Search",
    locked: true,
    hint: "Kapatılamaz — sitenin temel işlevi",
  },
  {
    id: "weather",
    label: "Hava durumu",
    icon: "CloudSun",
    locked: false,
    hint: "Düzce · derece gösterir",
  },
  {
    id: "prayer",
    label: "Namaz vakitleri",
    icon: "Moon",
    locked: false,
    hint: "Sıradaki vakte kalan süre",
  },
  {
    id: "markets",
    label: "Piyasalar",
    icon: "TrendingUp",
    locked: false,
    hint: "Dolar, euro, altın",
  },
  {
    id: "theme",
    label: "Karanlık tema",
    icon: "MoonStar",
    locked: false,
    hint: "Okurun tercihini hatırlar",
  },
  {
    id: "social",
    label: "Sosyal medya",
    icon: "Share2",
    locked: false,
    hint: "Genel ayarlardaki hesaplardan beslenir",
  },
  {
    id: "notify",
    label: "Bildirim izni",
    icon: "Bell",
    locked: false,
    hint: "Push altyapısı bağlanmadan açma",
  },
  {
    id: "login",
    label: "Giriş yap",
    icon: "User",
    locked: false,
    hint: "Üyelik açıksa görünür",
  },
] as const;

export type ApiMenuItem = {
  id: string;
  menuId: string;
  parentId: string | null;
  sortOrder: number;
  type: MenuItemType;
  refId: string | null;
  label: string | null;
  /** Çözülmüş görünen ad */
  resolvedLabel: string;
  url: string | null;
  /** Çözülmüş href (heading için null) */
  href: string | null;
  icon: string | null;
  badgeText: string | null;
  badgeColor: string | null;
  dropdownType: MenuDropdownType;
  targetBlank: boolean;
  device: MenuDevice;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  /** Zamanlama / pasif nedeniyle sitede gizli */
  visibleNow: boolean;
  children: ApiMenuItem[];
  /** Mega menü cache — son haberler */
  megaArticles?: Array<{
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  }>;
};

export type ApiMenu = {
  id: string;
  location: MenuLocation;
  name: string;
  items: ApiMenuItem[];
  updatedAt: string;
};

export const MenuItemInputSchema = z.object({
  parentId: z.string().nullable().optional(),
  type: MenuItemTypeSchema,
  refId: z.string().nullable().optional(),
  label: z.string().trim().max(80).nullable().optional(),
  url: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(60).nullable().optional(),
  badgeText: z.string().trim().max(24).nullable().optional(),
  badgeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  dropdownType: MenuDropdownTypeSchema.optional(),
  targetBlank: z.boolean().optional(),
  device: MenuDeviceSchema.optional(),
  isActive: z.boolean().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type MenuItemInput = z.infer<typeof MenuItemInputSchema>;

export const MenuItemPatchSchema = MenuItemInputSchema.partial();
export type MenuItemPatch = z.infer<typeof MenuItemPatchSchema>;

export const MenuReorderSchema = z.object({
  /** Düz sıralı id listesi (aynı parent altında) */
  orderedIds: z.array(z.string().min(1)).min(1),
  parentId: z.string().nullable().optional(),
});
export type MenuReorderInput = z.infer<typeof MenuReorderSchema>;

export function isMenuItemScheduledVisible(item: {
  isActive: boolean;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  now?: Date;
}): boolean {
  if (!item.isActive) return false;
  const now = item.now ?? new Date();
  if (item.startAt) {
    const s = new Date(item.startAt);
    if (s.getTime() > now.getTime()) return false;
  }
  if (item.endAt) {
    const e = new Date(item.endAt);
    if (e.getTime() < now.getTime()) return false;
  }
  return true;
}
