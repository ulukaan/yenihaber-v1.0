"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type {
  ApiCategory,
  ArticleStatus,
  ContentType,
  VideoOrientation,
  VideoProvider,
} from "@yenihaber/shared";
import {
  VIDEO_TRANSCRIPT_MIN_CHARS,
  canPublish,
  hasCapability,
  slugify,
} from "@yenihaber/shared";
import { Button } from "@yenihaber/ui";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { ArticleGalleryEditor } from "@/components/article-gallery-editor/article-gallery-editor";
import { TagPicker } from "@/components/tag-picker/tag-picker";
import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor";
import { useAuth } from "@/components/auth-provider/auth-provider";
import { adminApi } from "@/lib/api";
import { ApiError } from "@yenihaber/api-client";
import styles from "./form.module.css";

const SOURCE_OPTIONS = [
  "Haber Merkezi",
  "AA",
  "İHA",
  "DHA",
  "DHA Video",
  "Özel Haber",
  "Sosyal medya",
  "Okur ihbarı",
] as const;

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as {
      message?: string;
      issues?: Array<{ path?: string; message?: string }>;
    } | null;
    if (body?.issues?.length) {
      return body.issues
        .map((i) =>
          i.path ? `${i.path}: ${i.message}` : (i.message ?? ""),
        )
        .filter(Boolean)
        .join(" · ");
    }
    if (body?.message) return body.message;
    if (err.status === 422) return `Doğrulama hatası (422): ${err.message}`;
    return err.message;
  }
  return err instanceof Error ? err.message : "Kayıt başarısız";
}

type FormState = {
  title: string;
  headlineTitle: string;
  slug: string;
  excerpt: string;
  content: string;
  contentType: ContentType;
  coverImage: string;
  coverImage169: string;
  coverImage11: string;
  coverAlt: string;
  coverCredit: string;
  galleryImages: { url: string; alt?: string | null }[];
  status: ArticleStatus;
  categoryId: string;
  tagNames: string[];
  isBreaking: boolean;
  breakingUntil: string;
  isFeatured: boolean;
  isSideManset: boolean;
  isSpotlight: boolean;
  isSponsored: boolean;
  scheduledAt: string;
  publishedAt: string;
  commentsClosed: boolean;
  pressAdNo: string;
  relatedArticleId: string;
  redirectUrl: string;
  extrasOpen: boolean;
  updateNote: string;
  sourceAgency: string;
  metaTitle: string;
  metaDescription: string;
  videoUrl: string;
  videoProvider: "" | VideoProvider;
  videoId: string;
  videoDuration: string;
  videoPoster: string;
  videoOrientation: VideoOrientation;
  videoTranscript: string;
  videoSource: string;
  videoIsLive: boolean;
  videoLiveEndsAt: string;
  videoOpen: boolean;
};

function emptyForm(type: ContentType = "haber"): FormState {
  return {
    title: "",
    headlineTitle: "",
    slug: "",
    excerpt: "",
    content: "",
    contentType: type,
    coverImage: "",
    coverImage169: "",
    coverImage11: "",
    coverAlt: "",
    coverCredit: "",
    galleryImages: [],
    status: "TASLAK",
    categoryId: "",
    tagNames: [],
    isBreaking: false,
    breakingUntil: "",
    isFeatured: false,
    isSideManset: false,
    isSpotlight: false,
    isSponsored: false,
    scheduledAt: "",
    publishedAt: toLocalInput(new Date().toISOString()),
    commentsClosed: false,
    pressAdNo: "",
    relatedArticleId: "",
    redirectUrl: "",
    extrasOpen: true,
    updateNote: "",
    sourceAgency: "",
    metaTitle: "",
    metaDescription: "",
    videoUrl: "",
    videoProvider: "",
    videoId: "",
    videoDuration: "",
    videoPoster: "",
    videoOrientation: "yatay",
    videoTranscript: "",
    videoSource: "",
    videoIsLive: false,
    videoLiveEndsAt: "",
    videoOpen: type === "video",
  };
}

type CatRow = { id: string; name: string; depth: number };

function flattenCats(tree: ApiCategory[]): CatRow[] {
  const out: CatRow[] = [];
  for (const r of tree) {
    out.push({ id: r.id, name: r.name, depth: 0 });
    for (const ch of r.children ?? []) {
      out.push({ id: ch.id, name: ch.name, depth: 1 });
    }
  }
  return out;
}

