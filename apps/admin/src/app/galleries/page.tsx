"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus } from "lucide-react";
import type { ApiArticle, ApiCategory } from "@yenihaber/shared";
import { slugify } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./galleries.module.css";

type Tab = "all" | "yayinda" | "taslak";

function countImgs(html: string): number {
  return (html.match(/<img\b/gi) || []).length;
}

/**
 * Foto galeri listesi — contentType=galeri (video sayfasıyla aynı akış).
 */
export default function GalleriesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<ApiArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState({ all: 0, yayinda: 0, taslak: 0 });
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    try {
      const [all, yayinda, taslak] = await Promise.all([
        adminApi.articles.list({ contentType: "galeri", status: "all", limit: 1 }),
        adminApi.articles.list({
          contentType: "galeri",
          status: "YAYINDA",
          limit: 1,
        }),
        adminApi.articles.list({
          contentType: "galeri",
          status: "TASLAK",
          limit: 1,
        }),
      ]);
      setCounts({
        all: all.meta.total,
        yayinda: yayinda.meta.total,
        taslak: taslak.meta.total,
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
        contentType: "galeri",
        page,
        limit: 12,
        status: "all",
      };
      if (tab === "yayinda") query.status = "YAYINDA";
      if (tab === "taslak") query.status = "TASLAK";
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

  async function createGallery() {
    if (!title.trim() || title.trim().length < 3) {
      setError("Başlık en az 3 karakter olmalı");
      return;
    }
    if (!files?.length) {
      setError("En az bir fotoğraf seçin");
      return;
    }
    const catId = categories[0]?.id;
    if (!catId) {
      setError("Önce bir kategori oluşturun");
      return;
    }

    setBusy(true);
    setError("");
    setOk("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const up = await adminApi.media.upload(file, { kind: "haber" });
        urls.push(up.url);
      }
      const figures = urls
        .map(
          (src, i) =>
            `<figure class="yh-gallery-item"><img src="${src}" alt="${title.trim()} — ${i + 1}" loading="lazy" /></figure>`,
        )
        .join("\n");
      const content = `<div class="yh-gallery">${figures}</div><p>${title.trim()} fotoğraf galerisi.</p>`;
      const baseSlug = slugify(title) || `galeri-${Date.now()}`;
      const article = await adminApi.articles.create({
        title: title.trim().slice(0, 200),
        slug: `${baseSlug}-${Date.now().toString(36).slice(-4)}`,
        excerpt: `${urls.length} kare · foto galeri`,
        content,
        contentType: "galeri",
        coverImage: urls[0] ?? null,
        coverAlt: title.trim().slice(0, 200),
        coverCredit: null,
        status: "TASLAK",
        categoryId: catId,
        tagNames: [],
      });
      setOk("Galeri taslağı oluşturuldu");
      router.push(`/articles/${article.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oluşturulamadı");
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
        title="Foto galeri"
        subtitle="Çoklu fotoğraf · aynı haber akışı · sitede /galeri arşivinde ve haber detayında"
        wide
        actions={
          <AdminButton href="/articles/new?type=galeri" variant="primary">
            <Plus size={18} aria-hidden />
            Galeri form
          </AdminButton>
        }
      >
        <div className={styles.createBox}>
          <label className={styles.field}>
            <span>Galeri başlığı</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Düzce’de bahar manzaraları"
              aria-label="Galeri başlığı"
            />
          </label>
          <label className={styles.field}>
            <span>Fotoğraflar</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              aria-label="Galeri fotoğrafları"
            />
          </label>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={busy}
            onClick={() => void createGallery()}
          >
            <ImagePlus size={16} aria-hidden />
            {busy ? "Yükleniyor…" : "Taslak oluştur"}
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
          {items.map((g) => {
            const cover = g.coverImage;
            const n = countImgs(g.content || "");
            return (
              <Link key={g.id} href={`/articles/${g.id}`} className={styles.card}>
                <div className={styles.thumb}>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.thumbPh} />
                  )}
                  {g.status === "TASLAK" ? (
                    <span className={styles.badgeDraft}>Taslak</span>
                  ) : null}
                  {n > 0 ? (
                    <span className={styles.count}>{n} kare</span>
                  ) : null}
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{g.title}</h2>
                  <p className={styles.metaLine}>{g.category.name}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {!loading && !items.length ? (
          <AdminEmpty
            title="Henüz galeri yok"
            description="Yukarıdan fotoğraf seçip ilk galeri taslağınızı oluşturun."
          />
        ) : null}

        <footer className={styles.foot}>
          <p className={styles.muted}>
            Public arşiv: site /galeri · detay haber URL’si ile açılır
          </p>
          <span className={styles.muted}>{range}</span>
        </footer>
      </AdminPage>
    </AdminShell>
  );
}
