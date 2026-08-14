import type {
  ApiArticle,
  ApiCategory,
  ApiComment,
  ApiUser,
  ArticleInput,
  ArticleStatus,
  AuthResponse,
  CategoryInput,
  CommentInput,
  DashboardStats,
  DashboardNotifications,
  ApiContactMessage,
  ForgotPasswordInput,
  ResetPasswordInput,
  AdminUserDeleteInput,
  HaberBulkAction,
  HaberInlineUpdate,
  HaberListMeta,
  HaberStatusCounts,
  MemberArticleSubmit,
  MansetResponse,
  MansetDraftUpdateInput,
  MansetPanelResponse,
  MansetLogEntry,
  MansetCandidate,
  MansetUpdateInput,
  ApiMenu,
  ApiMenuItem,
  MenuLocation,
  MenuItemInput,
  MenuItemPatch,
  MenuReorderInput,
  Paginated,
  RegisterInput,
  ApiAuthor,
  ApiMarkets,
  ApiPrayer,
  ApiPrayerCity,
  ApiSports,
  ApiCinema,
  ApiReactionSummary,
  ApiArticleNeighbors,
  ReactionType,
  AdminUserRow,
  AdminUserUpdateInput,
  AdminAuthorRow,
  AdminInviteRow,
  AuthorAdminCreateInput,
  AuthorAdminUpdateInput,
  UserInviteCreateInput,
  UserInviteAcceptInput,
  AdAdminRow,
  AdCreateInput,
  AdUpdateInput,
  AdPublic,
  AdSlotCode,
  AdminSessionRow,
  ApiTag,
  ApiTagListMeta,
  ApiTagPair,
  TagInput,
  TagPatch,
  TagMergeInput,
  TagBulkInput,
  ApiPoll,
  PollCreateInput,
  PollUpdateInput,
  PollVoteInput,
  ApiStory,
  StoryCreateInput,
  StoryUpdateInput,
  StoryReorderInput,
  ApiPaidListing,
  PaidListingCreateInput,
  PaidListingUpdateInput,
  SettingsGroup,
  SettingsMap,
  SettingsBundle,
  ThemePaletteId,
  ApiElectionStrip,
  ApiElectionBundle,
  ApiElectionRace,
  VideoOembedResult,
} from "@yenihaber/shared";

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null | undefined;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Ortak HTTP istemcisi — web ve admin aynı servis katmanını kullanır */
export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    const token = options.getToken?.();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);
        throw new ApiError(
          res.ok
            ? `Geçersiz API yanıtı: ${snippet || "(boş)"}`
            : `İstek başarısız (${res.status}): ${snippet || res.statusText}`,
          res.status,
          text,
        );
      }
    }

    if (!res.ok) {
      const message =
        typeof data === "object" &&
        data &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : `İstek başarısız (${res.status})`;
      throw new ApiError(message, res.status, data);
    }

    return data as T;
  }

  return {
    health: () => request<{ ok: boolean }>("/health"),

    auth: {
      login: (email: string, password: string, totp?: string) =>
        request<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, totp }),
        }),
      register: (body: RegisterInput) =>
        request<AuthResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      acceptInvite: (body: UserInviteAcceptInput) =>
        request<AuthResponse>("/auth/accept-invite", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      forgotPassword: (body: ForgotPasswordInput) =>
        request<{ ok: true; message: string }>("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      resetPassword: (body: ResetPasswordInput) =>
        request<{ ok: true; message: string }>("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      me: () => request<ApiUser>("/auth/me"),
      setup2fa: () =>
        request<{ secret: string; otpauthUrl: string }>("/auth/2fa/setup", {
          method: "POST",
        }),
      enable2fa: (code: string) =>
        request<{ ok: true; twofaEnabled: boolean }>("/auth/2fa/enable", {
          method: "POST",
          body: JSON.stringify({ code }),
        }),
    },

    articles: {
      list: (query?: Record<string, string | number | boolean | undefined>) => {
        const qs = new URLSearchParams();
        Object.entries(query ?? {}).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, String(v));
        });
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<Paginated<ApiArticle>>(`/articles${suffix}`);
      },
      oembed: (url: string) =>
        request<VideoOembedResult>("/articles/oembed", {
          method: "POST",
          body: JSON.stringify({ url }),
        }),
      /** Haber odası paneli — sekme sayıları + yetki kapsamı */
      panelList: (query?: Record<string, string | number | boolean | undefined>) => {
        const qs = new URLSearchParams();
        qs.set("panel", "1");
        Object.entries(query ?? {}).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, String(v));
        });
        return request<{ data: ApiArticle[]; meta: HaberListMeta }>(
          `/articles?${qs}`,
        );
      },
      panelSnapshot: (ids: string[]) => {
        const qs = new URLSearchParams();
        if (ids.length) qs.set("ids", ids.join(","));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          counts: HaberStatusCounts;
          rows: Array<{
            id: string;
            status: ArticleStatus;
            viewCount: number;
            isFeatured: boolean;
          }>;
        }>(`/articles/panel/snapshot${suffix}`);
      },
      panelBulk: (body: HaberBulkAction) =>
        request<{
          ok: true;
          data: ApiArticle[];
          previous?: Array<{
            id: string;
            status: ArticleStatus;
            categoryId: string;
            isFeatured: boolean;
          }>;
        }>("/articles/panel/bulk", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      panelInline: (id: string, body: HaberInlineUpdate) =>
        request<ApiArticle>(`/articles/panel/inline/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      getBySlug: (slug: string) =>
        request<ApiArticle>(`/articles/slug/${slug}`),
      trackView: (id: string) =>
        request<{ ok: true; skipped?: string }>(
          `/articles/${encodeURIComponent(id)}/view`,
          { method: "POST", body: "{}" },
        ),
      getById: (id: string) => request<ApiArticle>(`/articles/${id}`),      /** Üye: kendi gönderdiği haberler */
      mine: (query?: { page?: number; limit?: number }) => {
        const qs = new URLSearchParams();
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<Paginated<ApiArticle>>(`/articles/mine${suffix}`);
      },
      /** Üye haber gönderimi → admin onayı (ONAYDA) */
      memberSubmit: (body: MemberArticleSubmit) =>
        request<ApiArticle>("/articles/member-submit", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      create: (body: ArticleInput) =>
        request<ApiArticle>("/articles", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: Partial<ArticleInput>) =>
        request<ApiArticle>(`/articles/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      /** Kalıcı sil — arşiv veya force:true (ADMIN) */
      remove: (id: string, opts?: { force?: boolean }) =>
        request<{ ok: true }>(
          `/articles/${id}${opts?.force ? "?force=1" : ""}`,
          { method: "DELETE" },
        ),
      lock: (id: string) =>
        request<ApiArticle>(`/articles/${encodeURIComponent(id)}/lock`, {
          method: "POST",
        }),
      unlock: (id: string) =>
        request<ApiArticle>(`/articles/${encodeURIComponent(id)}/unlock`, {
          method: "POST",
        }),
      /** Kilidi tazele (TTL 5 dk) */
      heartbeat: (id: string) =>
        request<ApiArticle>(`/articles/${encodeURIComponent(id)}/lock`, {
          method: "POST",
        }),
      revalidate: (id: string) =>
        request<{ ok: true; paths: string[] }>(`/articles/${id}/revalidate`, {
          method: "POST",
        }),
      featured: () => request<ApiArticle[]>("/articles/featured"),
      breaking: () => request<ApiArticle[]>("/articles/breaking"),
    },

    manset: {
      get: (kind?: string) => {
        const qs = kind ? `?kind=${encodeURIComponent(kind)}` : "";
        return request<MansetResponse>(`/manset${qs}`);
      },
      /** @deprecated legacy — panel draft/publish kullan */
      update: (body: MansetUpdateInput) =>
        request<MansetResponse>("/manset", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      panel: (kind = "home") =>
        request<MansetPanelResponse>(
          `/manset/panel?kind=${encodeURIComponent(kind)}`,
        ),
      candidates: (kind = "home", hours?: number) => {
        const qs = new URLSearchParams({ kind });
        if (hours) qs.set("hours", String(hours));
        return request<{ data: MansetCandidate[] }>(
          `/manset/panel/candidates?${qs}`,
        );
      },
      log: (kind = "home") =>
        request<{ data: MansetLogEntry[] }>(
          `/manset/panel/log?kind=${encodeURIComponent(kind)}`,
        ),
      lock: (kind = "home") =>
        request<MansetPanelResponse>("/manset/panel/lock", {
          method: "POST",
          body: JSON.stringify({ kind }),
        }),
      heartbeat: (kind = "home") =>
        request<{ ok: true; ttlMs: number }>("/manset/panel/heartbeat", {
          method: "POST",
          body: JSON.stringify({ kind }),
        }),
      unlock: (kind = "home") =>
        request<MansetPanelResponse>("/manset/panel/unlock", {
          method: "POST",
          body: JSON.stringify({ kind }),
        }),
      saveDraft: (body: MansetDraftUpdateInput) =>
        request<MansetPanelResponse>("/manset/panel/draft", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      publish: (kind = "home") =>
        request<MansetPanelResponse>("/manset/panel/publish", {
          method: "POST",
          body: JSON.stringify({ kind }),
        }),
      updateSettings: (body: Partial<import("@yenihaber/shared").MansetSettings>) =>
        request<{
          settings: import("@yenihaber/shared").MansetSettings;
          layout: import("@yenihaber/shared").MansetLayoutId;
        }>("/manset/settings", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },

    authors: {
      list: (query?: {
        columnistsOnly?: boolean;
        limit?: number;
        q?: string;
      }) => {
        const qs = new URLSearchParams();
        if (query?.columnistsOnly) qs.set("columnistsOnly", "true");
        if (query?.limit) qs.set("limit", String(query.limit));
        if (query?.q?.trim()) qs.set("q", query.q.trim());
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<ApiAuthor[]>(`/authors${suffix}`);
      },
      getBySlug: (slug: string, query?: { page?: number; limit?: number }) => {
        const qs = new URLSearchParams();
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          author: ApiAuthor;
          articles: Paginated<ApiArticle>;
        }>(`/authors/slug/${slug}${suffix}`);
      },
    },

    markets: {
      get: (refresh?: boolean) =>
        request<ApiMarkets>(
          refresh ? "/markets?refresh=1" : "/markets",
        ),
    },

    prayer: {
      cities: () =>
        request<{ cities: ApiPrayerCity[]; defaultCity: string }>(
          "/prayer/cities",
        ),
      get: (city?: string, refresh?: boolean) => {
        const qs = new URLSearchParams();
        if (city) qs.set("city", city);
        if (refresh) qs.set("refresh", "1");
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<ApiPrayer>(`/prayer${suffix}`);
      },
    },

    sports: {
      get: (refresh?: boolean) =>
        request<ApiSports>(refresh ? "/sports?refresh=1" : "/sports"),
    },

    cinema: {
      get: (refresh?: boolean) =>
        request<ApiCinema>(refresh ? "/cinema?refresh=1" : "/cinema"),
    },

    categories: {
      list: (query?: {
        tree?: boolean;
        home?: boolean;
        menu?: boolean;
        bucket?: string;
      }) => {
        const qs = new URLSearchParams();
        if (query?.tree) qs.set("tree", "1");
        if (query?.home) qs.set("home", "1");
        if (query?.menu) qs.set("menu", "1");
        if (query?.bucket) qs.set("bucket", query.bucket);
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<ApiCategory[]>(`/categories${suffix}`);
      },
      getBySlug: (slug: string) =>
        request<ApiCategory>(`/categories/slug/${slug}`),
      create: (body: CategoryInput) =>
        request<ApiCategory>("/categories", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: Partial<CategoryInput>) =>
        request<ApiCategory>(`/categories/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      saveHomeRails: (body: {
        items: Array<{
          id: string;
          onHome: boolean;
          homeOrder: number;
          color?: string | null;
        }>;
      }) =>
        request<{ ok: true; data: ApiCategory[] }>("/categories/home-rails", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      moveArticles: (id: string, targetCategoryId: string) =>
        request<{ ok: true; moved: number }>(
          `/categories/${id}/move-articles`,
          {
            method: "POST",
            body: JSON.stringify({ targetCategoryId }),
          },
        ),
      remove: (id: string) =>
        request<{ ok: true }>(`/categories/${id}`, { method: "DELETE" }),
    },

    media: {
      list: (query?: {
        kind?: string;
        q?: string;
        page?: number;
        limit?: number;
      }) => {
        const qs = new URLSearchParams();
        if (query?.kind) qs.set("kind", query.kind);
        if (query?.q) qs.set("q", query.q);
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          data: Array<{
            id: string;
            path: string;
            url: string;
            name: string;
            kind: string;
            altText: string;
            credit: string;
            mime: string | null;
            size: number;
            uploadedAt: string;
          }>;
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            counts: Record<string, number>;
          };
        }>(`/media${suffix}`);
      },
      sync: () =>
        request<{ ok: true; scanned: number; created: number }>("/media/sync", {
          method: "POST",
        }),
      remove: (id: string) =>
        request<{ ok: true }>(`/media/${id}`, { method: "DELETE" }),
      bulkDelete: (ids: string[]) =>
        request<{ ok: true; deleted: number }>("/media/bulk", {
          method: "POST",
          body: JSON.stringify({ action: "delete", ids }),
        }),
      /** Bilgisayardan görsel yükle — kind: haber | marka | genel */
      upload: async (file: File, opts?: { kind?: string; alt?: string; credit?: string }) => {
        const fd = new FormData();
        fd.append("file", file);
        if (opts?.kind) fd.append("kind", opts.kind);
        if (opts?.alt) fd.append("alt", opts.alt);
        if (opts?.credit) fd.append("credit", opts.credit);
        const headers = new Headers();
        const token = options.getToken?.();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        const res = await fetch(`${baseUrl}/media/upload`, {
          method: "POST",
          headers,
          body: fd,
          cache: "no-store",
        });
        const text = await res.text();
        const data = text ? (JSON.parse(text) as unknown) : null;
        if (!res.ok) {
          const message =
            typeof data === "object" &&
            data &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
              ? (data as { message: string }).message
              : `Yükleme başarısız (${res.status})`;
          throw new ApiError(message, res.status, data);
        }
        return data as {
          ok: true;
          url: string;
          path: string;
          mime: string;
          size: number;
          name: string;
          kind?: string;
          id?: string;
        };
      },
    },

    tags: {
      list: (query?: {
        filter?: "all" | "featured" | "rare" | "similar";
        featured?: boolean;
        q?: string;
        page?: number;
        limit?: number;
      }) => {
        const qs = new URLSearchParams();
        if (query?.filter) qs.set("filter", query.filter);
        if (query?.featured) qs.set("featured", "1");
        if (query?.q) qs.set("q", query.q);
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          data: ApiTag[] | ApiTagPair[];
          meta: ApiTagListMeta;
        }>(`/tags${suffix}`);
      },
      suggest: (q: string, limit = 12) => {
        const qs = new URLSearchParams({ q, limit: String(limit) });
        return request<ApiTag[]>(`/tags/suggest?${qs}`);
      },
      getBySlug: (slug: string) => request<ApiTag>(`/tags/slug/${slug}`),
      create: (body: TagInput) =>
        request<ApiTag>("/tags", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: TagPatch) =>
        request<ApiTag>(`/tags/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      merge: (body: TagMergeInput) =>
        request<{
          ok: true;
          target: ApiTag;
          merged: string[];
          movedLinks: number;
        }>("/tags/merge", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      bulk: (body: TagBulkInput) =>
        request<{ ok: true; deleted?: number }>("/tags/bulk", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      cleanup: (months = 12) =>
        request<{ ok: true; deleted: number }>(
          `/tags/cleanup?months=${months}`,
          { method: "POST" },
        ),
      remove: (id: string) =>
        request<{ ok: true }>(`/tags/${id}`, { method: "DELETE" }),
    },

    redirects: {
      lookup: (path: string) =>
        request<
          | { found: false }
          | { found: true; fromPath: string; toPath: string; code: number }
        >(`/redirects/lookup?path=${encodeURIComponent(path)}`),
    },

    comments: {
      list: (query?: {
        status?: string;
        articleId?: string;
        q?: string;
        page?: number;
        limit?: number;
      }) => {
        const qs = new URLSearchParams();
        if (query?.status) qs.set("status", query.status);
        if (query?.articleId) qs.set("articleId", query.articleId);
        if (query?.q) qs.set("q", query.q);
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          data: ApiComment[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            counts: {
              BEKLEMEDE: number;
              ONAYLI: number;
              ARSIV: number;
              COP: number;
            };
          };
        }>(`/comments${suffix}`);
      },
      /** Onaylı yorumlar — public, lazy load için */
      public: (articleId: string) =>
        request<ApiComment[]>(
          `/comments/public?articleId=${encodeURIComponent(articleId)}`,
        ),
      create: (body: CommentInput) =>
        request<ApiComment>("/comments", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      /** Yazar 2 dk düzenleme */
      editMine: (id: string, body: { content: string; website?: string }) =>
        request<ApiComment>(`/comments/${id}/mine`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      /** Çöp oranı — admin */
      stats: (days = 7) =>
        request<import("@yenihaber/shared").ApiCommentStats>(
          `/comments/stats?days=${days}`,
        ),
      moderate: (
        id: string,
        status: "ONAYLI" | "BEKLEMEDE" | "ARSIV" | "COP",
      ) =>
        request<ApiComment>(`/comments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      bulk: (
        ids: string[],
        status: "ONAYLI" | "BEKLEMEDE" | "ARSIV" | "COP",
      ) =>
        request<{ ok: true; updated: number; ids: string[] }>(
          "/comments/bulk",
          {
            method: "POST",
            body: JSON.stringify({ ids, status }),
          },
        ),
    },

    reactions: {
      get: (articleId: string) =>
        request<ApiReactionSummary>(
          `/reactions/${encodeURIComponent(articleId)}`,
        ),
      post: (articleId: string, type: ReactionType) =>
        request<
          ApiReactionSummary & {
            already: boolean;
            type: ReactionType | null;
            mine?: ReactionType | null;
            action?: "add" | "remove" | "switch";
          }
        >(`/reactions/${encodeURIComponent(articleId)}`, {
          method: "POST",
          body: JSON.stringify({ type }),
        }),
      config: () =>
        request<{
          minShow: number;
          items: Array<{
            id: ReactionType;
            label: string;
            emoji: string;
            enabled: boolean;
            order: number;
          }>;
        }>("/reactions/config"),
      insights: (query?: { type?: ReactionType; limit?: number }) => {
        const qs = new URLSearchParams();
        if (query?.type) qs.set("type", query.type);
        if (query?.limit) qs.set("limit", String(query.limit));
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          type: ReactionType;
          data: Array<{
            articleId: string;
            count: number;
            title: string;
            slug: string;
            coverImage: string | null;
            categoryName: string;
            publishedAt: string | null;
          }>;
        }>(`/reactions/insights${suffix}`);
      },
    },

    neighbors: {
      get: (slug: string) =>
        request<ApiArticleNeighbors>(
          `/neighbors/${encodeURIComponent(slug)}`,
        ),
    },

    dashboard: {
      stats: () => request<DashboardStats>("/dashboard/stats"),
      notifications: () =>
        request<DashboardNotifications>("/dashboard/notifications"),
      bik: (days = 30) =>
        request<{
          days: number;
          data: Array<{
            date: string;
            publishedCount: number;
            pageviews: number;
            uniqueVisitors: number | null;
            note: string | null;
          }>;
          totals: { publishedCount: number; pageviews: number };
          hint: string;
        }>(`/dashboard/bik?days=${days}`),
      bikPatch: (
        date: string,
        body: { uniqueVisitors?: number | null; note?: string | null },
      ) =>
        request<{
          date: string;
          publishedCount: number;
          pageviews: number;
          uniqueVisitors: number | null;
          note: string | null;
        }>(`/dashboard/bik/${encodeURIComponent(date)}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },

    contact: {
      /** Public form */
      create: (body: {
        name?: string;
        email?: string;
        topic?: string;
        subject?: string;
        body: string;
        website?: string;
      }) =>
        request<{ ok: true; id?: string }>("/contact", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      list: (status?: string) => {
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return request<{ data: ApiContactMessage[] }>(`/contact${qs}`);
      },
      update: (id: string, status: "new" | "read" | "archived") =>
        request<ApiContactMessage>(`/contact/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      remove: (id: string) =>
        request<{ ok: true }>(`/contact/${id}`, { method: "DELETE" }),
    },

    polls: {
      active: () => request<{ poll: ApiPoll | null }>("/polls/active"),
      byArticle: (articleId: string) =>
        request<{ poll: ApiPoll | null }>(
          `/polls/article/${encodeURIComponent(articleId)}`,
        ),
      archive: (query?: { page?: number; limit?: number }) => {
        const qs = new URLSearchParams();
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        const s = qs.toString() ? `?${qs}` : "";
        return request<{
          data: ApiPoll[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/polls/archive${s}`);
      },
      get: (id: string) => request<{ poll: ApiPoll }>(`/polls/${id}`),
      vote: (id: string, body: PollVoteInput) =>
        request<{ poll: ApiPoll | null; already: boolean }>(
          `/polls/${id}/vote`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        ),
      list: (query?: { status?: string; q?: string }) => {
        const qs = new URLSearchParams();
        if (query?.status) qs.set("status", query.status);
        if (query?.q) qs.set("q", query.q);
        const s = qs.toString() ? `?${qs}` : "";
        return request<{
          data: ApiPoll[];
          activeGeneralId: string | null;
        }>(`/polls${s}`);
      },
      create: (body: PollCreateInput) =>
        request<
          | { poll: ApiPoll }
          | {
              conflict: true;
              message: string;
              activePoll: ApiPoll;
            }
        >("/polls", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: PollUpdateInput) =>
        request<
          | { poll: ApiPoll | null }
          | {
              conflict: true;
              message: string;
              activePoll: ApiPoll;
            }
        >(`/polls/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        request<{ ok: true }>(`/polls/${id}`, { method: "DELETE" }),
    },

    stories: {
      list: () => request<{ data: ApiStory[] }>("/stories"),
      adminList: (status?: string) => {
        const qs = status ? `?status=${encodeURIComponent(status)}` : "";
        return request<{ data: ApiStory[] }>(`/stories/admin${qs}`);
      },
      create: (body: StoryCreateInput) =>
        request<{ story: ApiStory }>("/stories", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: StoryUpdateInput) =>
        request<{ story: ApiStory }>(`/stories/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      reorder: (body: StoryReorderInput) =>
        request<{ ok: true }>("/stories/reorder", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        request<{ ok: true }>(`/stories/${id}`, { method: "DELETE" }),
      upload: async (file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        const headers = new Headers();
        const token = options.getToken?.();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        const res = await fetch(`${baseUrl}/stories/upload`, {
          method: "POST",
          headers,
          body: fd,
          cache: "no-store",
        });
        const text = await res.text();
        const data = text ? (JSON.parse(text) as unknown) : null;
        if (!res.ok) {
          const message =
            typeof data === "object" &&
            data &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
              ? (data as { message: string }).message
              : `Yükleme başarısız (${res.status})`;
          throw new ApiError(message, res.status, data);
        }
        return data as {
          ok: true;
          url: string;
          mime: string;
          kind: "image" | "video";
          size: number;
        };
      },
    },

    listings: {
      list: (query?: { kind?: string }) => {
        const qs = new URLSearchParams();
        if (query?.kind) qs.set("kind", query.kind);
        const s = qs.toString() ? `?${qs}` : "";
        return request<{ data: ApiPaidListing[] }>(`/listings${s}`);
      },
      adminList: (query?: { status?: string; kind?: string; q?: string }) => {
        const qs = new URLSearchParams();
        if (query?.status) qs.set("status", query.status);
        if (query?.kind) qs.set("kind", query.kind);
        if (query?.q) qs.set("q", query.q);
        const s = qs.toString() ? `?${qs}` : "";
        return request<{ data: ApiPaidListing[] }>(`/listings/admin${s}`);
      },
      get: (idOrSlug: string) =>
        request<{ listing: ApiPaidListing }>(
          `/listings/${encodeURIComponent(idOrSlug)}`,
        ),
      create: (body: PaidListingCreateInput) =>
        request<{ listing: ApiPaidListing }>("/listings", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: PaidListingUpdateInput) =>
        request<{ listing: ApiPaidListing }>(`/listings/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        request<{ ok: true }>(`/listings/${id}`, { method: "DELETE" }),
      expireDue: () =>
        request<{ ok: true; expired: number }>("/listings/expire-due", {
          method: "POST",
        }),
    },

    elections: {
      strip: () => request<{ strip: ApiElectionStrip | null }>("/elections/strip"),
      live: (slug?: string) => {
        const q = slug ? `?slug=${encodeURIComponent(slug)}` : "";
        return request<ApiElectionBundle>(`/elections/live${q}`);
      },
      race: (id: string, compareRegionId?: string) => {
        const q = compareRegionId
          ? `?compareRegionId=${encodeURIComponent(compareRegionId)}`
          : "";
        return request<{ race: ApiElectionRace }>(`/elections/races/${id}${q}`);
      },
      list: () =>
        request<{
          data: Array<{
            id: string;
            name: string;
            slug: string;
            kind: string;
            status: string;
            raceCount: number;
            partyCount: number;
            updatedAt: string;
          }>;
          colorPalette: string[];
        }>("/elections"),
      get: (id: string) => request<Record<string, unknown>>(`/elections/${id}`),
      create: (body: {
        name: string;
        slug: string;
        kind?: string;
        status?: string;
      }) =>
        request<{ election: { id: string } }>("/elections", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (
        id: string,
        body: { name?: string; status?: string; kind?: string },
      ) =>
        request<{ election: unknown }>(`/elections/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      updateRace: (
        raceId: string,
        body: {
          name?: string;
          isFeatured?: boolean;
          note?: string | null;
          noteTone?: "info" | "warn" | "ok";
          seatCount?: number | null;
        },
      ) =>
        request<{ race: ApiElectionRace }>(`/elections/races/${raceId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      createRegion: (
        electionId: string,
        body: {
          name: string;
          slug: string;
          level: "ulke" | "il" | "ilce" | "belde";
          parentId?: string | null;
          ballotTotal?: number;
        },
      ) =>
        request<{ region: { id: string; name: string } }>(
          `/elections/${electionId}/regions`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        ),
      createAlliance: (
        electionId: string,
        body: { name: string; color: string },
      ) =>
        request<{ alliance: { id: string; name: string; color: string } }>(
          `/elections/${electionId}/alliances`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        ),
      createRace: (
        electionId: string,
        body: {
          regionId: string;
          type: string;
          name: string;
          seatCount?: number | null;
          round?: number;
          isFeatured?: boolean;
        },
      ) =>
        request<{ race: { id: string } }>(`/elections/${electionId}/races`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      saveResults: (
        raceId: string,
        body: {
          results: Array<{
            candidateId: string;
            votes: number;
            source?: string;
          }>;
          ballot?: {
            ballotOpen?: number;
            ballotTotal?: number;
            source?: string;
          };
          note?: string | null;
          noteTone?: string;
          recomputeSeats?: boolean;
        },
      ) =>
        request<{ race: ApiElectionRace }>(
          `/elections/races/${raceId}/results`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          },
        ),
      recomputeSeats: (raceId: string) =>
        request<{ race: ApiElectionRace }>(
          `/elections/races/${raceId}/recompute-seats`,
          { method: "POST" },
        ),
      refreshStrip: (id: string) =>
        request<{ strip: ApiElectionStrip | null }>(
          `/elections/${id}/refresh-strip`,
          { method: "POST" },
        ),
      createParty: (
        electionId: string,
        body: {
          name: string;
          shortName?: string;
          color: string;
          logoUrl?: string | null;
          allianceId?: string | null;
          forceColor?: boolean;
        },
      ) =>
        request<{
          party?: {
            id: string;
            name: string;
            shortName: string;
            color: string;
            logoUrl: string | null;
          };
          conflict?: boolean;
          message?: string;
        }>(`/elections/${electionId}/parties`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      updateParty: (
        partyId: string,
        body: {
          name?: string;
          shortName?: string;
          color?: string;
          logoUrl?: string | null;
          allianceId?: string | null;
          forceColor?: boolean;
        },
      ) =>
        request<{
          party?: {
            id: string;
            name: string;
            shortName: string;
            color: string;
            logoUrl: string | null;
          };
          conflict?: boolean;
          message?: string;
        }>(`/elections/parties/${partyId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      deleteParty: (partyId: string) =>
        request<{ ok: true }>(`/elections/parties/${partyId}`, {
          method: "DELETE",
        }),
      createCandidate: (
        raceId: string,
        body: {
          name: string;
          partyId?: string | null;
          initials?: string;
          photoUrl?: string | null;
          listOrder?: number;
          showInStrip?: boolean;
          stripPin?: number | null;
        },
      ) =>
        request<{ candidate: { id: string } }>(
          `/elections/races/${raceId}/candidates`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        ),
      updateCandidate: (
        candidateId: string,
        body: {
          name?: string;
          partyId?: string | null;
          initials?: string;
          photoUrl?: string | null;
          listOrder?: number;
          showInStrip?: boolean;
          stripPin?: number | null;
        },
      ) =>
        request<{ candidate: { id: string } }>(
          `/elections/candidates/${candidateId}`,
          {
            method: "PATCH",
            body: JSON.stringify(body),
          },
        ),
      deleteCandidate: (candidateId: string) =>
        request<{ ok: true }>(`/elections/candidates/${candidateId}`, {
          method: "DELETE",
        }),
    },

    users: {
      list: (query?: { q?: string }) => {
        const qs = new URLSearchParams();
        if (query?.q?.trim()) qs.set("q", query.q.trim());
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<AdminUserRow[]>(`/users${suffix}`);
      },
      update: (id: string, body: AdminUserUpdateInput) =>
        request<AdminUserRow>(`/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      /** Kalıcı silme — yazar profili + haberler kalır */
      remove: (id: string, body?: AdminUserDeleteInput) =>
        request<{ ok: true }>(`/users/${id}`, {
          method: "DELETE",
          body: JSON.stringify(body ?? {}),
        }),
      sendReset: (id: string) =>
        request<{ ok: true; message: string }>(`/users/${id}/send-reset`, {
          method: "POST",
        }),
      logoutAll: (id: string) =>
        request<{ ok: true; revoked: number }>(`/users/${id}/logout-all`, {
          method: "POST",
        }),
      authors: () => request<AdminAuthorRow[]>("/users/authors"),
      createAuthor: (body: AuthorAdminCreateInput) =>
        request<AdminAuthorRow>("/users/authors", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      updateAuthor: (id: string, body: AuthorAdminUpdateInput) =>
        request<AdminAuthorRow>(`/users/authors/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      /** Kalıcı silme — haber varsa transferAuthorId zorunlu */
      deleteAuthor: (id: string, body?: AdminUserDeleteInput) =>
        request<{ ok: true }>(`/users/authors/${id}`, {
          method: "DELETE",
          body: JSON.stringify(body ?? {}),
        }),
      invites: () => request<AdminInviteRow[]>("/users/invites"),
      createInvite: (body: UserInviteCreateInput) =>
        request<AdminInviteRow & { acceptUrl?: string }>("/users/invites", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      resendInvite: (id: string) =>
        request<AdminInviteRow & { acceptUrl?: string }>(
          `/users/invites/${id}/resend`,
          { method: "POST" },
        ),
      deleteInvite: (id: string) =>
        request<{ ok: true }>(`/users/invites/${id}`, { method: "DELETE" }),
      capabilities: () =>
        request<{
          labels: Record<string, string>;
          matrix: Record<string, string[]>;
          roles: string[];
        }>("/users/capabilities"),
    },

    sessions: {
      list: () => request<{ data: AdminSessionRow[] }>("/auth/sessions"),
      logoutAll: () =>
        request<{ ok: true }>("/auth/logout-all", { method: "POST" }),
      revoke: (id: string) =>
        request<{ ok: true }>(`/auth/sessions/${id}/revoke`, {
          method: "POST",
        }),
    },

    menus: {
      get: (location: MenuLocation) =>
        request<{ menu: ApiMenu | null }>(`/menus/${location}`),
      admin: (location: MenuLocation) =>
        request<{
          menu: ApiMenu | null;
          meta: { label: string; maxDepth: number; maxRoots: number; note: string };
        }>(`/menus/admin/${location}`),
      createItem: (location: MenuLocation, body: MenuItemInput) =>
        request<{ item: unknown }>(`/menus/admin/${location}/items`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      updateItem: (id: string, body: MenuItemPatch) =>
        request<{ item: unknown }>(`/menus/admin/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      reorder: (location: MenuLocation, body: MenuReorderInput) =>
        request<{ ok: true }>(`/menus/admin/${location}/reorder`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      copyHeaderToSidebar: () =>
        request<{ menu: ApiMenu | null }>("/menus/admin/sidebar/copy-header", {
          method: "POST",
        }),
      deactivate: (id: string) =>
        request<{ ok: true; soft: boolean }>(`/menus/admin/items/${id}`, {
          method: "DELETE",
        }),
      /** Kalıcı silme (alt öğeler cascade) */
      remove: (id: string) =>
        request<{ ok: true; soft: boolean }>(
          `/menus/admin/items/${id}?hard=1`,
          { method: "DELETE" },
        ),
    },

    settings: {
      get: () => request<Record<string, string>>("/settings"),
      bundle: () => request<SettingsBundle>("/settings/bundle"),
      admin: () => request<SettingsBundle>("/settings/admin"),
      meta: () =>
        request<{
          groups: Array<{ id: SettingsGroup; label: string }>;
          palettes: Array<{
            id: string;
            label: string;
            primary: string;
            accent: string;
            link: string;
            breaking: string;
          }>;
        }>("/settings/meta"),
      updateGroup: (group: SettingsGroup, body: SettingsMap) =>
        request<{
          ok: true;
          group: SettingsGroup;
          values: SettingsMap;
        }>(`/settings/group/${group}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      update: (body: Record<string, string>) =>
        request<Record<string, string>>("/settings", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      testEmail: (to?: string) =>
        request<{
          ok: boolean;
          mode: string;
          to: string;
          message: string;
        }>("/settings/test-email", {
          method: "POST",
          body: JSON.stringify(to ? { to } : {}),
        }),
    },

    ads: {
      /** Public — rotasyon ile tek reklam */
      getSlot: (code: string) =>
        request<{ ad: AdPublic | null }>(
          `/ads/slot/${encodeURIComponent(code)}`,
        ),
      track: async (adId: string, event: "impression" | "click") => {
        const body = JSON.stringify({ adId, event });
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(
            `${baseUrl}/ads/track`,
            new Blob([body], { type: "application/json" }),
          );
          return;
        }
        await fetch(`${baseUrl}/ads/track`, {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      },
      slots: () =>
        request<{
          byPage: Record<string, Array<{ code: string; name: string; note: string; sizes: { desktop?: string; mobile?: string }; device: string }>>;
          pageLabels: Record<string, string>;
        }>("/ads/slots"),
      list: (query?: { status?: string; slot?: string; q?: string }) => {
        const qs = new URLSearchParams();
        if (query?.status) qs.set("status", query.status);
        if (query?.slot) qs.set("slot", query.slot);
        if (query?.q) qs.set("q", query.q);
        const s = qs.toString() ? `?${qs}` : "";
        return request<{ data: AdAdminRow[] }>(`/ads${s}`);
      },
      create: (body: AdCreateInput) =>
        request<AdAdminRow>("/ads", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: AdUpdateInput) =>
        request<AdAdminRow>(`/ads/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        request<{ ok: true }>(`/ads/${id}`, { method: "DELETE" }),
      archiveExpired: () =>
        request<{ ok: true; archived: number }>("/ads/archive-expired", {
          method: "POST",
        }),
    },

    logs: {
      list: (query?: {
        page?: number;
        limit?: number;
        action?: string;
        q?: string;
      }) => {
        const qs = new URLSearchParams();
        if (query?.page) qs.set("page", String(query.page));
        if (query?.limit) qs.set("limit", String(query.limit));
        if (query?.action) qs.set("action", query.action);
        if (query?.q) qs.set("q", query.q);
        const suffix = qs.toString() ? `?${qs}` : "";
        return request<{
          data: Array<{
            id: string;
            action: string;
            entityType: string;
            entityId: string | null;
            meta: string | null;
            createdAt: string;
            actor: { id: string; name: string; email: string } | null;
          }>;
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/logs${suffix}`);
      },
      actions: () =>
        request<{ data: Array<{ action: string; count: number }> }>(
          "/logs/actions",
        ),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