export default function ArticleFormPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isNew = params.id === "new";
  const router = useRouter();
  const { user } = useAuth();
  const publisher = user ? canPublish(user.role) : false;
  const canManset = user ? hasCapability(user.role, "manset") : false;
  const [form, setForm] = useState<FormState>(() => {
    const t = searchParams.get("type");
    if (t === "video") return emptyForm("video");
    if (t === "galeri" || t === "gallery") return emptyForm("galeri");
    return emptyForm("haber");
  });
  const [articleId, setArticleId] = useState<string | null>(
    isNew ? null : params.id,
  );
  const [catTree, setCatTree] = useState<ApiCategory[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [lockNote, setLockNote] = useState("");
  const [lockedOut, setLockedOut] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<Date | null>(null);
  const [autosaveTick, setAutosaveTick] = useState(0);
  const [oembedBusy, setOembedBusy] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [catQuery, setCatQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const catBoxRef = useRef<HTMLDivElement>(null);
  const formRef = useRef(form);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const articleIdRef = useRef(articleId);
  const skipDirtyRef = useRef(false);
  const editGenRef = useRef(0);
  const hydratedRef = useRef(false);

  formRef.current = form;
  dirtyRef.current = dirty;
  savingRef.current = saving;
  articleIdRef.current = articleId;

  const catRows = useMemo(() => flattenCats(catTree), [catTree]);

  const selectedCatName = useMemo(() => {
    const row = catRows.find((c) => c.id === form.categoryId);
    return row ? (row.depth ? `↳ ${row.name}` : row.name) : "";
  }, [catRows, form.categoryId]);

  const filteredCats = useMemo(() => {
    const q = catQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return catRows;
    return catRows.filter((c) =>
      c.name.toLocaleLowerCase("tr-TR").includes(q),
    );
  }, [catRows, catQuery]);

  const autosaveAgo = useMemo(() => {
    if (!lastAutosavedAt) return "";
    const sec = Math.max(
      0,
      Math.floor((Date.now() - lastAutosavedAt.getTime()) / 1000),
    );
    if (sec < 5) return "az önce";
    if (sec < 60) return `${sec} saniye önce`;
    const min = Math.floor(sec / 60);
    return `${min} dakika önce`;
  }, [lastAutosavedAt, autosaveTick]);

  // Seçili kategori değişince arama kutusunu senkronla (dışarı tık / ilk yükleme)
  useEffect(() => {
    if (!catOpen) setCatQuery(selectedCatName);
  }, [selectedCatName, catOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!catBoxRef.current?.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!lastAutosavedAt) return;
    const t = window.setInterval(() => setAutosaveTick((n) => n + 1), 5000);
    return () => window.clearInterval(t);
  }, [lastAutosavedAt]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  function pickCategory(id: string) {
    update("categoryId", id);
    const row = catRows.find((c) => c.id === id);
    setCatQuery(row ? (row.depth ? `↳ ${row.name}` : row.name) : "");
    setCatOpen(false);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (!skipDirtyRef.current) {
      editGenRef.current += 1;
      setDirty(true);
    }
  }

  function applyArticleToForm(
    article: Awaited<ReturnType<typeof adminApi.articles.getById>>,
  ) {
    skipDirtyRef.current = true;
    setForm({
      title: article.title,
      headlineTitle: article.headlineTitle ?? "",
      slug: article.slug,
      excerpt: article.excerpt ?? "",
      content: article.content,
      contentType: article.contentType ?? "haber",
      coverImage: article.coverImage ?? "",
      coverImage169: article.coverImage169 ?? "",
      coverImage11: article.coverImage11 ?? "",
      coverAlt: article.coverAlt ?? "",
      coverCredit: article.coverCredit ?? "",
      galleryImages: article.galleryImages ?? [],
      status: article.status,
      categoryId: article.category.id,
      tagNames: article.tags.map((t) => t.name),
      isBreaking: article.isBreaking,
      breakingUntil: toLocalInput(article.breakingUntil),
      isFeatured: article.isFeatured,
      isSideManset: article.isSideManset,
      isSpotlight: article.isSpotlight ?? false,
      isSponsored: article.isSponsored ?? false,
      scheduledAt: toLocalInput(article.scheduledAt),
      publishedAt: toLocalInput(article.publishedAt ?? article.createdAt),
      commentsClosed: article.commentsClosed ?? false,
      pressAdNo: article.pressAdNo ?? "",
      relatedArticleId: article.relatedArticleId ?? "",
      redirectUrl: article.redirectUrl ?? "",
      extrasOpen: true,
      updateNote: article.updateNote ?? "",
      sourceAgency: article.sourceAgency ?? "",
      metaTitle: article.metaTitle ?? "",
      metaDescription: article.metaDescription ?? "",
      videoUrl: "",
      videoProvider: article.videoProvider ?? "",
      videoId: article.videoId ?? "",
      videoDuration:
        article.videoDuration != null ? String(article.videoDuration) : "",
      videoPoster: article.videoPoster ?? "",
      videoOrientation: article.videoOrientation ?? "yatay",
      videoTranscript: article.videoTranscript ?? "",
      videoSource: article.videoSource ?? "",
      videoIsLive: article.videoIsLive ?? false,
      videoLiveEndsAt: toLocalInput(article.videoLiveEndsAt),
      videoOpen: article.contentType === "video",
    });
    if (article.lastAutosavedAt) {
      setLastAutosavedAt(new Date(article.lastAutosavedAt));
    }
    queueMicrotask(() => {
      skipDirtyRef.current = false;
      setDirty(false);
    });
  }

  useEffect(() => {
    adminApi.categories
      .list({ tree: true })
      .then((rows) => {
        setCatTree(rows);
        const flat = flattenCats(rows);
        setForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || flat[0]?.id || "",
        }));
      })
      .catch(() => {
        adminApi.categories.list().then((rows) => {
          setCatTree(rows);
          setForm((prev) => ({
            ...prev,
            categoryId: prev.categoryId || rows[0]?.id || "",
          }));
        });
      });
  }, []);

  useEffect(() => {
    if (isNew) {
      hydratedRef.current = false;
      return;
    }
    let cancelled = false;

    async function takeLock() {
      try {
        await adminApi.articles.lock(params.id);
        if (!cancelled) {
          setLockNote("");
          setLockedOut(false);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 409) {
          setLockNote(formatApiError(e));
          setLockedOut(true);
        }
      }
    }

    if (hydratedRef.current && articleIdRef.current === params.id) {
      void takeLock();
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    adminApi.articles
      .getById(params.id)
      .then(async (article) => {
        if (cancelled) return;
        applyArticleToForm(article);
        setArticleId(article.id);
        hydratedRef.current = true;
        await takeLock();
      })
      .catch((e) => setError(formatApiError(e)))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isNew, params.id, user?.id]);

  useEffect(() => {
    if (isNew || lockedOut) return;
    const id = params.id;
    const beat = window.setInterval(() => {
      void adminApi.articles.heartbeat(id).catch(() => {
        /* sessiz */
      });
    }, 90_000);
    return () => {
      window.clearInterval(beat);
      void adminApi.articles.unlock(id).catch(() => {
        /* sayfa kapanırken */
      });
    };
  }, [isNew, lockedOut, params.id]);

  function buildPayload(
    f: FormState,
    statusOverride?: ArticleStatus,
  ): Parameters<typeof adminApi.articles.create>[0] {
    const status = statusOverride ?? f.status;
    const durationNum =
      f.videoDuration === "" ? null : Number(f.videoDuration);
    const anyCover = f.coverImage || f.coverImage169 || f.videoPoster || "";
    return {
      title: f.title.trim(),
      headlineTitle: f.headlineTitle.trim() || null,
      slug: f.slug || slugify(f.title),
      excerpt: f.excerpt || null,
      content: f.content,
      contentType: f.contentType,
      coverImage: f.coverImage || f.videoPoster || null,
      coverImage169: f.coverImage169 || f.coverImage || null,
      coverImage11: f.coverImage11 || null,
      galleryImages: f.galleryImages,
      coverAlt: f.coverAlt || (anyCover ? f.title.slice(0, 200) : null),
      coverCredit:
        f.coverCredit ||
        f.sourceAgency ||
        (anyCover ? "Haber Merkezi" : null),
      status,
      categoryId: f.categoryId,
      tagNames: f.tagNames,
      isBreaking: canManset ? f.isBreaking : false,
      breakingUntil:
        canManset && f.isBreaking
          ? fromLocalInput(f.breakingUntil) ||
            new Date(Date.now() + 2 * 3600_000).toISOString()
          : null,
      isFeatured: canManset ? f.isFeatured : false,
      isSideManset: canManset ? f.isSideManset : false,
      isSpotlight: canManset ? f.isSpotlight : false,
      isSponsored: f.isSponsored,
      scheduledAt: fromLocalInput(f.scheduledAt),
      publishedAt: fromLocalInput(f.publishedAt),
      commentsClosed: f.commentsClosed,
      pressAdNo: f.pressAdNo.trim() || null,
      relatedArticleId: f.relatedArticleId.trim() || null,
      redirectUrl: f.redirectUrl.trim() || null,
      updateNote: f.updateNote || null,
      sourceAgency: f.sourceAgency || null,
      metaTitle: f.metaTitle || null,
      metaDescription: f.metaDescription || f.excerpt || null,
      videoProvider: f.videoProvider || null,
      videoId: f.videoId || null,
      videoDuration:
        durationNum != null && !Number.isNaN(durationNum) ? durationNum : null,
      videoPoster: f.videoPoster || null,
      videoOrientation: f.videoOrientation,
      videoTranscript: f.videoTranscript || null,
      videoSource: f.videoSource || null,
      videoIsLive: f.videoIsLive,
      videoLiveEndsAt: fromLocalInput(f.videoLiveEndsAt),
    };
  }

  function validateForm(
    f: FormState,
    opts: { quiet?: boolean; forPublish?: boolean } = {},
  ): string | null {
    const status = f.status;
    if (!f.title.trim() || f.title.trim().length < 3) {
      return "Başlık zorunlu (en az 3 karakter)";
    }
    if (!f.categoryId) return "Kategori seçin";
    if (
      !f.sourceAgency.trim() &&
      (status === "YAYINDA" || opts.forPublish)
    ) {
      return "Haber kaynağı zorunlu (yayın için kaydetmeden önce seçin)";
    }
    if (f.content.trim().length < 10) {
      return opts.quiet
        ? "İçerik kısa — otomatik kayıt atlandı"
        : "Haber içeriği çok kısa (en az birkaç cümle)";
    }
    if (status === "ZAMANLANMIS" && !f.scheduledAt) {
      return "Zamanlanmış yayın için tarih seçin";
    }
    if (
      !publisher &&
      (status === "YAYINDA" ||
        status === "ZAMANLANMIS" ||
        status === "ARSIV")
    ) {
      return "Muhabir yalnızca taslak veya onaya gönderebilir";
    }
    if (
      f.contentType === "video" &&
      (status === "YAYINDA" || status === "ZAMANLANMIS")
    ) {
      if (f.videoTranscript.trim().length < VIDEO_TRANSCRIPT_MIN_CHARS) {
        return `Transkript eksik — en az ${VIDEO_TRANSCRIPT_MIN_CHARS} karakter`;
      }
      if (!f.videoSource.trim()) return "Video kaynak / telif zorunlu";
      if (!f.videoId || !f.videoProvider) return "Video bağlantısını getirin";
    }
    if (!f.publishedAt) return "Tarih zorunlu";
    if (f.redirectUrl.length > 250) {
      return "Yönlendirme en fazla 250 karakter";
    }
    return null;
  }

  async function persist(opts: {
    navigate?: boolean;
    statusOverride?: ArticleStatus;
    quiet?: boolean;
  } = {}): Promise<boolean> {
    if (lockedOut) {
      if (!opts.quiet) setError(lockNote || "Haber kilitli");
      return false;
    }
    const f = formRef.current;
    const status = opts.statusOverride ?? f.status;
    const err = validateForm(
      { ...f, status },
      { quiet: opts.quiet, forPublish: status === "YAYINDA" },
    );
    if (err) {
      if (!opts.quiet) setError(err);
      return false;
    }
    if (savingRef.current) return false;
    const genAtStart = editGenRef.current;
    setSaving(true);
    savingRef.current = true;
    if (!opts.quiet) setError("");

    const payload = buildPayload({ ...f, status }, status);
    try {
      let saved;
      const id = articleIdRef.current;
      if (!id) {
        saved = await adminApi.articles.create({
          ...payload,
          status: opts.quiet ? "TASLAK" : payload.status,
        });
        setArticleId(saved.id);
        articleIdRef.current = saved.id;
        hydratedRef.current = true;
        if (opts.quiet || !opts.navigate) {
          router.replace(`/articles/${saved.id}`);
        }
      } else {
        saved = await adminApi.articles.update(id, payload);
      }
      setLastAutosavedAt(
        saved.lastAutosavedAt
          ? new Date(saved.lastAutosavedAt)
          : new Date(),
      );
      if (editGenRef.current === genAtStart) {
        setDirty(false);
        dirtyRef.current = false;
      }
      if (opts.navigate) {
        if (status === "YAYINDA") {
          router.push(
            `/articles/${saved.id}/done?created=${id ? "0" : "1"}`,
          );
          return true;
        }
        router.push(
          f.contentType === "video"
            ? "/videos"
            : f.contentType === "galeri"
              ? "/galleries"
              : "/articles",
        );
      }
      return true;
    } catch (e) {
      if (!opts.quiet) setError(formatApiError(e));
      return false;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  useEffect(() => {
    const t = window.setInterval(() => {
      if (!dirtyRef.current || savingRef.current || lockedOut) return;
      const f = formRef.current;
      if (!f.title.trim() || f.title.trim().length < 3 || !f.categoryId) return;
      void persist({ quiet: true });
    }, 30_000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedOut]);

  async function pullOembed() {
    if (!form.videoUrl.trim()) return;
    setOembedBusy(true);
    setError("");
    try {
      const meta = await adminApi.articles.oembed(form.videoUrl.trim());
      setForm((f) => ({
        ...f,
        contentType: "video",
        title: f.title || meta.title,
        slug: f.slug || slugify(meta.title),
        coverImage: meta.poster || f.coverImage,
        coverImage169: meta.poster || f.coverImage169,
        coverAlt: f.coverAlt || meta.title.slice(0, 200),
        coverCredit: f.coverCredit || meta.provider,
        videoProvider: meta.provider,
        videoId: meta.videoId,
        videoDuration:
          meta.duration != null ? String(meta.duration) : f.videoDuration,
        videoPoster: meta.poster || f.videoPoster,
        videoOpen: true,
      }));
      setDirty(true);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setOembedBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await persist({ navigate: true });
  }

  async function publishNow() {
    if (!publisher) {
      setError("Yayınlama yetkin yok");
      return;
    }
    update("status", "YAYINDA");
    await persist({ navigate: true, statusOverride: "YAYINDA" });
  }

  function openPreview() {
    const slug = form.slug || slugify(form.title);
    if (!slug) {
      setError("Önizleme için başlık veya adres gerekli");
      return;
    }
    const path = `/haber/${slug}`;
    window.open(
      `/api/preview?path=${encodeURIComponent(path)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const isVideo = form.contentType === "video";
  const isGallery = form.contentType === "galeri";

  async function uploadTo(
    key: "coverImage169" | "coverImage" | "coverImage11",
    file: File | null | undefined,
  ) {
    if (!file) return;
    setUploadingKey(key);
    setError("");
    try {
      const res = await adminApi.media.upload(file, { kind: "haber" });
      update(key, res.url);
      if (key === "coverImage169" && !form.coverImage) {
        update("coverImage", res.url);
      }
      if (!form.coverAlt && form.title) {
        update("coverAlt", form.title.slice(0, 200));
      }
      if (!form.coverCredit) {
        update("coverCredit", form.sourceAgency || "Haber Merkezi");
      }
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setUploadingKey(null);
    }
  }

  function ImageSlot(props: {
    title: string;
    sizeHint: string;
    field: "coverImage169" | "coverImage" | "coverImage11";
  }) {
    const value = form[props.field];
    const busy = uploadingKey === props.field;
    const inputId = `file-${props.field}`;
    return (
      <div className={styles.imageSlot}>
        <span className={styles.imageTitle}>{props.title}</span>
        <span className={styles.imageSize}>{props.sizeHint}</span>
        <div className={styles.imageActions}>
          <label className={styles.fileBtn} htmlFor={inputId}>
            {busy ? "Yükleniyor…" : "Dosya seç"}
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy || saving}
              className={styles.fileInput}
              onChange={(e) => {
                const f = e.target.files?.[0];
                void uploadTo(props.field, f);
                e.target.value = "";
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => update(props.field, "")}
              disabled={busy}
            >
              Kaldır
            </button>
          ) : null}
        </div>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <div className={styles.imagePh} aria-hidden />
        )}
      </div>
    );
  }

  return (
    <AdminShell>
      <form className={styles.page} onSubmit={onSubmit}>
        <header className={styles.toolbar}>
          <div>
            <p className={styles.crumb}>
              <Link href="/dashboard">Başlangıç</Link>
              <span aria-hidden>/</span>
              <Link href="/articles">Haberler</Link>
              <span aria-hidden>/</span>
              <span>
                {isNew ? "Yeni Haber Oluştur" : "Haberi Düzenle"}
              </span>
            </p>
            <h1>{isNew ? "Haberler" : "Haberi düzenle"}</h1>
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(isVideo ? "/videos" : "/articles")
              }
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openPreview()}
              disabled={loading || lockedOut}
            >
              Önizle
            </Button>
            {publisher ? (
              <Button
                type="button"
                variant="secondary"
                loading={saving}
                disabled={loading || lockedOut}
                onClick={() => void publishNow()}
              >
                Yayınla
              </Button>
            ) : null}
            <Button type="submit" loading={saving} disabled={lockedOut}>
              Kaydet
            </Button>
          </div>
        </header>

        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {lockNote ? <p className={styles.warn}>{lockNote}</p> : null}
        {lastAutosavedAt ? (
          <p className={styles.autosave} aria-live="polite">
            Taslak {autosaveAgo} kendiliğinden kaydedildi
            {dirty ? " · kaydedilmemiş değişiklik var" : ""}
          </p>
        ) : dirty ? (
          <p className={styles.autosave} aria-live="polite">
            Kaydedilmemiş değişiklikler — 30 sn içinde otomatik taslak
          </p>
        ) : null}

        <div className={styles.grid}>
          {/* Sol — içerik */}
          <div className={styles.editorCol}>
            <section className={styles.panel}>
              <label className={styles.field}>
                <span>
                  Başlık <em className={styles.req}>*</em>
                  <span className={styles.charCount}>
                    {form.title.length} / 70
                  </span>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 120);
                    const autoSlug = isNew && !articleId;
                    setForm((f) => ({
                      ...f,
                      title: v,
                      slug: autoSlug ? slugify(v) : f.slug,
                    }));
                    if (!skipDirtyRef.current) {
                      editGenRef.current += 1;
                      setDirty(true);
                    }
                  }}
                  required
                  autoComplete="off"
                  disabled={lockedOut}
                />
              </label>

              <label className={styles.field}>
                <span>
                  Manşet başlığı
                  <span className={styles.charCount}>
                    {form.headlineTitle.length} / 70
                  </span>
                </span>
                <input
                  name="headlineTitle"
                  value={form.headlineTitle}
                  onChange={(e) =>
                    update("headlineTitle", e.target.value.slice(0, 120))
                  }
                  placeholder="boşsa asıl başlık"
                  disabled={lockedOut}
                />
              </label>

              <label className={styles.field}>
                <span>Adres</span>
                <div className={styles.slugRow}>
                  <span className={styles.slugPrefix} aria-hidden>
                    /haber/
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    disabled={lockedOut}
                    aria-label="Haber adresi (slug)"
                  />
                </div>
              </label>

              <label className={styles.field}>
                <span>
                  Spot
                  <span className={styles.charCount}>
                    {form.excerpt.length} / 160
                  </span>
                </span>
                <textarea
                  name="excerpt"
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) =>
                    update("excerpt", e.target.value.slice(0, 300))
                  }
                  placeholder="Spot / özet"
                  disabled={lockedOut}
                />
              </label>

              <div className={styles.imageGrid} id="images">
                <ImageSlot
                  title="Manşet / sür manşet"
                  sizeHint="↔ 1200 × ↕ 628 · 16:9"
                  field="coverImage169"
                />
                <ImageSlot
                  title="Detay resmi"
                  sizeHint="↔ 1200 × ↕ 628"
                  field="coverImage"
                />
                <ImageSlot
                  title="Dik / dikey"
                  sizeHint="1:1 veya sosyal"
                  field="coverImage11"
                />
              </div>

              <ArticleGalleryEditor
                images={form.galleryImages}
                onChange={(galleryImages) => {
                  const first = galleryImages[0]?.url || "";
                  setForm((f) => ({
                    ...f,
                    galleryImages,
                    coverImage: first || f.coverImage,
                    coverImage169: first || f.coverImage169,
                  }));
                  editGenRef.current += 1;
                  setDirty(true);
                }}
              />

              <div className={styles.fieldRow2}>
                <label className={styles.field}>
                  <span>Kapak alt metni</span>
                  <input
                    value={form.coverAlt}
                    onChange={(e) => update("coverAlt", e.target.value)}
                    placeholder="Görsel varsa açıklama"
                  />
                </label>
                <label className={styles.field}>
                  <span>Fotoğraf kredisi</span>
                  <input
                    value={form.coverCredit}
                    onChange={(e) => update("coverCredit", e.target.value)}
                    placeholder="Fotoğrafçı / ajans"
                  />
                </label>
              </div>
            </section>

            <section className={styles.panel}>
              <button
                type="button"
                className={styles.disclosure}
                aria-expanded={form.videoOpen}
                onClick={() => update("videoOpen", !form.videoOpen)}
              >
                Video kodu / bağlantı
                <span aria-hidden>{form.videoOpen ? "▾" : "▸"}</span>
              </button>
              {form.videoOpen ? (
                <div className={styles.videoBox}>
                  <div className={styles.oembedRow}>
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => update("videoUrl", e.target.value)}
                      placeholder="YouTube veya Vimeo bağlantısı"
                      aria-label="Video bağlantısı"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={oembedBusy}
                      onClick={() => void pullOembed()}
                    >
                      Getir
                    </Button>
                  </div>
                  {form.videoId ? (
                    <p className={styles.hint}>
                      {form.videoProvider} · {form.videoId}
                      {form.videoDuration
                        ? ` · ${form.videoDuration} sn`
                        : ""}
                    </p>
                  ) : null}
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.contentType === "video"}
                      onChange={(e) =>
                        update(
                          "contentType",
                          e.target.checked ? "video" : "haber",
                        )
                      }
                    />
                    Bu kaydı video içerik olarak işaretle
                  </label>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.contentType === "galeri"}
                      onChange={(e) =>
                        update(
                          "contentType",
                          e.target.checked ? "galeri" : "haber",
                        )
                      }
                    />
                    Bu kaydı foto galeri olarak işaretle
                  </label>
                  {isGallery ? (
                    <p className={styles.hint}>
                      Galeri gövdesine görseller ekleyin (görsel ekle / editör).
                      Arşiv /galleries ve sitede /galeri.
                    </p>
                  ) : null}
                  {isVideo ? (
                    <>
                      <label className={styles.field}>
                        <span>Transkript (yayın için zorunlu)</span>
                        <textarea
                          rows={5}
                          value={form.videoTranscript}
                          onChange={(e) =>
                            update("videoTranscript", e.target.value)
                          }
                        />
                        <span className={styles.hint}>
                          {form.videoTranscript.trim().length} /{" "}
                          {VIDEO_TRANSCRIPT_MIN_CHARS}+ karakter
                        </span>
                      </label>
                      <label className={styles.field}>
                        <span>Video kaynak / telif</span>
                        <input
                          value={form.videoSource}
                          onChange={(e) =>
                            update("videoSource", e.target.value)
                          }
                        />
                      </label>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className={styles.panel} aria-labelledby="body-title">
              <div className={styles.panelHead}>
                <strong id="body-title">Haber İçeriği</strong>
              </div>
              <RichTextEditor
                value={form.content}
                onChange={(html) => update("content", html)}
                disabled={saving}
              />
            </section>

            <section
              className={styles.panel}
              aria-labelledby="extras-title"
            >
              <button
                type="button"
                className={styles.extrasToggle}
                aria-expanded={form.extrasOpen}
                aria-controls="extras-body"
                onClick={() =>
                  setForm((f) => ({ ...f, extrasOpen: !f.extrasOpen }))
                }
              >
                <strong id="extras-title">Ek Özellikler</strong>
                <span aria-hidden>{form.extrasOpen ? "▴" : "▾"}</span>
              </button>
              {form.extrasOpen ? (
                <div id="extras-body" className={styles.extrasGrid}>
                  <div className={styles.extrasRow}>
                    <span className={styles.extrasLabel}>İçerik Ayarları</span>
                    <label className={styles.extrasCheck}>
                      <input
                        type="checkbox"
                        checked={form.commentsClosed}
                        onChange={(e) =>
                          update("commentsClosed", e.target.checked)
                        }
                        disabled={saving}
                      />
                      Yoruma Kapalı
                    </label>
                  </div>
                  <label className={styles.extrasRow}>
                    <span className={styles.extrasLabel}>Basın İlan No</span>
                    <input
                      className={styles.extrasInput}
                      value={form.pressAdNo}
                      onChange={(e) => update("pressAdNo", e.target.value)}
                      maxLength={80}
                      disabled={saving}
                      aria-label="Basın ilan no"
                    />
                  </label>
                  <label className={styles.extrasRow}>
                    <span className={styles.extrasLabel}>İlgili Haber ID</span>
                    <input
                      className={styles.extrasInput}
                      value={form.relatedArticleId}
                      onChange={(e) =>
                        update("relatedArticleId", e.target.value)
                      }
                      maxLength={40}
                      disabled={saving}
                      placeholder="cuid / haber kimliği"
                      aria-label="İlgili haber ID"
                    />
                  </label>
                  <label className={styles.extrasRow}>
                    <span className={styles.extrasLabel}>Yönlendirme</span>
                    <span className={styles.extrasInputWrap}>
                      <input
                        className={styles.extrasInput}
                        value={form.redirectUrl}
                        onChange={(e) =>
                          update(
                            "redirectUrl",
                            e.target.value.slice(0, 250),
                          )
                        }
                        maxLength={250}
                        disabled={saving}
                        placeholder="https://…"
                        aria-label="Yönlendirme URL"
                      />
                      <span
                        className={styles.charBadge}
                        aria-label={`${form.redirectUrl.length} / 250 karakter`}
                      >
                        {250 - form.redirectUrl.length}
                      </span>
                    </span>
                  </label>
                  <label className={styles.extrasRow}>
                    <span className={styles.extrasLabel}>
                      İleri Tarihte Aktif Etme
                    </span>
                    <input
                      className={styles.extrasInput}
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => update("scheduledAt", e.target.value)}
                      disabled={saving}
                      aria-label="İleri tarihte aktif etme"
                    />
                  </label>
                  <label className={styles.extrasRow}>
                    <span className={styles.extrasLabel}>
                      Tarih <em className={styles.req}>*</em>
                    </span>
                    <input
                      className={styles.extrasInput}
                      type="datetime-local"
                      value={form.publishedAt}
                      onChange={(e) => update("publishedAt", e.target.value)}
                      required
                      disabled={saving}
                      aria-label="Haber tarihi"
                    />
                  </label>
                </div>
              ) : null}
            </section>
          </div>

          <aside className={styles.metaCol}>
            <section className={styles.panel}>
              <h2 className={styles.sideTitle}>Yayın</h2>
              <label className={styles.field}>
                <span>Durum</span>
                <select
                  className={styles.select}
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as ArticleStatus)
                  }
                  disabled={lockedOut}
                >
                  <option value="TASLAK">Taslak</option>
                  <option value="ONAYDA">Onayda</option>
                  {publisher ? (
                    <>
                      <option value="ZAMANLANMIS">Zamanlanmış</option>
                      <option value="YAYINDA">Yayında</option>
                      <option value="ARSIV">Arşiv</option>
                    </>
                  ) : null}
                </select>
              </label>
              {form.status === "ZAMANLANMIS" ? (
                <label className={styles.field}>
                  <span>Yayın zamanı</span>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => update("scheduledAt", e.target.value)}
                    disabled={lockedOut}
                  />
                </label>
              ) : null}
              <label className={styles.field}>
                <span>
                  Tarih <em className={styles.req}>*</em>
                </span>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => update("publishedAt", e.target.value)}
                  required
                  disabled={lockedOut}
                />
              </label>
              {user?.name ? (
                <p className={styles.hint}>Yazar: {user.name}</p>
              ) : null}
            </section>

            {canManset ? (
              <>
                <section className={styles.panel}>
                  <h2 className={styles.sideTitle}>Seçenekler</h2>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => update("isFeatured", e.target.checked)}
                      disabled={lockedOut}
                    />
                    Manşete al
                  </label>
                  <p className={styles.hint}>
                    İşaretlenince anasayfa sürgüsünde listelenir (sayı: Manşet
                    ayarları veya Ayarlar → İçerik).
                  </p>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.isSideManset}
                      onChange={(e) =>
                        update("isSideManset", e.target.checked)
                      }
                      disabled={lockedOut}
                    />
                    Sürmanşet
                  </label>
                  <p className={styles.hint}>
                    Anasayfada «Günün seçtikleri» üstünde tablo şeridinde
                    listelenir.
                  </p>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.isSpotlight}
                      onChange={(e) =>
                        update("isSpotlight", e.target.checked)
                      }
                      disabled={lockedOut}
                    />
                    Öne çıkanlar
                  </label>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={!form.commentsClosed}
                      onChange={(e) =>
                        update("commentsClosed", !e.target.checked)
                      }
                      disabled={lockedOut}
                    />
                    Yorumlar açık
                  </label>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.isSponsored}
                      onChange={(e) =>
                        update("isSponsored", e.target.checked)
                      }
                      disabled={lockedOut}
                    />
                    Sponsorlu içerik (zorunlu rozet)
                  </label>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.isBreaking}
                      onChange={(e) => update("isBreaking", e.target.checked)}
                      disabled={lockedOut}
                    />
                    Rozet: Son dakika
                  </label>
                  {form.isBreaking ? (
                    <label className={styles.field}>
                      <span>Son dakika bitiş</span>
                      <input
                        type="datetime-local"
                        value={form.breakingUntil}
                        onChange={(e) =>
                          update("breakingUntil", e.target.value)
                        }
                        disabled={lockedOut}
                      />
                    </label>
                  ) : null}
                </section>
              </>
            ) : (
              <section className={styles.panel}>
                <h2 className={styles.sideTitle}>Seçenekler</h2>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={!form.commentsClosed}
                    onChange={(e) =>
                      update("commentsClosed", !e.target.checked)
                    }
                    disabled={lockedOut}
                  />
                  Yorumlar açık
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.isSponsored}
                    onChange={(e) =>
                      update("isSponsored", e.target.checked)
                    }
                    disabled={lockedOut}
                  />
                  Sponsorlu içerik (zorunlu rozet)
                </label>
                <p className={styles.hint}>
                  Manşet / son dakika bayrakları yalnızca editör ve adminde.
                </p>
              </section>
            )}

            <section className={styles.panel}>
              <h2 className={styles.sideTitle}>
                Haber kaynağı <em className={styles.req}>*</em>
              </h2>
              <select
                className={styles.select}
                value={
                  SOURCE_OPTIONS.includes(
                    form.sourceAgency as (typeof SOURCE_OPTIONS)[number],
                  )
                    ? form.sourceAgency
                    : form.sourceAgency
                      ? "__custom__"
                      : ""
                }
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    update("sourceAgency", form.sourceAgency || " ");
                    return;
                  }
                  update("sourceAgency", e.target.value);
                }}
                aria-label="Haber kaynağı"
              >
                <option value="">Kaynak seçiniz</option>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="__custom__">Diğer…</option>
              </select>
              {!SOURCE_OPTIONS.includes(
                form.sourceAgency as (typeof SOURCE_OPTIONS)[number],
              ) && form.sourceAgency !== "" ? (
                <input
                  className={styles.mt}
                  value={form.sourceAgency.trim() ? form.sourceAgency : ""}
                  onChange={(e) => update("sourceAgency", e.target.value)}
                  placeholder="Özel kaynak adı"
                  aria-label="Özel haber kaynağı"
                />
              ) : null}
            </section>

            <section className={styles.panel}>
              <TagPicker
                value={form.tagNames}
                onChange={(tagNames) => {
                  setForm((f) => ({ ...f, tagNames }));
                  editGenRef.current += 1;
                  setDirty(true);
                }}
                disabled={saving || lockedOut}
              />
            </section>

            <section className={styles.panel} aria-labelledby="cat-title">
              <h2 id="cat-title" className={styles.sideTitle}>
                Kategori <em className={styles.req}>*</em>
              </h2>
              <p className={styles.hint}>
                Yazarak ara veya listeden seç — tek kategori
              </p>
              <div className={styles.catCombo} ref={catBoxRef}>
                <input
                  type="search"
                  className={styles.select}
                  value={catOpen ? catQuery : selectedCatName || catQuery}
                  onChange={(e) => {
                    setCatQuery(e.target.value);
                    setCatOpen(true);
                  }}
                  onFocus={() => {
                    setCatOpen(true);
                    setCatQuery(selectedCatName);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setCatOpen(false);
                      setCatQuery(selectedCatName);
                    }
                    if (e.key === "Enter" && filteredCats[0]) {
                      e.preventDefault();
                      pickCategory(filteredCats[0].id);
                    }
                  }}
                  placeholder="Kategori ara / yaz…"
                  aria-label="Kategori ara ve seç"
                  aria-expanded={catOpen}
                  aria-controls="cat-suggest-list"
                  autoComplete="off"
                  required={!form.categoryId}
                />
                {catOpen ? (
                  <ul
                    id="cat-suggest-list"
                    className={styles.catSuggest}
                    role="listbox"
                  >
                    {filteredCats.map((c) => (
                      <li key={c.id} role="option" aria-selected={form.categoryId === c.id}>
                        <button
                          type="button"
                          className={
                            form.categoryId === c.id
                              ? styles.catSuggestOn
                              : styles.catSuggestBtn
                          }
                          onClick={() => pickCategory(c.id)}
                        >
                          {c.depth ? `↳ ${c.name}` : c.name}
                        </button>
                      </li>
                    ))}
                    {!filteredCats.length ? (
                      <li className={styles.muted}>Eşleşen kategori yok</li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
              {!catRows.length ? (
                <p className={styles.muted}>Kategori yok</p>
              ) : null}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.sideTitle}>Arama motoru</h2>
              <p className={styles.hint}>
                Boş bırakılırsa başlık ve spot kullanılır
              </p>
              <label className={styles.field}>
                <span>Meta başlık</span>
                <input
                  value={form.metaTitle}
                  onChange={(e) => update("metaTitle", e.target.value)}
                  disabled={lockedOut}
                />
              </label>
              <label className={styles.field}>
                <span>Meta açıklama</span>
                <textarea
                  rows={3}
                  value={form.metaDescription}
                  onChange={(e) => update("metaDescription", e.target.value)}
                  disabled={lockedOut}
                />
              </label>
            </section>
          </aside>
        </div>
      </form>
    </AdminShell>
  );
}
