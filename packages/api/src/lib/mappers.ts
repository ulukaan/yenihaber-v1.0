import type { Article, Author, Category, Tag } from "@yenihaber/database";
import {
  countWords,
  VIDEO_TRANSCRIPT_MIN_CHARS,
  computeReadingMinutes,
  parseGalleryImages,
  isUsableArticleCover,
  type ApiArticle,
  type ApiAuthor,
  type ApiCategory,
  type ContentType,
  type VideoOrientation,
  type VideoProvider,
} from "@yenihaber/shared";
import { peekDefaultCoverUrl } from "./settings";

const SITE_DEFAULT_COVER = "/brand/default-cover.svg";

/** Kapak seç — marka logosu / boş adayları atla */
function resolveArticleCover(
  ...candidates: Array<string | null | undefined>
): string {
  for (const c of candidates) {
    const t = (c ?? "").trim();
    if (isUsableArticleCover(t)) return t;
  }
  return SITE_DEFAULT_COVER;
}

type AuthorSelect = Pick<
  Author,
  | "id"
  | "displayName"
  | "slug"
  | "title"
  | "bio"
  | "photoUrl"
  | "twitterUrl"
  | "linkedinUrl"
  | "isColumnist"
  | "columnistOrder"
>;

type CategoryMapped = Category & {
  _count?: { articles: number; children?: number };
  parent?: Pick<Category, "id" | "name" | "slug"> | null;
  children?: Array<
    Category & { _count?: { articles: number; children?: number } }
  >;
};

type ArticleWithRels = Article & {
  category: Category;
  author: AuthorSelect;
  tags: { tag: Tag }[];
  _count?: { comments: number };
};

export function mapCategory(category: CategoryMapped): ApiCategory {
  const c = category as CategoryMapped & {
    commentsEnabled?: boolean;
    disableQuickComment?: boolean;
    parentId?: string | null;
    inMenu?: boolean;
    menuOrder?: number;
    onHome?: boolean;
    homeOrder?: number;
    defaultCover?: string | null;
    status?: string;
  };
  const commentsEnabled =
    c.commentsEnabled !== undefined
      ? Boolean(c.commentsEnabled)
      : !Boolean(c.disableQuickComment);

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
    description: c.description,
    descriptionWordCount: c.description ? countWords(c.description) : 0,
    parentId: c.parentId ?? null,
    parent: c.parent
      ? { id: c.parent.id, name: c.parent.name, slug: c.parent.slug }
      : null,
    children: c.children?.map((ch) => mapCategory(ch)),
    inMenu: c.inMenu ?? true,
    menuOrder: c.menuOrder ?? c.sortOrder ?? 0,
    onHome: c.onHome ?? false,
    homeOrder: c.homeOrder ?? 0,
    commentsEnabled,
    disableQuickComment: !commentsEnabled,
    defaultCover: c.defaultCover ?? null,
    status: (c.status as "aktif" | "pasif") ?? "aktif",
    bucket: (c.bucket as ApiCategory["bucket"]) ?? "haber",
    pageTemplate:
      ((c as { pageTemplate?: string }).pageTemplate as ApiCategory["pageTemplate"]) ??
      "magazine",
    color: (c as { color?: string | null }).color ?? null,
    logoUrl: (c as { logoUrl?: string | null }).logoUrl ?? null,
    articleCount: c._count?.articles,
    childCount: c._count?.children ?? c.children?.length,
  };
}

export function mapAuthor(
  author: AuthorSelect & {
    _count?: { articles: number };
    articles?: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      publishedAt: Date | null;
      coverImage: string | null;
      _count?: { comments: number };
    }>;
  },
): ApiAuthor {
  const latest = author.articles?.[0];
  return {
    id: author.id,
    name: author.displayName,
    slug: author.slug,
    title: author.title,
    bio: author.bio,
    avatarUrl: author.photoUrl,
    twitterUrl: author.twitterUrl,
    linkedinUrl: author.linkedinUrl,
    isColumnist: author.isColumnist,
    columnistOrder: author.columnistOrder,
    articleCount: author._count?.articles,
    latestArticle: latest
      ? {
          id: latest.id,
          title: latest.title,
          slug: latest.slug,
          excerpt: latest.excerpt,
          publishedAt: latest.publishedAt?.toISOString() ?? null,
          coverImage: latest.coverImage,
          commentCount: latest._count?.comments ?? 0,
        }
      : null,
  };
}

