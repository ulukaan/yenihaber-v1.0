"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ApiArticle, ApiCategory } from "@yenihaber/shared";
import {
  VIDEO_TRANSCRIPT_MIN_CHARS,
  formatVideoDurationLabel,
  slugify,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./videos.module.css";

type Tab = "all" | "yayinda" | "taslak" | "canli" | "dikey";

function viewsLabel(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}b`;
  return String(n);
}

export default function VideosPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<ApiArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState({
    all: 0,
    yayinda: 0,
    taslak: 0,
    canli: 0,
    dikey: 0,
  });
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    try {
      const [all, yayinda, taslak, canli, dikey] = await Promise.all([
        adminApi.articles.list({ contentType: "video", status: "all", limit: 1 }),
        adminApi.articles.list({
          contentType: "video",
          status: "YAYINDA",
          limit: 1,
        }),
        adminApi.articles.list({
          contentType: "video",
          status: "TASLAK",
          limit: 1,
        }),
        adminApi.articles.list({
          contentType: "video",
          videoLive: true,
          status: "all",
          limit: 1,
        }),
        adminApi.articles.list({
          contentType: "video",
          videoOrientation: "dikey",
          status: "all",
          limit: 1,
        }),
      ]);
      setCounts({
        all: all.meta.total,
        yayinda: yayinda.meta.total,
        taslak: taslak.meta.total,
        canli: canli.meta.total,
        dikey: dikey.meta.total,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query: Record<string, string | number | boolean> = {
        contentType: "video",
        page,
        limit: 12,
        status: "all",
      };
      if (tab === "yayinda") query.status = "YAYINDA";
      if (tab === "taslak") query.status = "TASLAK";
      if (tab === "canli") query.videoLive = true;
      if (tab === "dikey") query.videoOrientation = "dikey";

      const res = await adminApi.articles.list(query);
      setItems(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void load();
    void loadCounts();
  }, [load, loadCounts]);

  useEffect(() => {
    adminApi.categories.list().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function fetchAndCreate() {
    if (!url.trim()) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      const meta = await adminApi.articles.oembed(url.trim());
      const catId = categories[0]?.id;
      if (!catId) {
        setError("Önce bir kategori oluşturun");
        return;
      }
      const baseSlug = slugify(meta.title) || `video-${meta.videoId}`;
      const article = await adminApi.articles.create({
        title: meta.title.slice(0, 200),
        slug: `${baseSlug}-${Date.now().toString(36).slice(-4)}`,
        excerpt: null,
        content: `<p>${meta.title}</p><p>Video haberi — metni buraya yazın.</p>`,
        contentType: "video",
        coverImage: meta.poster,
        coverAlt: meta.title.slice(0, 200),
        coverCredit: meta.provider,
        status: "TASLAK",
        categoryId: catId,
        tagNames: [],
        videoProvider: meta.provider,
        videoId: meta.videoId,
        videoDuration: meta.duration,
        videoPoster: meta.poster,
        videoOrientation: "yatay",
        videoTranscript: "",
        videoSource: "",
        videoIsLive: false,
      });
      setOk("Video taslağı oluşturuldu — transkript ve telif ekleyin");
      router.push(`/articles/${article.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Getirilemedi");
    } finally {
      setBusy(false);
    }
  }

  const range = useMemo(() => {
    const start = total === 0 ? 0 : (page - 1) * 12 + 1;
    const end = Math.min(page * 12, total);
    return `${start}–${end} / ${total}`;
  }, [page, total]);

  return (
    <AdminShell>
      <AdminPage
        title="Videolar"
        subtitle="YouTube/Vimeo gömme · aynı haber akışı · oEmbed · tembel oynatıcı · transkript zorunlu"
        wide
        actions={
          <AdminButton href="/articles/new?type=video" variant="primary">
            <Plus size={18} aria-hidden />
            Video ekle
          </AdminButton>
        }
      >
        <div className={styles.pasteRow}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube veya Vimeo bağlantısını yapıştırın — başlık, süre ve kapak otomatik gelir"
            aria-label="Video bağlantısı"
            onKeyDown={(e) => {
              if (e.key === "Enter") void fetchAndCreate();
            }}
          />
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={busy || !url.trim()}
            onClick={() => void fetchAndCreate()}
          >
            Getir
          </button>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}

        <div className={styles.tabs} role="tablist">
          {(
            [
              ["all", "Tümü", counts.all],
              ["yayinda", "Yayında", counts.yayinda],
              ["taslak", "Taslak", counts.taslak],
              ["canli", "Canlı", counts.canli],
              ["dikey", "Dikey", counts.dikey],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? styles.tabOn : styles.tab}
              onClick={() => setTab(id)}
            >
              {label} <span>{n}</span>
            </button>
          ))}
        </div>

        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        <div className={styles.grid}>
          {items.map((v) => {
            const poster = v.videoPoster || v.coverImage;
            const dur = formatVideoDurationLabel(v.videoDuration);
            const missing = v.transcriptMissing;
            return (
              <Link
                key={v.id}
                href={`/articles/${v.id}`}
                className={styles.card}
              >
                <div
                  className={
                    v.videoOrientation === "dikey"
                      ? styles.thumbVert
                      : styles.thumb
                  }
                >
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.thumbPh} />
                  )}
                  {v.videoIsLive ? (
                    <span className={styles.badgeLive}>Canlı</span>
                  ) : null}
                  {v.videoOrientation === "dikey" && !v.videoIsLive ? (
                    <span className={styles.badgeVert}>Dikey</span>
                  ) : null}
                  {v.status === "TASLAK" ? (
                    <span className={styles.badgeDraft}>Taslak</span>
                  ) : null}
                  {dur && !v.videoIsLive ? (
                    <span className={styles.duration}>{dur}</span>
                  ) : null}
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{v.title}</h2>
                  {missing ? (
                    <p className={styles.warnLine}>Transkript eksik</p>
                  ) : (
                    <p className={styles.metaLine}>
                      {v.category.name} · {viewsLabel(v.viewCount)} izlenme
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {!loading && !items.length ? (
          <AdminEmpty
            title="Henüz video yok"
            description="Bir YouTube/Vimeo bağlantısı yapıştırın veya «Video ekle» ile başlayın."
          />
        ) : null}

        <footer className={styles.foot}>
          <p className={styles.muted}>
            Kaynak: YouTube / Vimeo gömme · kendi sunucuda barındırma yok ·
            transkript min {VIDEO_TRANSCRIPT_MIN_CHARS} karakter
          </p>
          <span className={styles.muted}>{range}</span>
        </footer>
      </AdminPage>
    </AdminShell>
  );
}
