import { z } from "zod";

/** Eski 8 şablon ID’si — okuma uyumluluğu; hepsi vitrin’e map edilir */
const LEGACY_LAYOUT_IDS = [
  "vitrin",
  "klasik",
  "slider",
  "sol_buyuk",
  "ikiz",
  "mozaik",
  "tam_kapak",
  "gazete",
  "video",
] as const;

/** Tek manşet düzeni */
export const MansetLayoutIdSchema = z
  .enum(LEGACY_LAYOUT_IDS)
  .catch("vitrin")
  .transform((): "vitrin" => "vitrin");
export type MansetLayoutId = "vitrin";

export type MansetLayoutDef = {
  id: MansetLayoutId;
  label: string;
  blurb: string;
  panelVisible: boolean;
  desktopSlots: number;
  mobileSlots: number;
};

export const MANSET_LAYOUTS: readonly MansetLayoutDef[] = [
  {
    id: "vitrin",
    label: "Vitrin",
    blurb: "Editöryel manşet — büyük sürgü + sağda 4 haber.",
    panelVisible: true,
    desktopSlots: 24,
    mobileSlots: 12,
  },
] as const;

export function mansetLayoutDef(_id?: string): MansetLayoutDef {
  return MANSET_LAYOUTS[0]!;
}

/** Her zaman tek vitrin düzeni */
export function effectiveMansetLayout(
  _base?: string,
  _emergency?: boolean,
): MansetLayoutId {
  return "vitrin";
}

export const FeaturedFillSchema = z.enum(["editor", "auto", "hybrid"]);
export type FeaturedFill = z.infer<typeof FeaturedFillSchema>;

export const MansetFeaturedSettingsSchema = z.object({
  desktopCount: z.coerce.number().int().min(2).max(6).default(4),
  mobileCount: z.coerce.number().int().min(2).max(4).default(3),
  fill: FeaturedFillSchema.default("hybrid"),
  pinnedIds: z.array(z.string().min(1)).max(6).default([]),
  autoMode: z.enum(["latest", "views24h"]).default("latest"),
  includeCategoryIds: z.array(z.string()).default([]),
  excludeCategoryIds: z.array(z.string()).default([]),
});
export type MansetFeaturedSettings = z.infer<typeof MansetFeaturedSettingsSchema>;

export const MansetSettingsSchema = z.object({
  layout: MansetLayoutIdSchema.default("vitrin"),
  /** Olağanüstü: otomatik geçişi durdur, ilk slaytta kal */
  emergency: z.boolean().default(false),
  desktopLimit: z.coerce.number().int().min(1).max(24).default(12),
  mobileLimit: z.coerce.number().int().min(1).max(16).default(8),
  showAuthor: z.boolean().default(true),
  showComments: z.boolean().default(true),
  showMetaOnSmall: z.boolean().default(false),
  featured: MansetFeaturedSettingsSchema.default({}),
  mainLimit: z.coerce.number().int().min(1).max(24).default(12),
  sideLimit: z.coerce.number().int().min(1).max(10).default(4),
  autoplay: z.boolean().default(true),
  autoplaySec: z.coerce.number().int().min(3).max(30).default(6),
  sideAutoplaySec: z.coerce.number().int().min(3).max(30).default(7),
});
export type MansetSettings = z.infer<typeof MansetSettingsSchema>;

export const DEFAULT_MANSET_SETTINGS: MansetSettings =
  MansetSettingsSchema.parse({});

export const MANSET_SETTINGS_KEY = "manset.settings";

export const MansetSlotOverrideSchema = z.object({
  headlineTitle: z.string().trim().max(120).nullable().optional(),
  kicker: z.string().trim().max(80).nullable().optional(),
  spot: z.string().trim().max(140).nullable().optional(),
  badgeText: z.string().trim().max(40).nullable().optional(),
  badgeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  badgeExpiresAt: z.string().datetime().nullable().optional(),
});
export type MansetSlotOverride = z.infer<typeof MansetSlotOverrideSchema>;