export function mapArticle(article: ArticleWithRels): ApiArticle {
  const a = article as ArticleWithRels & {
    coverAlt?: string | null;
    coverCredit?: string | null;
    coverImage169?: string | null;
    coverImage43?: string | null;
    coverImage11?: string | null;
    breakingUntil?: Date | null;
    scheduledAt?: Date | null;
    updateNote?: string | null;
    lastAutosavedAt?: Date | null;
    lockedById?: string | null;
    lockedAt?: Date | null;
    viewCount?: number;
    readingMinutes?: number;
    galleryImages?: string | null;
    contentType?: string;
    videoProvider?: string | null;
    videoId?: string | null;
    videoDuration?: number | null;
    videoPoster?: string | null;
    videoOrientation?: string;
    videoTranscript?: string | null;
    videoSource?: string | null;
    videoIsLive?: boolean;
    videoLiveEndsAt?: Date | null;
  };
  const cat = a.category as Category & { defaultCover?: string | null };
  const contentType = (a.contentType ?? "haber") as ContentType;
  /** haber → video poster → 16:9 → kategori → site ayarı (logo kapak sayılmaz) */
  const cover = resolveArticleCover(
    a.coverImage,
    a.videoPoster,
    a.coverImage169,
    cat.defaultCover,
    peekDefaultCoverUrl(),
  );
  const transcript = a.videoTranscript ?? null;

  return {
    id: a.id,
    title: a.title,
    headlineTitle:
      (a as { headlineTitle?: string | null }).headlineTitle ?? null,
    slug: a.slug,
    excerpt: a.excerpt,
    content: a.content,
    contentType,
    coverImage: cover,
    coverAlt: a.coverAlt ?? null,
    coverCredit: a.coverCredit ?? null,
    coverImage169: a.coverImage169 || cover,
    coverImage43: a.coverImage43 ?? null,
    coverImage11: a.coverImage11 || cover,
    status: a.status as ApiArticle["status"],
    isBreaking: a.isBreaking,
    breakingUntil: a.breakingUntil?.toISOString() ?? null,
    isFeatured: a.isFeatured,
    mansetOrder: a.mansetOrder ?? 0,
    isSideManset: a.isSideManset ?? false,
    sideOrder: a.sideOrder ?? 0,
    isSpotlight: Boolean(
      (a as { isSpotlight?: boolean }).isSpotlight,
    ),
    isSponsored: Boolean(
      (a as { isSponsored?: boolean }).isSponsored,
    ),
    sourceAgency: a.sourceAgency ?? null,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    scheduledAt: a.scheduledAt?.toISOString() ?? null,
    commentsClosed: Boolean(
      (a as { commentsClosed?: boolean }).commentsClosed,
    ),
    pressAdNo: (a as { pressAdNo?: string | null }).pressAdNo ?? null,
    relatedArticleId:
      (a as { relatedArticleId?: string | null }).relatedArticleId ?? null,
    redirectUrl: (a as { redirectUrl?: string | null }).redirectUrl ?? null,
    updateNote: a.updateNote ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    lastAutosavedAt: a.lastAutosavedAt?.toISOString() ?? null,
    lockedById: a.lockedById ?? null,
    lockedAt: a.lockedAt?.toISOString() ?? null,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    videoProvider: (a.videoProvider as VideoProvider) ?? null,
    videoId: a.videoId ?? null,
    videoDuration: a.videoDuration ?? null,
    videoPoster: a.videoPoster ?? null,
    videoOrientation: (a.videoOrientation as VideoOrientation) || "yatay",
    videoTranscript: transcript,
    videoSource: a.videoSource ?? null,
    videoIsLive: Boolean(a.videoIsLive),
    videoLiveEndsAt: a.videoLiveEndsAt?.toISOString() ?? null,
    transcriptMissing:
      contentType === "video" &&
      (transcript ?? "").trim().length < VIDEO_TRANSCRIPT_MIN_CHARS,
    category: mapCategory(a.category),
    author: {
      id: a.author.id,
      name: a.author.displayName,
      email: "",
      slug: a.author.slug,
      title: a.author.title,
      avatarUrl: a.author.photoUrl,
      isColumnist: a.author.isColumnist,
    },
    tags: a.tags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
      slug: t.tag.slug,
      isFeatured: Boolean(
        (t.tag as { isFeatured?: boolean }).isFeatured ?? false,
      ),
    })),
    commentCount: a._count?.comments,
    viewCount: a.viewCount ?? 0,
    readingMinutes:
      a.readingMinutes ??
      computeReadingMinutes(a.content || a.excerpt || ""),
    galleryImages: parseGalleryImages(a.galleryImages),
  };
}

export const articleInclude = {
  category: true,
  author: {
    select: {
      id: true,
      displayName: true,
      slug: true,
      title: true,
      bio: true,
      photoUrl: true,
      twitterUrl: true,
      linkedinUrl: true,
      isColumnist: true,
      columnistOrder: true,
    },
  },
  tags: { include: { tag: true } },
  _count: {
    select: {
      comments: { where: { status: "ONAYLI" } },
    },
  },
} as const;
