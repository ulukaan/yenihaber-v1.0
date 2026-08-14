import { z } from "zod";

/**
 * Panel rolleri
 * ADMIN = Süper Admin · EDITOR · MUHABIR/Yazar · MODERATOR
 * YAZAR=legacy (MUHABIR) · UYE=site üyesi
 *
 * | Rol        | Haber yazar | Yayınlar | Manşet | Yorum | Ayarlar |
 * | ADMIN      | ✓           | ✓        | ✓      | ✓     | ✓       |
 * | EDITOR     | ✓           | ✓ hepsi  | ✓      | ✓     | –       |
 * | MUHABIR    | ✓ kendi     | – taslak | –      | –     | –       |
 * | MODERATOR  | –           | –        | –      | ✓     | –       |
 */
export const RoleSchema = z.enum([
  "ADMIN",
  "EDITOR",
  "MUHABIR",
  "MODERATOR",
  "YAZAR",
  "UYE",
]);
export type Role = z.infer<typeof RoleSchema>;

/** Panel personeli — dört rol + legacy YAZAR */
export const STAFF_ROLES: Role[] = [
  "ADMIN",
  "EDITOR",
  "MUHABIR",
  "MODERATOR",
  "YAZAR",
];

export const PANEL_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Süper Admin",
  EDITOR: "Editör",
  MUHABIR: "Muhabir / Yazar",
  MODERATOR: "Moderatör",
  YAZAR: "Muhabir / Yazar",
  UYE: "Üye",
};

/**
 * Sabit yetki matrisi
 * Muhabir kendi haberini yayınlayamaz — taslak/onaya gönderir
 */
export const ROLE_CAPABILITIES = {
  writeArticle: ["ADMIN", "EDITOR", "MUHABIR", "YAZAR"] as Role[],
  /** Site üyesinin onaya haber göndermesi */
  submitMemberArticle: [
    "ADMIN",
    "EDITOR",
    "MUHABIR",
    "YAZAR",
    "UYE",
    "MODERATOR",
  ] as Role[],
  publish: ["ADMIN", "EDITOR"] as Role[],
  manset: ["ADMIN", "EDITOR"] as Role[],
  moderateComments: ["ADMIN", "EDITOR", "MODERATOR"] as Role[],
  manageUsers: ["ADMIN"] as Role[],
  manageSettings: ["ADMIN"] as Role[],
} as const;

export function hasCapability(
  role: Role,
  cap: keyof typeof ROLE_CAPABILITIES,
): boolean {
  return (ROLE_CAPABILITIES[cap] as Role[]).includes(role);
}

export const UserStatusSchema = z.enum(["aktif", "askida"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const AuthorProfileStatusSchema = z.enum(["yayinda", "gizli"]);
export type AuthorProfileStatus = z.infer<typeof AuthorProfileStatusSchema>;

/** 2FA zorunlu roller */
export function requiresTwoFactor(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

/** Yayın akışı: Taslak → Onayda → Zamanlanmış → Yayında (+ Arşiv) */
export const ArticleStatusSchema = z.enum([
  "TASLAK",
  "ONAYDA",
  "ZAMANLANMIS",
  "YAYINDA",
  "ARSIV",
]);
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  TASLAK: "Taslak",
  ONAYDA: "Onayda",
  ZAMANLANMIS: "Zamanlanmış",
  YAYINDA: "Yayında",
  ARSIV: "Arşiv",
};

/** Sadece siteye basan roller */
export const PUBLISH_ROLES: Role[] = ["ADMIN", "EDITOR"];

/** Muhabir / yazar onaya en fazla bu kadar gidebilir */
export const REPORTER_MAX_STATUS: ArticleStatus[] = ["TASLAK", "ONAYDA"];

/** Site üye — yalnızca onaya (veya taslak) */
export const MEMBER_MAX_STATUS: ArticleStatus[] = ["TASLAK", "ONAYDA"];

export function canPublish(role: Role): boolean {
  return PUBLISH_ROLES.includes(role);
}

/** Muhabir/üye YAYINDA/ZAMANLANMIS/ARSIV seçemez */
export function assertStatusAllowedForRole(
  role: Role,
  status: ArticleStatus,
): { ok: true } | { ok: false; message: string } {
  if (canPublish(role)) return { ok: true };
  if (role === "MODERATOR") {
    return { ok: false, message: "Moderatör haber yayın durumu değiştiremez" };
  }
  if (role === "UYE") {
    if (MEMBER_MAX_STATUS.includes(status)) return { ok: true };
    return {
      ok: false,
      message: "Üyeler haberi yalnızca onaya gönderebilir; yayın editöre aittir",
    };
  }
  if (REPORTER_MAX_STATUS.includes(status)) return { ok: true };
  return {
    ok: false,
    message: "Muhabir yalnızca taslak veya onaya gönderebilir",
  };
}

/**
 * BEKLEMEDE=onay bekliyor · ONAYLI=sitede · ARSIV=geri alınabilir · COP=30 gün sonra kalıcı sil
 * (eski REDDEDILDI → COP)
 */
export const CommentStatusSchema = z.enum([
  "BEKLEMEDE",
  "ONAYLI",
  "ARSIV",
  "COP",
]);
export type CommentStatus = z.infer<typeof CommentStatusSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
  password: z.string().min(6, "En az 6 karakter"),
  totp: z.string().regex(/^\d{6}$/).optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Ad en az 2 karakter").max(80),
    email: z.string().email("Geçerli e-posta girin"),
    password: z.string().min(8, "Şifre en az 8 karakter"),
    passwordConfirm: z.string().min(8, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Şifreler eşleşmiyor",
    path: ["passwordConfirm"],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8, "Şifre en az 8 karakter"),
    passwordConfirm: z.string().min(8),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Şifreler eşleşmiyor",
    path: ["passwordConfirm"],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const CATEGORY_MAX_ROOT = 12;
/** Alt kategori ile birlikte üst sınır (menü şişmesin) */
export const CATEGORY_MAX_TOTAL = 40;

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export const CategoryBucketSchema = z.enum([
  "bolge",
  "haber",
  "parti",
  "kurum",
]);
export type CategoryBucket = z.infer<typeof CategoryBucketSchema>;

export const CATEGORY_BUCKET_LABELS: Record<CategoryBucket, string> = {
  bolge: "Bölge Kategorileri",
  haber: "Haber Kategorileri",
  parti: "Parti Kategorileri",
  kurum: "Kurum Kategorileri",
};

/** Tek kategori sayfası — WordPress page template */
export const CategoryPageTemplateSchema = z.enum([
  "magazine",
  "list",
  "sport",
  "economy",
  "chips",
]);
export type CategoryPageTemplate = z.infer<typeof CategoryPageTemplateSchema>;

export const CATEGORY_PAGE_TEMPLATES: {
  id: CategoryPageTemplate;
  label: string;
  hint: string;
}[] = [
  {
    id: "magazine",
    label: "Magazin (varsayılan)",
    hint: "Manşet + yan liste + kart ızgara",
  },
  {
    id: "list",
    label: "Liste",
    hint: "Sade haber listesi, büyük manşet yok",
  },
  {
    id: "sport",
    label: "Spor",
    hint: "Magazin + canlı skor paneli",
  },
  {
    id: "economy",
    label: "Ekonomi",
    hint: "Magazin + piyasa şeridi",
  },
  {
    id: "chips",
    label: "Alt kategori şeritli",
    hint: "Çocuk kategoriler chip olarak (parti / ilçe)",
  },
];

export const CategoryInputSchema = z
  .object({
    name: z.string().min(2).max(80),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sortOrder: z.number().int().min(0).default(0),
    description: z.string().min(1).max(1200),
    parentId: z.string().min(1).nullable().optional(),
    inMenu: z.boolean().default(true),
    menuOrder: z.number().int().min(0).default(0),
    onHome: z.boolean().default(false),
    homeOrder: z.number().int().min(0).default(0),
    commentsEnabled: z.boolean().default(true),
    disableQuickComment: z.boolean().optional(),
    defaultCover: z
      .string()
      .url()
      .nullable()
      .optional()
      .or(z.literal("")),
    status: z.enum(["aktif", "pasif"]).default("aktif"),
    bucket: CategoryBucketSchema.default("haber"),
    pageTemplate: CategoryPageTemplateSchema.default("magazine"),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .optional(),
    logoUrl: z.string().url().nullable().optional().or(z.literal("")),
    forceColor: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const words = countWords(data.description);
    if (words < 60 || words > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Açıklama 60–100 kelime olmalı (şu an ${words})`,
        path: ["description"],
      });
    }
    if (data.bucket === "parti" && !data.color) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parti kategorisinde renk zorunlu",
        path: ["color"],
      });
    }
  });
export type CategoryInput = z.infer<typeof CategoryInputSchema>;

/** PATCH — description gönderilirse yine 60–100 */
export const CategoryPatchSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    slug: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    sortOrder: z.number().int().min(0).optional(),
    description: z.string().min(1).max(1200).optional(),
    parentId: z.string().min(1).nullable().optional(),
    inMenu: z.boolean().optional(),
    menuOrder: z.number().int().min(0).optional(),
    onHome: z.boolean().optional(),
    homeOrder: z.number().int().min(0).optional(),
    commentsEnabled: z.boolean().optional(),
    disableQuickComment: z.boolean().optional(),
    defaultCover: z
      .string()
      .url()
      .nullable()
      .optional()
      .or(z.literal("")),
    status: z.enum(["aktif", "pasif"]).optional(),
    bucket: CategoryBucketSchema.optional(),
    pageTemplate: CategoryPageTemplateSchema.optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .optional(),
    logoUrl: z.string().url().nullable().optional().or(z.literal("")),
    forceColor: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.description === undefined) return;
    const words = countWords(data.description);
    if (words < 60 || words > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Açıklama 60–100 kelime olmalı (şu an ${words})`,
        path: ["description"],
      });
    }
  });
export type CategoryPatch = z.infer<typeof CategoryPatchSchema>;

export const CategoryMoveSchema = z.object({
  targetCategoryId: z.string().min(1),
});
export type CategoryMoveInput = z.infer<typeof CategoryMoveSchema>;

/** Ana sayfa şeritleri — tek Kaydet (sürükleme canlıya gitmez) */
export const HomeRailsSaveSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        onHome: z.boolean(),
        homeOrder: z.number().int().min(0),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .nullable()
          .optional(),
      }),
    )
    .max(40),
});
export type HomeRailsSaveInput = z.infer<typeof HomeRailsSaveSchema>;

/* ─── Etiket disiplini ─── */

/** Sayfa üretimi / indekslenme eşiği (3+ haber) */
export const TAG_INDEX_MIN = 3;
/** Haberde ideal aralık */
export const TAG_PER_ARTICLE_MIN = 3;
export const TAG_PER_ARTICLE_IDEAL = 6;
/** 7’de uyarı, 10’da kilit */
export const TAG_PER_ARTICLE_WARN = 7;
export const TAG_PER_ARTICLE_MAX = 10;
/** Manşet altı gündemdekiler */
export const TAG_FEATURED_MIN = 5;
export const TAG_FEATURED_MAX = 8;
/** Benzerlik eşiği (pg_trgm ~0.6) */
export const TAG_SIMILARITY_THRESHOLD = 0.6;

/**
 * Kategori gibi her habere yapıştırılan anlamsız etiketler.
 * Normalize slug veya ad ile eşleşir.
 */
export const TAG_BLACKLIST = [
  "haber",
  "haberler",
  "duzce",
  "düzce",
  "son dakika",
  "son-dakika",
  "sondakika",
  "guncel",
  "güncel",
  "yerel",
  "lokal",
  "video",
  "galeri",
  "foto",
  "duyuru",
  "ilan",
  "manset",
  "manşet",
  "trend",
  "populer",
  "popüler",
  "breaking",
  "news",
  "genel",
] as const;

/** Küçük harf + fazla boşluk temizliği (görünen ad) */
export function normalizeTagName(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR");
}

/** Aynı slug = aynı etiket */
export function tagSlugFromName(input: string): string {
  return slugify(normalizeTagName(input));
}

export function isTagBlacklisted(nameOrSlug: string): boolean {
  const slug = tagSlugFromName(nameOrSlug);
  const name = normalizeTagName(nameOrSlug);
  return TAG_BLACKLIST.some((b) => {
    const bs = tagSlugFromName(b);
    return bs === slug || normalizeTagName(b) === name;
  });
}

/** Bigram Dice — SQLite’ta pg_trgm yok; Benzerler sekmesi */
export function stringSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;
  const bigrams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = bigrams(s1);
  const B = bigrams(s2);
  let overlap = 0;
  for (const [g, c] of A) {
    const bc = B.get(g) ?? 0;
    if (bc) overlap += Math.min(c, bc);
  }
  return (2 * overlap) / (s1.length - 1 + (s2.length - 1));
}

export function tagIsIndexable(articleCount: number): boolean {
  return articleCount >= TAG_INDEX_MIN;
}

const tagNameRefine = (
  names: string[],
  ctx: z.RefinementCtx,
  path: (string | number)[] = ["tagNames"],
) => {
  if (names.length > TAG_PER_ARTICLE_MAX) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `En fazla ${TAG_PER_ARTICLE_MAX} etiket (haber başına 3–6 ideal)`,
      path,
    });
  }
  const seen = new Set<string>();
  names.forEach((raw, i) => {
    const name = normalizeTagName(raw);
    if (name.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Etiket en az 2 karakter",
        path: [...path, i],
      });
      return;
    }
    if (isTagBlacklisted(name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `«${raw}» kara listede — özel isim kullanın (kişi, kurum, olay)`,
        path: [...path, i],
      });
      return;
    }
    const slug = tagSlugFromName(name);
    if (!slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Geçersiz etiket",
        path: [...path, i],
      });
      return;
    }
    if (seen.has(slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Aynı etiket yineleniyor: ${name}`,
        path: [...path, i],
      });
      return;
    }
    seen.add(slug);
  });
};

export const TagInputSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(60)
    .transform(normalizeTagName)
    .refine((n) => !isTagBlacklisted(n), {
      message: "Bu etiket kara listede — özel isim kullanın",
    }),
  isFeatured: z.boolean().optional(),
  featuredOrder: z.number().int().min(0).max(100).optional(),
  status: z.enum(["aktif", "pasif"]).optional(),
});
export type TagInput = z.infer<typeof TagInputSchema>;

export const TagPatchSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(60)
    .transform(normalizeTagName)
    .refine((n) => !isTagBlacklisted(n), {
      message: "Bu etiket kara listede",
    })
    .optional(),
  isFeatured: z.boolean().optional(),
  featuredOrder: z.number().int().min(0).max(100).optional(),
  status: z.enum(["aktif", "pasif"]).optional(),
});
export type TagPatch = z.infer<typeof TagPatchSchema>;

export const TagMergeSchema = z.object({
  /** Kaynak(lar) → hedef; ilişkiler taşınır, eski slug’a 301, kaynak silinir */
  sourceIds: z.array(z.string().min(1)).min(1).max(20),
  targetId: z.string().min(1),
});
export type TagMergeInput = z.infer<typeof TagMergeSchema>;

export const TagBulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  action: z.enum(["feature", "unfeature", "delete"]),
});
export type TagBulkInput = z.infer<typeof TagBulkSchema>;

/**
 * Kapak alanı: görsel doluysa alt metin + kaynak zorunlu.
 * Meta description max 300 — SEO şişmesini engeller.
 * Video: embedding (YT/Vimeo/Bunny), kendi sunucuda barındırma yok.
 */
export const ContentTypeSchema = z.enum(["haber", "video", "galeri"]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const VideoProviderSchema = z.enum(["youtube", "vimeo", "bunny"]);
export type VideoProvider = z.infer<typeof VideoProviderSchema>;

export const VideoOrientationSchema = z.enum(["yatay", "dikey"]);
export type VideoOrientation = z.infer<typeof VideoOrientationSchema>;

/** Transkript: en az ~3–4 kısa paragraf (SEO + erişilebilirlik) */
export const VIDEO_TRANSCRIPT_MIN_CHARS = 280;

/** Saniye → ISO 8601 duration (PT4M12S) — VideoObject için zorunlu biçim */
export function secondsToIso8601Duration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  let out = "PT";
  if (h > 0) out += `${h}H`;
  if (m > 0 || h > 0) out += `${m}M`;
  out += `${sec}S`;
  return out;
}

export function formatVideoDurationLabel(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0 || !Number.isFinite(seconds)) return "";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** YouTube / Vimeo / Bunny URL → provider + id */
export function parseVideoUrl(raw: string): {
  provider: VideoProvider;
  id: string;
  watchUrl: string;
} | null {
  const input = raw.trim();
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
    if (id && /^[\w-]{6,}$/.test(id)) {
      return {
        provider: "youtube",
        id,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    }
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{6,}$/.test(v)) {
      return {
        provider: "youtube",
        id: v,
        watchUrl: `https://www.youtube.com/watch?v=${v}`,
      };
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const emb = parts[0] === "embed" || parts[0] === "live" || parts[0] === "shorts"
      ? parts[1]
      : null;
    if (emb && /^[\w-]{6,}$/.test(emb)) {
      return {
        provider: "youtube",
        id: emb,
        watchUrl: `https://www.youtube.com/watch?v=${emb}`,
      };
    }
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts.find((p) => /^\d+$/.test(p));
    if (id) {
      return {
        provider: "vimeo",
        id,
        watchUrl: `https://vimeo.com/${id}`,
      };
    }
  }
  // Bunny Stream iframe: https://iframe.mediadelivery.net/embed/LIBRARY/GUID
  if (host.endsWith("mediadelivery.net") || host.includes("bunny")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (id && id.length > 4) {
      return {
        provider: "bunny",
        id: parts.join("/"),
        watchUrl: input,
      };
    }
  }
  return null;
}

export function videoEmbedUrl(
  provider: VideoProvider,
  id: string,
  opts?: { autoplay?: boolean },
): string {
  const ap = opts?.autoplay ? "1" : "0";
  if (provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=${ap}`;
  }
  if (provider === "vimeo") {
    return `https://player.vimeo.com/video/${id}?autoplay=${ap}`;
  }
  // bunny id may be library/guid
  if (id.includes("/")) {
    return `https://iframe.mediadelivery.net/embed/${id}?autoplay=${ap === "1"}`;
  }
  return `https://iframe.mediadelivery.net/play/${id}`;
}

function videoPublishRefine(
  data: {
    contentType?: string;
    status?: string;
    videoProvider?: string | null;
    videoId?: string | null;
    videoTranscript?: string | null;
    videoSource?: string | null;
  },
  ctx: z.RefinementCtx,
  /** true: yalnızca contentType body'de video veya bilinmiyorsa ve alanlar doluysa */
  mode: "create" | "patch" = "create",
) {
  const type = data.contentType ?? (mode === "create" ? "haber" : undefined);
  if (type !== undefined && type !== "video") return;
  if (mode === "patch" && type === undefined) {
    // API merge ile doğrular
    return;
  }
  const publishing =
    data.status === "YAYINDA" || data.status === "ZAMANLANMIS";
  if (!publishing) return;

  if (!data.videoProvider || !data.videoId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Video yayın için YouTube/Vimeo bağlantısı gerekli",
      path: ["videoId"],
    });
  }
  const transcript = (data.videoTranscript ?? "").trim();
  if (transcript.length < VIDEO_TRANSCRIPT_MIN_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Transkript eksik (en az ${VIDEO_TRANSCRIPT_MIN_CHARS} karakter — arama ve erişilebilirlik)`,
      path: ["videoTranscript"],
    });
  }
  if (!(data.videoSource ?? "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Kaynak / telif zorunlu (ajans, muhabir veya sosyal medya + izin)",
      path: ["videoSource"],
    });
  }
}

/** API: yayına almadan önce merge edilmiş video alanlarını doğrula */
export function assertVideoReadyForPublish(fields: {
  contentType: string;
  videoProvider?: string | null;
  videoId?: string | null;
  videoTranscript?: string | null;
  videoSource?: string | null;
}): string | null {
  if (fields.contentType !== "video") return null;
  if (!fields.videoProvider || !fields.videoId) {
    return "Video yayın için YouTube/Vimeo bağlantısı gerekli";
  }
  if ((fields.videoTranscript ?? "").trim().length < VIDEO_TRANSCRIPT_MIN_CHARS) {
    return `Transkript eksik (en az ${VIDEO_TRANSCRIPT_MIN_CHARS} karakter)`;
  }
  if (!(fields.videoSource ?? "").trim()) {
    return "Kaynak / telif zorunlu";
  }
  return null;
}

export const ArticleInputSchema = z
  .object({
    title: z.string().min(3).max(200),
    /** Manşet kısa başlık — boşsa asıl başlık */
    headlineTitle: z.string().max(120).optional().nullable().or(z.literal("")),
    slug: z
      .string()
      .min(3)
      .max(220)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug yalnızca küçük harf, sayı ve tire"),
    excerpt: z.string().max(500).optional().nullable(),
    content: z.string().min(10),
    contentType: ContentTypeSchema.default("haber"),
    coverImage: z.string().url().optional().nullable().or(z.literal("")),
    coverAlt: z.string().max(200).optional().nullable().or(z.literal("")),
    coverCredit: z.string().max(120).optional().nullable().or(z.literal("")),
    coverImage169: z.string().url().optional().nullable().or(z.literal("")),
    coverImage43: z.string().url().optional().nullable().or(z.literal("")),
    coverImage11: z.string().url().optional().nullable().or(z.literal("")),
    status: ArticleStatusSchema.default("TASLAK"),
    categoryId: z.string().min(1),
    tagNames: z
      .array(z.string().min(1).max(40))
      .max(TAG_PER_ARTICLE_MAX)
      .default([]),
    isBreaking: z.boolean().default(false),
    /** ISO — yoksa breaking sonsuza kadar kalır (kaçınılmalı) */
    breakingUntil: z.string().datetime().optional().nullable().or(z.literal("")),
    isFeatured: z.boolean().default(false),
    mansetOrder: z.number().int().min(0).max(100).default(0),
    isSideManset: z.boolean().default(false),
    sideOrder: z.number().int().min(0).max(100).default(0),
    /** Ana sayfa «öne çıkan» seçkisi */
    isSpotlight: z.boolean().default(false),
    /** Sponsorlu içerik — zorunlu rozet */
    isSponsored: z.boolean().default(false),
    sourceAgency: z.string().max(40).optional().nullable().or(z.literal("")),
    scheduledAt: z.string().datetime().optional().nullable().or(z.literal("")),
    /** Haber satırı / geriye dönük tarih */
    publishedAt: z.string().datetime().optional().nullable().or(z.literal("")),
    commentsClosed: z.boolean().default(false),
    pressAdNo: z.string().max(80).optional().nullable().or(z.literal("")),
    relatedArticleId: z.string().max(40).optional().nullable().or(z.literal("")),
    redirectUrl: z.string().max(250).optional().nullable().or(z.literal("")),
    updateNote: z.string().max(500).optional().nullable().or(z.literal("")),
    metaTitle: z.string().max(120).optional().nullable(),
    metaDescription: z.string().max(300).optional().nullable(),
    videoProvider: VideoProviderSchema.optional().nullable(),
    videoId: z.string().min(1).max(200).optional().nullable(),
    videoDuration: z.number().int().min(0).max(86400).optional().nullable(),
    videoPoster: z.string().url().optional().nullable().or(z.literal("")),
    videoOrientation: VideoOrientationSchema.default("yatay"),
    videoTranscript: z.string().max(50000).optional().nullable(),
    videoSource: z.string().max(200).optional().nullable().or(z.literal("")),
    videoIsLive: z.boolean().default(false),
    videoLiveEndsAt: z
      .string()
      .datetime()
      .optional()
      .nullable()
      .or(z.literal("")),
    galleryImages: z
      .array(
        z.object({
          url: z.string().url(),
          alt: z.string().max(200).optional().nullable(),
        }),
      )
      .max(40)
      .optional(),
  })
  .superRefine((data, ctx) => {
    const cover =
      data.coverImage && data.coverImage !== "" ? data.coverImage : null;
    if (cover) {
      if (!data.coverAlt || !String(data.coverAlt).trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kapak görseli için alt metin zorunlu",
          path: ["coverAlt"],
        });
      }
      if (!data.coverCredit || !String(data.coverCredit).trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kapak görseli için fotoğraf kaynağı zorunlu",
          path: ["coverCredit"],
        });
      }
    }
    if (data.status === "ZAMANLANMIS") {
      if (!data.scheduledAt || data.scheduledAt === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Zamanlanmış yayın için tarih gerekli",
          path: ["scheduledAt"],
        });
      }
    }
    if (data.isBreaking && (!data.breakingUntil || data.breakingUntil === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Son dakika için otomatik kaldırma süresi gerekli",
        path: ["breakingUntil"],
      });
    }
    tagNameRefine(data.tagNames ?? [], ctx);
    videoPublishRefine(data, ctx, "create");
  });
export type ArticleInput = z.infer<typeof ArticleInputSchema>;

/**
 * Site üyesi haber gönderimi — admin onayı (ONAYDA) zorunlu, yayın yok.
 */
export const MemberArticleSubmitSchema = z
  .object({
    title: z
      .string()
      .min(8, "Başlık en az 8 karakter")
      .max(200, "Başlık en fazla 200 karakter"),
    content: z
      .string()
      .min(80, "Metin en az 80 karakter olmalı")
      .max(50000),
    excerpt: z.string().max(500).optional().nullable().or(z.literal("")),
    categoryId: z.string().min(1, "Kategori seçin"),
    coverImage: z
      .string()
      .url("Geçerli bir görsel adresi girin")
      .optional()
      .nullable()
      .or(z.literal("")),
    coverAlt: z.string().max(200).optional().nullable().or(z.literal("")),
    coverCredit: z.string().max(120).optional().nullable().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const cover =
      data.coverImage && data.coverImage !== "" ? data.coverImage : null;
    if (cover) {
      if (!data.coverAlt || !String(data.coverAlt).trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kapak için kısa açıklama (alt metin) zorunlu",
          path: ["coverAlt"],
        });
      }
      if (!data.coverCredit || !String(data.coverCredit).trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kapak için kaynak / fotoğraf kredisi zorunlu",
          path: ["coverCredit"],
        });
      }
    }
  });
export type MemberArticleSubmit = z.infer<typeof MemberArticleSubmitSchema>;

/** PATCH gövdesi — status default uygulanmaz (satır içi düzenleme bozulmasın) */
export const ArticlePatchSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    headlineTitle: z.string().max(120).optional().nullable().or(z.literal("")),
    slug: z
      .string()
      .min(3)
      .max(220)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug yalnızca küçük harf, sayı ve tire")
      .optional(),
    excerpt: z.string().max(500).optional().nullable(),
    content: z.string().min(10).optional(),
    contentType: ContentTypeSchema.optional(),
    coverImage: z.string().url().optional().nullable().or(z.literal("")),
    coverAlt: z.string().max(200).optional().nullable().or(z.literal("")),
    coverCredit: z.string().max(120).optional().nullable().or(z.literal("")),
    coverImage169: z.string().url().optional().nullable().or(z.literal("")),
    coverImage43: z.string().url().optional().nullable().or(z.literal("")),
    coverImage11: z.string().url().optional().nullable().or(z.literal("")),
    status: ArticleStatusSchema.optional(),
    categoryId: z.string().min(1).optional(),
    tagNames: z
      .array(z.string().min(1).max(40))
      .max(TAG_PER_ARTICLE_MAX)
      .optional(),
    isBreaking: z.boolean().optional(),
    breakingUntil: z.string().datetime().optional().nullable().or(z.literal("")),
    isFeatured: z.boolean().optional(),
    mansetOrder: z.number().int().min(0).max(100).optional(),
    isSideManset: z.boolean().optional(),
    sideOrder: z.number().int().min(0).max(100).optional(),
    isSpotlight: z.boolean().optional(),
    isSponsored: z.boolean().optional(),
    sourceAgency: z.string().max(40).optional().nullable().or(z.literal("")),
    scheduledAt: z.string().datetime().optional().nullable().or(z.literal("")),
    publishedAt: z.string().datetime().optional().nullable().or(z.literal("")),
    commentsClosed: z.boolean().optional(),
    pressAdNo: z.string().max(80).optional().nullable().or(z.literal("")),
    relatedArticleId: z.string().max(40).optional().nullable().or(z.literal("")),
    redirectUrl: z.string().max(250).optional().nullable().or(z.literal("")),
    updateNote: z.string().max(500).optional().nullable().or(z.literal("")),
    metaTitle: z.string().max(120).optional().nullable(),
    metaDescription: z.string().max(300).optional().nullable(),
    videoProvider: VideoProviderSchema.optional().nullable(),
    videoId: z.string().min(1).max(200).optional().nullable(),
    videoDuration: z.number().int().min(0).max(86400).optional().nullable(),
    videoPoster: z.string().url().optional().nullable().or(z.literal("")),
    videoOrientation: VideoOrientationSchema.optional(),
    videoTranscript: z.string().max(50000).optional().nullable(),
    videoSource: z.string().max(200).optional().nullable().or(z.literal("")),
    videoIsLive: z.boolean().optional(),
    videoLiveEndsAt: z
      .string()
      .datetime()
      .optional()
      .nullable()
      .or(z.literal("")),
    galleryImages: z
      .array(
        z.object({
          url: z.string().url(),
          alt: z.string().max(200).optional().nullable(),
        }),
      )
      .max(40)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tagNames !== undefined) tagNameRefine(data.tagNames, ctx);
    videoPublishRefine(data, ctx, "patch");
  });
export type ArticlePatch = z.infer<typeof ArticlePatchSchema>;

export const VideoOembedInputSchema = z.object({
  url: z.string().min(8).max(500),
});
export type VideoOembedInput = z.infer<typeof VideoOembedInputSchema>;

export type VideoOembedResult = {
  provider: VideoProvider;
  videoId: string;
  title: string;
  poster: string | null;
  duration: number | null;
  watchUrl: string;
  embedUrl: string;
  html: string | null;
};

/** Medya yükleme meta — upload pipeline bunu doğrular */
export const MediaUploadMetaSchema = z.object({
  altText: z.string().min(3, "Alt metin zorunlu").max(200),
  credit: z.string().min(2, "Fotoğraf kaynağı zorunlu").max(120),
});
export type MediaUploadMeta = z.infer<typeof MediaUploadMetaSchema>;

/** Künye — footer + JSON-LD */
export const KunyeSettingsSchema = z.object({
  publisherName: z.string().min(2).max(120),
  responsibleManager: z.string().min(2).max(120),
  kepAddress: z.string().email().or(z.string().min(3).max(120)),
  hostingProvider: z.string().min(2).max(200),
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
});
export type KunyeSettings = z.infer<typeof KunyeSettingsSchema>;

export const KUNYE_SETTING_KEY = "kunye";

export const DEFAULT_KUNYE: KunyeSettings = {
  publisherName: "Düzce Radikal",
  responsibleManager: "Sorumlu Müdür",
  kepAddress: "info@duzceradikal.example",
  hostingProvider: "Yer sağlayıcı bilgisi",
  address: null,
  phone: null,
  email: null,
};

/** Sabit slotlar — panel "slot ekle" sunmaz; düzen koddan gelir */
export const MANSET_HOME_SLOT_COUNT = 24; // sürgü kapasitesi (panel + site)
export const MANSET_CATEGORY_SLOT_COUNT = 4; // 1 öne çıkan + 3 satır
export const MANSET_LOCK_TTL_MS = 30_000;
export const MANSET_BREAKING_DEFAULT_HOURS = 3;

export {
  MANSET_LAYOUTS,
  MANSET_SETTINGS_KEY,
  DEFAULT_MANSET_SETTINGS,
  MansetLayoutIdSchema,
  MansetSettingsSchema,
  MansetFeaturedSettingsSchema,
  MansetSlotOverrideSchema,
  FeaturedFillSchema,
  mansetLayoutDef,
  effectiveMansetLayout,
  type MansetLayoutId,
  type MansetLayoutDef,
  type MansetSettings,
  type MansetFeaturedSettings,
  type MansetSlotOverride,
  type FeaturedFill,
} from "./manset-layouts";

import {
  MansetSlotOverrideSchema,
  type MansetSettings,
  type MansetLayoutId,
} from "./manset-layouts";

export const FrontLayoutKindSchema = z
  .string()
  .regex(/^(home|cat:[a-zA-Z0-9_-]+)$/, "Geçersiz layout kind");
export type FrontLayoutKind = z.infer<typeof FrontLayoutKindSchema>;

export const MansetSlotSchema = z
  .object({
    slot: z.number().int().min(1).max(24),
    articleId: z.string().min(1).nullable(),
  })
  .merge(MansetSlotOverrideSchema);
export type MansetSlot = z.infer<typeof MansetSlotSchema>;

export const MansetBreakingSchema = z
  .object({
    enabled: z.boolean().default(false),
    text: z.string().trim().max(180).optional().default(""),
    url: z.string().url().optional().nullable().or(z.literal("")),
    expiresAt: z.string().datetime().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.enabled) {
      if (!v.text?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Son dakika metni zorunlu",
          path: ["text"],
        });
      }
      if (!v.expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Son dakika bitiş saati zorunlu",
          path: ["expiresAt"],
        });
      }
    }
  });
export type MansetBreaking = z.infer<typeof MansetBreakingSchema>;

/** Taslak kaydet — anında canlıya çıkmaz */
export const MansetDraftUpdateSchema = z.object({
  kind: FrontLayoutKindSchema.default("home"),
  slots: z.array(MansetSlotSchema).min(1).max(12),
  breaking: MansetBreakingSchema.optional().nullable(),
});
export type MansetDraftUpdateInput = z.infer<typeof MansetDraftUpdateSchema>;

/** @deprecated — legacy anında kaydet; paneller draft API kullanır */
export const MansetUpdateSchema = z.object({
  mainIds: z.array(z.string().min(1)).max(20),
  sideIds: z.array(z.string().min(1)).max(10),
  settings: z.record(z.unknown()).optional(),
});
export type MansetUpdateInput = z.infer<typeof MansetUpdateSchema>;

export function emptyMansetSlots(count: number): MansetSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    slot: i + 1,
    articleId: null as string | null,
  }));
}

export function mansetSlotCountForKind(kind: string): number {
  if (kind === "home") return MANSET_HOME_SLOT_COUNT;
  if (kind.startsWith("cat:")) return MANSET_CATEGORY_SLOT_COUNT;
  return MANSET_HOME_SLOT_COUNT;
}

/** Manşet / kapak kontrolü — logo ve boş URL kapak sayılmaz */
export function isUsableArticleCover(url?: string | null): boolean {
  const u = (url ?? "").trim();
  if (!u) return false;
  const lower = u.toLowerCase();
  if (lower.includes("/marka/")) return false;
  if (lower.includes("logo-color") || lower.includes("logo-white")) return false;
  if (lower.includes("favicon")) return false;
  if (lower.includes("/brand/logo")) return false;
  return true;
}

export function articleHasMansetCover(a: {
  coverImage169?: string | null;
  coverImage?: string | null;
  videoPoster?: string | null;
}): boolean {
  return (
    isUsableArticleCover(a.coverImage169) ||
    isUsableArticleCover(a.coverImage) ||
    isUsableArticleCover(a.videoPoster)
  );
}

export function defaultBreakingExpiresAt(
  hours = MANSET_BREAKING_DEFAULT_HOURS,
): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const CommentInputSchema = z
  .object({
    /** Boşsa sunucu "Okuyucu" yazar */
    name: z.string().max(80).optional().default(""),
    content: z.string().min(1).max(2000),
    articleId: z.string().min(1),
    /** Tek seviye yanıt — hızlı yorumda yok */
    parentId: z.string().min(1).optional().nullable(),
    /** Honeypot — doluysa bot */
    website: z.string().max(200).optional().default(""),
    /** Cloudflare Turnstile invisible token */
    captchaToken: z.string().max(2000).optional().nullable(),
    /** Hızlı yorum: max 280, triyaj uygula */
    isQuick: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const t = data.content.trim();
    if (data.isQuick) {
      if (t.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "En az 3 karakter",
          path: ["content"],
        });
      }
      if (t.length > 280) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hızlı yorum en fazla 280 karakter",
          path: ["content"],
        });
      }
    } else if (t.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "En az 3 karakter",
        path: ["content"],
      });
    }
  });
export type CommentInput = z.infer<typeof CommentInputSchema>;

export const CommentSelfEditSchema = z.object({
  content: z.string().min(3).max(2000),
  website: z.string().max(200).optional().default(""),
});
export type CommentSelfEditInput = z.infer<typeof CommentSelfEditSchema>;

/** Haber tepkileri — 5 seçenek (Kızdım dahil) */
export const ReactionTypeSchema = z.enum([
  "begendim",
  "destek",
  "sasirdim",
  "uzuldum",
  "kizdim",
]);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

export const ReactionPostSchema = z.object({
  type: ReactionTypeSchema,
});
export type ReactionPostInput = z.infer<typeof ReactionPostSchema>;

export const REACTION_LABELS: Record<ReactionType, string> = {
  begendim: "Beğendim",
  destek: "Destekliyorum",
  sasirdim: "Şaşırdım",
  uzuldum: "Üzüldüm",
  kizdim: "Kızdım",
};

export const REACTION_EMOJI: Record<ReactionType, string> = {
  begendim: "👍",
  destek: "✊",
  sasirdim: "😮",
  uzuldum: "😢",
  kizdim: "😡",
};

export const REACTION_ORDER: ReactionType[] = [
  "begendim",
  "destek",
  "sasirdim",
  "uzuldum",
  "kizdim",
];

/** Türkçe okuma hızı — kelime / dk */
export const READING_WPM = 190;

export type ReactionConfigItem = {
  id: ReactionType;
  label: string;
  emoji: string;
  enabled: boolean;
  order: number;
};

export type ReactionConfig = {
  minShow: number;
  items: ReactionConfigItem[];
};

export const DEFAULT_REACTION_CONFIG: ReactionConfig = {
  minShow: 10,
  items: REACTION_ORDER.map((id, order) => ({
    id,
    label: REACTION_LABELS[id],
    emoji: REACTION_EMOJI[id],
    enabled: true,
    order,
  })),
};

export function parseReactionConfig(raw: string | null | undefined): ReactionConfig {
  if (!raw?.trim()) return DEFAULT_REACTION_CONFIG;
  try {
    const parsed = JSON.parse(raw) as Partial<ReactionConfig>;
    const byId = new Map(
      (parsed.items ?? []).map((i) => [i.id, i] as const),
    );
    const items = REACTION_ORDER.map((id, order) => {
      const row = byId.get(id);
      return {
        id,
        label: row?.label?.trim() || REACTION_LABELS[id],
        emoji: row?.emoji?.trim() || REACTION_EMOJI[id],
        enabled: row?.enabled !== false,
        order: typeof row?.order === "number" ? row.order : order,
      };
    }).sort((a, b) => a.order - b.order);
    return {
      minShow: Math.max(0, Number(parsed.minShow ?? 10) || 10),
      items,
    };
  } catch {
    return DEFAULT_REACTION_CONFIG;
  }
}

export type GalleryImage = { url: string; alt?: string | null };

export function parseGalleryImages(raw: string | null | undefined): GalleryImage[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (typeof row === "string" && row.trim()) {
          return { url: row.trim(), alt: null };
        }
        if (row && typeof row === "object" && "url" in row) {
          const url = String((row as { url: unknown }).url ?? "").trim();
          if (!url) return null;
          const alt = (row as { alt?: unknown }).alt;
          return {
            url,
            alt: typeof alt === "string" ? alt : null,
          };
        }
        return null;
      })
      .filter((x): x is GalleryImage => Boolean(x));
  } catch {
    return [];
  }
}

export function serializeGalleryImages(items: GalleryImage[]): string {
  return JSON.stringify(
    items
      .filter((i) => i.url?.trim())
      .map((i) => ({ url: i.url.trim(), alt: i.alt?.trim() || null })),
  );
}

/** HTML/metinden okuma dakikası (Türkçe ~190 wpm) */
export function computeReadingMinutes(
  htmlOrText: string,
  wpm = READING_WPM,
): number {
  const text = htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / Math.max(60, wpm)));
}

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  status: ArticleStatusSchema.optional(),
  categorySlug: z.string().optional(),
  /** Virgülle ayrılmış çoklu kategori (üst menü alt öğeleri) */
  categorySlugs: z.string().optional(),
  authorSlug: z.string().optional(),
  contentType: ContentTypeSchema.optional(),
  videoOrientation: VideoOrientationSchema.optional(),
  videoLive: z
    .union([z.boolean(), z.enum(["1", "true", "0", "false"])])
    .optional()
    .transform((v) =>
      v === true || v === "1" || v === "true"
        ? true
        : v === false || v === "0" || v === "false"
          ? false
          : undefined,
    ),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Admin Haberler listesi filtresi — URL + API aynı şema.
 * durum: URL slug'ları (TR kısa form)
 */
export const HaberDurumFiltreSchema = z.enum([
  "hepsi",
  "taslak",
  "onayda",
  "zamanli",
  "yayinda",
  "arsiv",
]);
export type HaberDurumFiltre = z.infer<typeof HaberDurumFiltreSchema>;

export const HABER_DURUM_TO_STATUS: Record<
  Exclude<HaberDurumFiltre, "hepsi">,
  ArticleStatus
> = {
  taslak: "TASLAK",
  onayda: "ONAYDA",
  zamanli: "ZAMANLANMIS",
  yayinda: "YAYINDA",
  arsiv: "ARSIV",
};

export const STATUS_TO_HABER_DURUM: Record<ArticleStatus, HaberDurumFiltre> = {
  TASLAK: "taslak",
  ONAYDA: "onayda",
  ZAMANLANMIS: "zamanli",
  YAYINDA: "yayinda",
  ARSIV: "arsiv",
};

export const HaberFiltreSchema = z.object({
  durum: HaberDurumFiltreSchema.default("hepsi"),
  /** kategori id (cuid) */
  kategori: z.string().min(1).optional(),
  /** yazar id (cuid) */
  yazar: z.string().min(1).optional(),
  q: z.string().trim().max(80).optional(),
  /** keyset imleç — sonra; şimdilik page ile yedek */
  imlec: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(10).max(100).default(25),
  /** muhabir: yalnız kendi yazıları (varsayılan true sunucuda) */
  mine: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "boolean") return v;
      return v === "true" || v === "1";
    }),
});
export type HaberFiltre = z.infer<typeof HaberFiltreSchema>;

export type HaberStatusCounts = Record<HaberDurumFiltre, number>;

export type HaberListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  counts: HaberStatusCounts;
};

export const HaberBulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["onayla", "yayinla", "arsivle", "taslak"]),
    ids: z.array(z.string().min(1)).min(1).max(100),
  }),
  z.object({
    action: z.literal("kategori"),
    ids: z.array(z.string().min(1)).min(1).max(100),
    categoryId: z.string().min(1),
  }),
  z.object({
    action: z.literal("geri_al"),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          status: ArticleStatusSchema,
          categoryId: z.string().optional(),
          isFeatured: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(100),
  }),
]);
export type HaberBulkAction = z.infer<typeof HaberBulkActionSchema>;

/** Role göre varsayılan durum sekmesi */
export function defaultHaberDurumForRole(role: Role): HaberDurumFiltre {
  if (role === "EDITOR") return "onayda";
  if (role === "MUHABIR" || role === "YAZAR") return "taslak";
  return "hepsi";
}

/** Liste satır içi hızlı düzenleme — tam ArticleInput değil */
export const HaberInlineUpdateSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    categoryId: z.string().min(1).optional(),
    isFeatured: z.boolean().optional(),
    isSideManset: z.boolean().optional(),
    isSpotlight: z.boolean().optional(),
    isBreaking: z.boolean().optional(),
    publishedAt: z.string().datetime().optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.categoryId !== undefined ||
      v.isFeatured !== undefined ||
      v.isSideManset !== undefined ||
      v.isSpotlight !== undefined ||
      v.isBreaking !== undefined ||
      v.publishedAt !== undefined ||
      v.scheduledAt !== undefined,
    { message: "En az bir alan gerekli" },
  );
export type HaberInlineUpdate = z.infer<typeof HaberInlineUpdateSchema>;

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: UserStatus;
  twofaEnabled?: boolean;
  authorId?: string | null;
  requires2faSetup?: boolean;
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  description: string | null;
  descriptionWordCount?: number;
  parentId: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  children?: ApiCategory[];
  inMenu: boolean;
  menuOrder: number;
  onHome: boolean;
  homeOrder: number;
  commentsEnabled: boolean;
  /** = !commentsEnabled — eski istemciler */
  disableQuickComment?: boolean;
  defaultCover: string | null;
  status: "aktif" | "pasif";
  /** bolge | haber | parti | kurum */
  bucket?: "bolge" | "haber" | "parti" | "kurum";
  pageTemplate?: CategoryPageTemplate;
  color?: string | null;
  logoUrl?: string | null;
  articleCount?: number;
  childCount?: number;
};

export type ApiTag = {
  id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  lastUsedAt?: string | null;
  status?: "aktif" | "pasif";
  articleCount?: number;
  /** haber sayısı ≥ TAG_INDEX_MIN */
  indexable?: boolean;
  /** Benzer etiket (panel uyarı) */
  similarHint?: string | null;
};

export type ApiTagPair = {
  a: ApiTag;
  b: ApiTag;
  score: number;
};

export type ApiTagListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  counts: {
    all: number;
    featured: number;
    rare: number;
    similar: number;
  };
  rareHint: string;
};

export type ApiArticle = {
  id: string;
  title: string;
  /** Manşette gösterilecek kısa başlık */
  headlineTitle: string | null;
  slug: string;
  excerpt: string | null;
  content: string;
  contentType: ContentType;
  coverImage: string | null;
  coverAlt: string | null;
  coverCredit: string | null;
  coverImage169: string | null;
  coverImage43: string | null;
  coverImage11: string | null;
  status: ArticleStatus;
  isBreaking: boolean;
  breakingUntil: string | null;
  isFeatured: boolean;
  mansetOrder: number;
  isSideManset: boolean;
  sideOrder: number;
  /** Ana sayfa öne çıkan / seçki */
  isSpotlight: boolean;
  /** Sponsorlu içerik */
  isSponsored: boolean;
  sourceAgency: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  commentsClosed: boolean;
  pressAdNo: string | null;
  relatedArticleId: string | null;
  redirectUrl: string | null;
  updateNote: string | null;
  createdAt: string;
  updatedAt: string;
  lastAutosavedAt: string | null;
  lockedById: string | null;
  lockedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  videoProvider: VideoProvider | null;
  videoId: string | null;
  videoDuration: number | null;
  videoPoster: string | null;
  videoOrientation: VideoOrientation;
  videoTranscript: string | null;
  videoSource: string | null;
  videoIsLive: boolean;
  videoLiveEndsAt: string | null;
  /** Transkript yetersiz — panel uyarı */
  transcriptMissing?: boolean;
  category: ApiCategory;
  author: {
    id: string;
    name: string;
    email: string;
    slug: string | null;
    title: string | null;
    avatarUrl: string | null;
    isColumnist: boolean;
  };
  tags: ApiTag[];
  commentCount?: number;
  /** Toplanmış okunma (liste için canlı istek yok) */
  viewCount: number;
  /** Kayıtta hesaplanan okuma süresi (dk) */
  readingMinutes: number;
  /** Kapak altı galeri */
  galleryImages: GalleryImage[];
};

/** Yayıncı / köşe yazarı profili */
export type ApiAuthor = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  isColumnist: boolean;
  columnistOrder: number;
  articleCount?: number;
  latestArticle?: Pick<
    ApiArticle,
    | "id"
    | "title"
    | "slug"
    | "excerpt"
    | "publishedAt"
    | "coverImage"
    | "commentCount"
  > | null;
};

/** Piyasa satırı (döviz / altın / kripto) */
export type ApiMarketItem = {
  code: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
  buy?: string | null;
  sell?: string | null;
};

export type ApiMarkets = {
  fx: ApiMarketItem[];
  gold: ApiMarketItem[];
  crypto: ApiMarketItem[];
  source: string;
  updatedAt: string;
};

export type ApiPrayerCity = {
  slug: string;
  name: string;
};

export type ApiPrayer = {
  city: ApiPrayerCity;
  date: string;
  times: {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
  };
  next: {
    key: string;
    label: string;
    time: string;
  };
  source: string;
  updatedAt: string;
};

/** Canlı / biten / program maç satırı */
export type ApiSportMatch = {
  id: string;
  league: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  /** "67'" | "HT" | "MS" | "19:00" */
  minute: string;
  status: "live" | "finished" | "scheduled";
  kickoff: string | null;
};

export type ApiSportStanding = {
  pos: number;
  team: string;
  played: number;
  pts: number;
};

export type ApiSportFixture = {
  id: string;
  time: string;
  home: string;
  away: string;
  league: string;
  kickoff: string | null;
};

/** Spor paneli snapshot — ESPN Süper Lig + destek ligler */
export type ApiSports = {
  live: ApiSportMatch[];
  /** Canlı yoksa panoda gösterilecek son skorlar */
  recent: ApiSportMatch[];
  fixtures: ApiSportFixture[];
  standings: ApiSportStanding[];
  leagueName: string;
  source: string;
  updatedAt: string;
};

/** Vizyondaki film (Beyazperde) */
export type ApiCinemaFilm = {
  id: string;
  title: string;
  poster: string | null;
  url: string;
  date: string | null;
  duration: string | null;
  originalName: string | null;
  description: string | null;
};

/** Vizyon listesi snapshot */
export type ApiCinema = {
  films: ApiCinemaFilm[];
  source: string;
  listUrl: string;
  updatedAt: string;
  error?: string;
};

export type MansetCardView = {
  article: ApiArticle;
  slot: number;
  headlineTitle: string;
  kicker: string;
  spot: string | null;
  badge: {
    text: string;
    color: string;
    expiresAt: string | null;
  } | null;
  showSpot: boolean;
};

export type MansetResponse = {
  main: ApiArticle[];
  side: ApiArticle[];
  /** Sıralı slot kartları (override’lı) */
  items: MansetCardView[];
  featured: ApiArticle[];
  settings: MansetSettings;
  layout: MansetLayoutId;
  /** Canlı son dakika bandı (süresi dolmuşsa null) */
  breaking?: {
    text: string;
    url: string | null;
    expiresAt: string;
  } | null;
};

export type MansetPanelSlotView = {
  slot: number;
  label: string;
  article: ApiArticle | null;
  empty: boolean;
  /** Arşiv/silinme sonrası boşaltıldı */
  autoCleared?: boolean;
  warning?: string | null;
  headlineTitle?: string | null;
  kicker?: string | null;
  spot?: string | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  badgeExpiresAt?: string | null;
};

export type MansetLockState = {
  held: boolean;
  byMe: boolean;
  lockedBy: { id: string; name: string } | null;
  expiresAt: string | null;
  ttlMs: number;
};

export type MansetPanelResponse = {
  kind: string;
  slotCount: number;
  slots: MansetPanelSlotView[];
  breaking: MansetBreaking | null;
  settings: MansetSettings;
  dirtyCount: number;
  lastChange: {
    at: string;
    by: { id: string; name: string } | null;
  } | null;
  lock: MansetLockState;
  warnings: string[];
  unpublished: boolean;
};

export type MansetLogEntry = {
  id: string;
  kind: string;
  action: string;
  summary: string;
  createdAt: string;
  actor: { id: string; name: string } | null;
};

export type MansetCandidate = ApiArticle & {
  hasMansetCover: boolean;
};

export type ApiComment = {
  id: string;
  name: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
  moderatedAt?: string | null;
  moderatedById?: string | null;
  articleId: string;
  parentId?: string | null;
  isQuick?: boolean;
  /** Yazar kendi yorumunu 2 dk düzenleyebilir (istemci) */
  editableUntil?: string | null;
  replies?: ApiComment[];
  article?: Pick<ApiArticle, "id" | "title" | "slug">;
};

/** Admin: sekme rozetleri */
export type ApiCommentListMeta = {
  counts: {
    BEKLEMEDE: number;
    ONAYLI: number;
    ARSIV: number;
    COP: number;
  };
  total: number;
};

/** Admin: hızlı yorum çöp oranı takibi */
export type ApiCommentStats = {
  windowDays: number;
  quickTotal: number;
  quickYayin: number;
  quickKuyruk: number;
  quickRed: number;
  /** çöpe giden / (yayın+kuyruk+çöp) — %20 üstü alarm */
  rejectRate: number;
  rejectRateAlert: boolean;
};

export type ApiReactionSummary = {
  articleId: string;
  counts: Partial<Record<ReactionType, number>>;
  total: number;
  minShow?: number;
  mine?: ReactionType | null;
  action?: "add" | "remove" | "switch";
  items?: Array<{
    id: ReactionType;
    label: string;
    emoji: string;
    enabled: boolean;
    order: number;
  }>;
};

export type ApiArticleNeighbor = {
  slug: string;
  title: string;
  coverImage: string | null;
  publishedAt: string | null;
  categoryName: string;
};

export type ApiArticleNeighbors = {
  next: ApiArticleNeighbor | null;
  prev: ApiArticleNeighbor | null;
};


export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
  sessionId?: string;
};

export type DashboardStats = {
  articlesTotal: number;
  articlesPublished: number;
  /** Bugün yayınlanan (YAYINDA + publishedAt bugün) */
  articlesPublishedToday: number;
  /** Bugün oluşturulan / yayın sayısı delta */
  articlesTodayDelta: number;
  articlesDraft: number;
  articlesPending: number;
  articlesScheduled: number;
  articlesBreaking: number;
  articlesFeatured: number;
  categoriesTotal: number;
  commentsPending: number;
  commentsTotal: number;
  /** Yeni iletişim mesajları */
  messagesNew: number;
  usersTotal: number;
  /** Üye (UYE rolü) sayısı */
  membersTotal: number;
  membersTodayDelta: number;
  columnistsTotal: number;
  columnistsActive: number;
  /** Toplam görüntülenme */
  viewsTotal: number;
  viewsWeekChangePct: number;
  /** Anlık tahmini (canlı analytics yoksa 0) */
  liveReaders: number;
  /** Eksik/kırık kapak (yayında + coversız) */
  missingCoverCount: number;
  recentArticles: Array<{
    id: string;
    title: string;
    slug: string;
    status: ArticleStatus;
    publishedAt: string | null;
    updatedAt: string;
    categoryName: string;
    authorName: string;
    viewCount: number;
  }>;
  todayArticles: Array<{
    id: string;
    title: string;
    slug: string;
    status: ArticleStatus;
    publishedAt: string | null;
    updatedAt: string;
    categoryName: string;
    authorName: string;
    viewCount: number;
  }>;
  pendingComments: Array<{
    id: string;
    content: string;
    authorName: string | null;
    isQuick: boolean;
    createdAt: string;
    articleTitle: string;
    articleId: string;
  }>;
  /** Son 7 gün ziyaretçi (tahmini veya gerçek) */
  trafficWeek: Array<{
    date: string;
    label: string;
    visitors: number;
    pageviews: number;
    sessions: number;
    avgSessionSec: number;
  }>;
  topAuthors: Array<{
    id: string;
    name: string;
    articleCount: number;
    viewsTotal: number;
    viewsAvg: number;
  }>;
  categoryPerformance: Array<{
    name: string;
    slug: string;
    articleCount: number;
    viewsTotal: number;
    sharePct: number;
  }>;
  queue: {
    drafts: number;
    scheduled: number;
    pendingComments: number;
    pendingMessages: number;
    pendingAuthors: number;
    missingCovers: number;
  };
};

/** Panel üst menü bildirim özeti */
export type DashboardNotifications = {
  commentsPending: number;
  messagesNew: number;
  total: number;
  comments: Array<{
    id: string;
    type: "comment";
    title: string;
    preview: string;
    meta: string;
    href: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    type: "message";
    title: string;
    preview: string;
    meta: string;
    href: string;
    createdAt: string;
  }>;
};

/** Site iletişim formu mesajı */
export type ApiContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string;
  body: string;
  status: "new" | "read" | "archived";
  createdAt: string;
  readAt: string | null;
};

/** Admin kullanıcı satırı (panel hesabı) */
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  twofaEnabled: boolean;
  lastLoginAt: string | null;
  /** 90 gündür giriş yok */
  staleLogin: boolean;
  avatarUrl: string | null;
  articleCount: number;
  authorId: string | null;
  authorSlug: string | null;
  authorPhotoUrl: string | null;
  createdAt: string;
};

export const AdminUserUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(["ADMIN", "EDITOR", "MUHABIR", "MODERATOR"]).optional(),
  status: UserStatusSchema.optional(),
});
export type AdminUserUpdateInput = z.infer<typeof AdminUserUpdateSchema>;

/** Kalıcı silme — haberler başka yazara devredilmeli (yazar profilinde haber varsa) */
export const AdminUserDeleteSchema = z.object({
  transferAuthorId: z.string().min(1).optional(),
});
export type AdminUserDeleteInput = z.infer<typeof AdminUserDeleteSchema>;

export const UserInviteCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "MUHABIR", "MODERATOR"]),
});
export type UserInviteCreateInput = z.infer<typeof UserInviteCreateSchema>;

export const UserInviteAcceptSchema = z
  .object({
    token: z.string().min(20),
    name: z.string().min(2).max(80),
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Şifreler eşleşmiyor",
    path: ["passwordConfirm"],
  });
export type UserInviteAcceptInput = z.infer<typeof UserInviteAcceptSchema>;

/** bekliyor | kabul | suresi_doldu */
export type InviteStatus = "bekliyor" | "kabul" | "suresi_doldu";

export type AdminInviteRow = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy: { id: string; name: string } | null;
  expired: boolean;
  status: InviteStatus;
};

export const AuthorAdminUpdateSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  title: z.string().max(160).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional().or(z.literal("")),
  twitterUrl: z.string().url().nullable().optional().or(z.literal("")),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal("")),
  status: AuthorProfileStatusSchema.optional(),
  isColumnist: z.boolean().optional(),
  columnistOrder: z.number().int().min(0).max(999).optional(),
  userId: z.string().min(1).nullable().optional(),
});
export type AuthorAdminUpdateInput = z.infer<typeof AuthorAdminUpdateSchema>;

export const AuthorAdminCreateSchema = z.object({
  displayName: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  title: z.string().max(160).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  userId: z.string().min(1).optional().nullable(),
  isColumnist: z.boolean().optional(),
});
export type AuthorAdminCreateInput = z.infer<typeof AuthorAdminCreateSchema>;

export type AdminAuthorRow = {
  id: string;
  displayName: string;
  slug: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  status: AuthorProfileStatus;
  isColumnist: boolean;
  columnistOrder: number;
  articleCount: number;
  user: { id: string; name: string; email: string } | null;
  createdAt: string;
};

export type AdminSessionRow = {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

/** Üst menü tek satır / alt menü öğesi */
export const MainNavLinkSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
});
export type MainNavLink = z.infer<typeof MainNavLinkSchema>;

export const MainNavItemSchema = MainNavLinkSchema.extend({
  /** Son dakika kırmızısı */
  accent: z.boolean().optional().default(false),
  children: z.array(MainNavLinkSchema).max(40).optional().default([]),
});
export type MainNavItem = z.infer<typeof MainNavItemSchema>;

export const MainNavSchema = z.array(MainNavItemSchema).max(40);
export type MainNav = z.infer<typeof MainNavSchema>;

/** Settings key */
export const MAIN_NAV_SETTING_KEY = "mainNav";

/** Sade varsayılan üst menü — ilçe spamı yok */
export const DEFAULT_MAIN_NAV: MainNav = [
  {
    id: "son-dakika",
    label: "Son Dakika",
    href: "/son-dakika",
    accent: true,
    children: [],
  },
  {
    id: "yazarlar",
    label: "Yazarlar",
    href: "/yazarlar",
    accent: false,
    children: [],
  },
  {
    id: "gundem",
    label: "Gündem",
    href: "/kategori/gundem",
    accent: false,
    children: [],
  },
  {
    id: "duzce",
    label: "Düzce",
    href: "/kategori/duzce",
    accent: false,
    children: [],
  },
  {
    id: "ekonomi",
    label: "Ekonomi",
    href: "/kategori/ekonomi",
    accent: false,
    children: [],
  },
  {
    id: "spor",
    label: "Spor",
    href: "/kategori/spor",
    accent: false,
    children: [],
  },
  {
    id: "dunya",
    label: "Dünya",
    href: "/kategori/dunya",
    accent: false,
    children: [],
  },
  {
    id: "saglik",
    label: "Sağlık",
    href: "/kategori/saglik",
    accent: false,
    children: [],
  },
  {
    id: "teknoloji",
    label: "Teknoloji",
    href: "/kategori/teknoloji",
    accent: false,
    children: [],
  },
  {
    id: "turkiye",
    label: "Türkiye",
    href: "/kategori/turkiye",
    accent: false,
    children: [],
  },
  {
    id: "siyaset",
    label: "Siyaset",
    href: "/kategori/siyaset",
    accent: false,
    children: [],
  },
  {
    id: "siyasi-partiler",
    label: "Siyasi Partiler",
    href: "/kategori/siyasi-partiler",
    accent: false,
    children: [
      {
        id: "akp",
        label: "AK Parti",
        href: "/kategori/adalet-ve-kalkinma-partisi",
      },
      {
        id: "chp",
        label: "CHP",
        href: "/kategori/cumhuriyet-halk-partisi",
      },
      {
        id: "mhp",
        label: "MHP",
        href: "/kategori/milliyetci-hareket-partisi",
      },
      {
        id: "iyi",
        label: "İYİ Parti",
        href: "/kategori/iyi-parti",
      },
      {
        id: "zafer",
        label: "Zafer Partisi",
        href: "/kategori/zafer-partisi",
      },
      {
        id: "anahtar",
        label: "Anahtar Parti",
        href: "/kategori/anahtar-parti",
      },
      {
        id: "dem",
        label: "DEM Parti",
        href: "/kategori/dem-parti",
      },
      {
        id: "saadet",
        label: "Saadet Partisi",
        href: "/kategori/saadet-partisi",
      },
    ],
  },
  {
    id: "magazin",
    label: "Magazin",
    href: "/kategori/magazin",
    accent: false,
    children: [],
  },
];

/**
 * Siyasi Partiler alt menüsü — varsayılan parti linkleri.
 */
export const DEFAULT_PARTY_SUBMENU = [
  {
    id: "akp",
    label: "AK Parti",
    href: "/kategori/adalet-ve-kalkinma-partisi",
  },
  {
    id: "chp",
    label: "CHP",
    href: "/kategori/cumhuriyet-halk-partisi",
  },
  {
    id: "mhp",
    label: "MHP",
    href: "/kategori/milliyetci-hareket-partisi",
  },
  {
    id: "iyi",
    label: "İYİ Parti",
    href: "/kategori/iyi-parti",
  },
  {
    id: "zafer",
    label: "Zafer Partisi",
    href: "/kategori/zafer-partisi",
  },
  {
    id: "anahtar",
    label: "Anahtar Parti",
    href: "/kategori/anahtar-parti",
  },
  {
    id: "dem",
    label: "DEM Parti",
    href: "/kategori/dem-parti",
  },
  {
    id: "saadet",
    label: "Saadet Partisi",
    href: "/kategori/saadet-partisi",
  },
] as const;

/** Setting JSON → menü; boş alt menülü siyasi-partiler doldurulur */
export function parseMainNav(raw: string | null | undefined): MainNav {
  let nav: MainNav = DEFAULT_MAIN_NAV;
  if (raw?.trim()) {
    try {
      const data = JSON.parse(raw) as unknown;
      const parsed = MainNavSchema.safeParse(data);
      if (parsed.success && parsed.data.length > 0) nav = parsed.data;
    } catch {
      // keep default
    }
  }
  return ensurePartySubmenu(nav);
}

/** Siyasi partiler satırında alt menü yoksa varsayılan partileri ekle */
export function ensurePartySubmenu(nav: MainNav): MainNav {
  return nav.map((item) => {
    const isParties =
      item.id === "siyasi-partiler" ||
      item.href.includes("siyasi-partiler") ||
      item.label.toLocaleLowerCase("tr-TR").includes("siyasi parti");
    if (!isParties) return item;
    if ((item.children?.length ?? 0) > 0) return item;
    return {
      ...item,
      children: DEFAULT_PARTY_SUBMENU.map((c) => ({ ...c })),
    };
  });
}

export function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

export {
  AD_SLOTS,
  PAGE_LABELS,
  slotsByPage,
  isValidSlot,
  getSlot,
  type AdDevice,
  type AdPage,
  type AdSlotDef,
  type AdSlotCode,
} from "./ad-slots";

export type AdCreativeType = "image" | "html" | "adsense" | "video";
export type AdStatus = "active" | "paused" | "archived";

export type AdPublic = {
  id: string;
  type: AdCreativeType;
  imageUrl: string | null;
  imageUrlMobile: string | null;
  targetUrl: string | null;
  htmlCode: string | null;
  adsenseSlotId: string | null;
  device: AdDevice;
};

export type AdAdminRow = AdPublic & {
  slotCode: string;
  name: string;
  advertiser: string | null;
  weight: number;
  status: AdStatus;
  startAt: string | null;
  endAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
};

export const AdCreateSchema = z.object({
  slotCode: z.string().min(1),
  name: z.string().min(2).max(160),
  advertiser: z.string().max(160).optional().nullable(),
  type: z.enum(["image", "html", "adsense", "video"]).default("image"),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  imageUrlMobile: z.string().url().optional().nullable().or(z.literal("")),
  targetUrl: z.string().url().optional().nullable().or(z.literal("")),
  htmlCode: z.string().max(50_000).optional().nullable(),
  adsenseSlotId: z.string().max(80).optional().nullable(),
  device: z.enum(["all", "desktop", "mobile"]).default("all"),
  startAt: z.string().optional().nullable().or(z.literal("")),
  endAt: z.string().optional().nullable().or(z.literal("")),
  weight: z.number().int().min(1).max(20).default(1),
  status: z.enum(["active", "paused", "archived"]).default("active"),
});
export type AdCreateInput = z.infer<typeof AdCreateSchema>;

export const AdUpdateSchema = AdCreateSchema.partial();
export type AdUpdateInput = z.infer<typeof AdUpdateSchema>;

/* ──────────────── Anket sistemi ──────────────── */

export const PollStatusSchema = z.enum(["draft", "active", "closed"]);
export type PollStatus = z.infer<typeof PollStatusSchema>;

export const PollTypeSchema = z.enum(["single", "multi"]);
export type PollType = z.infer<typeof PollTypeSchema>;

export type ApiPollOption = {
  id: string;
  label: string;
  sortOrder: number;
  voteCount: number;
  percent: number;
};

export type ApiPoll = {
  id: string;
  question: string;
  articleId: string | null;
  articleTitle?: string | null;
  articleSlug?: string | null;
  type: PollType;
  status: PollStatus;
  startAt: string | null;
  endAt: string | null;
  totalVotes: number;
  options: ApiPollOption[];
  /** Kalan gün (endAt varsa); aksi null */
  daysLeft: number | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt?: string;
};

export const PollCreateSchema = z.object({
  question: z.string().min(5).max(400),
  articleId: z.string().cuid().optional().nullable().or(z.literal("")),
  type: PollTypeSchema.default("single"),
  status: PollStatusSchema.default("draft"),
  startAt: z.string().optional().nullable().or(z.literal("")),
  endAt: z.string().optional().nullable().or(z.literal("")),
  options: z
    .array(z.object({ label: z.string().min(1).max(160) }))
    .min(2)
    .max(12),
  /** true ise var olan genel aktif kapanır, bu yayına alınır */
  forceActive: z.boolean().optional().default(false),
});
export type PollCreateInput = z.infer<typeof PollCreateSchema>;

export const PollUpdateSchema = z.object({
  question: z.string().min(5).max(400).optional(),
  articleId: z.string().cuid().optional().nullable().or(z.literal("")),
  type: PollTypeSchema.optional(),
  status: PollStatusSchema.optional(),
  startAt: z.string().optional().nullable().or(z.literal("")),
  endAt: z.string().optional().nullable().or(z.literal("")),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1).max(160),
      }),
    )
    .min(2)
    .max(12)
    .optional(),
  forceActive: z.boolean().optional().default(false),
});
export type PollUpdateInput = z.infer<typeof PollUpdateSchema>;

export const PollVoteSchema = z.object({
  optionIds: z.array(z.string().min(1)).min(1).max(12),
});
export type PollVoteInput = z.infer<typeof PollVoteSchema>;

export const StoryKindSchema = z.enum(["durum", "short"]);
export type StoryKind = z.infer<typeof StoryKindSchema>;

export const StoryStatusSchema = z.enum(["draft", "active", "archived"]);
export type StoryStatus = z.infer<typeof StoryStatusSchema>;

export type ApiStory = {
  id: string;
  title: string;
  kind: StoryKind;
  mediaUrl: string;
  posterUrl: string | null;
  linkUrl: string | null;
  videoProvider: string | null;
  videoId: string | null;
  status: StoryStatus;
  sortOrder: number;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const hexOrUrl = z.string().min(1).max(2000);

export const StoryCreateSchema = z.object({
  title: z.string().min(1).max(80),
  kind: StoryKindSchema.default("durum"),
  mediaUrl: hexOrUrl,
  posterUrl: z.string().max(2000).optional().nullable().or(z.literal("")),
  linkUrl: z.string().max(2000).optional().nullable().or(z.literal("")),
  videoProvider: z.string().max(40).optional().nullable().or(z.literal("")),
  videoId: z.string().max(80).optional().nullable().or(z.literal("")),
  status: StoryStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).optional(),
  /** ISO; boş = yayınlanınca +24s */
  expiresAt: z.string().optional().nullable().or(z.literal("")),
});
export type StoryCreateInput = z.infer<typeof StoryCreateSchema>;

export const StoryUpdateSchema = StoryCreateSchema.partial();
export type StoryUpdateInput = z.infer<typeof StoryUpdateSchema>;

export const StoryReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(60),
});
export type StoryReorderInput = z.infer<typeof StoryReorderSchema>;

/* ──────────────── Ücretli ilan ──────────────── */

export const PaidListingKindSchema = z.enum([
  "vefat",
  "taziye",
  "tesekkur",
  "tebrik",
  "anma",
  "duyuru",
  "is",
  "emlak",
  "diger",
]);
export type PaidListingKind = z.infer<typeof PaidListingKindSchema>;

export const PAID_LISTING_KIND_LABELS: Record<PaidListingKind, string> = {
  vefat: "Vefat",
  taziye: "Taziye",
  tesekkur: "Teşekkür",
  tebrik: "Tebrik",
  anma: "Anma",
  duyuru: "Duyuru",
  is: "İş ilanı",
  emlak: "Emlak",
  diger: "Diğer",
};

export const PaidListingStatusSchema = z.enum([
  "draft",
  "active",
  "expired",
  "archived",
]);
export type PaidListingStatus = z.infer<typeof PaidListingStatusSchema>;

export const PAID_LISTING_STATUS_LABELS: Record<PaidListingStatus, string> = {
  draft: "Taslak",
  active: "Yayında",
  expired: "Süresi doldu",
  archived: "Arşiv",
};

export type ApiPaidListing = {
  id: string;
  slug: string;
  kind: PaidListingKind;
  title: string;
  body: string;
  personName: string | null;
  imageUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  customerNote: string | null;
  priceTry: number;
  durationDays: number;
  status: PaidListingStatus;
  featured: boolean;
  startAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const PaidListingCreateSchema = z.object({
  kind: PaidListingKindSchema.default("duyuru"),
  title: z.string().min(2).max(200),
  body: z.string().max(20_000).default(""),
  personName: z.string().max(160).optional().nullable().or(z.literal("")),
  imageUrl: z.string().max(2000).optional().nullable().or(z.literal("")),
  contactName: z.string().max(120).optional().nullable().or(z.literal("")),
  contactPhone: z.string().max(40).optional().nullable().or(z.literal("")),
  customerNote: z.string().max(2000).optional().nullable().or(z.literal("")),
  priceTry: z.number().int().min(0).max(1_000_000).default(0),
  durationDays: z.number().int().min(1).max(365).default(7),
  status: PaidListingStatusSchema.default("draft"),
  featured: z.boolean().default(false),
  startAt: z.string().optional().nullable().or(z.literal("")),
  endAt: z.string().optional().nullable().or(z.literal("")),
  slug: z.string().max(220).optional().nullable().or(z.literal("")),
});
export type PaidListingCreateInput = z.infer<typeof PaidListingCreateSchema>;

export const PaidListingUpdateSchema = PaidListingCreateSchema.partial();
export type PaidListingUpdateInput = z.infer<typeof PaidListingUpdateSchema>;

export * from "./settings";
export * from "./elections";
export * from "./dhondt";
export * from "./menus";
export * from "./manset-layouts";
export * from "./cache-tags";
export {
  getMarketsSnapshot,
  type MarketItem as LiveMarketItem,
  type MarketsSnapshot,
} from "./live-markets";

