"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { ApiArticle } from "@yenihaber/shared";
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { adminApi } from "@/lib/api";
import styles from "./page.module.css";

const WEB_URL = (
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Yayın sonrası — kurumsal başarı özeti + sonraki adımlar
 */
export default function ArticlePublishedDonePage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const created = search.get("created") === "1";
  const [article, setArticle] = useState<ApiArticle | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cacheMsg, setCacheMsg] = useState("");
  const [cacheBusy, setCacheBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi.articles
      .getById(params.id)
      .then((a) => {
        if (!cancelled) setArticle(a);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Haber yüklenemedi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const publicUrl = article
    ? `${WEB_URL}/haber/${article.slug}`
    : WEB_URL;
  const shareText = article?.title ?? "Haber";
  const encUrl = encodeURIComponent(publicUrl);
  const encText = encodeURIComponent(shareText);
  const headline = created
    ? "Haber yayına alındı"
    : "Haber güncellendi ve yayında";
  const successLine = created
    ? "İçerik başarıyla yayınlandı."
    : "Değişiklikler sitede görünür hale geldi.";

  async function refreshCache() {
    if (!article) return;
    setCacheBusy(true);
    setCacheMsg("");
    try {
      await adminApi.articles.revalidate(article.id);
      setCacheMsg("Önbellek yenileme sinyali gönderildi.");
    } catch (e) {
      setCacheMsg(
        e instanceof Error ? e.message : "Önbellek yenilenemedi",
      );
    } finally {
      setCacheBusy(false);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AdminShell>
      <div className={styles.page}>
        <header className={styles.head}>
          <p className={styles.crumb}>
            <Link href="/dashboard">Başlangıç</Link>
            <span aria-hidden>/</span>
            <Link href="/articles">Haberler</Link>
            <span aria-hidden>/</span>
            <span>Yayın özeti</span>
          </p>
          <div className={styles.headRow}>
            <h1 className={styles.pageTitle}>Haberler</h1>
            <Link href="/articles/new" className={styles.primaryCta}>
              <Plus size={16} aria-hidden />
              Yeni haber
            </Link>
          </div>
        </header>

        {loading ? (
          <p className={styles.muted}>Yükleniyor…</p>
        ) : error ? (
          <p className={styles.err} role="alert">
            {error}
          </p>
        ) : article ? (
          <div className={styles.card}>
            <div className={styles.body}>
              <div className={styles.mainCol}>
                <div className={styles.successBar} role="status">
                  <span className={styles.successIcon} aria-hidden>
                    <Check size={18} strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className={styles.successTitle}>{headline}</p>
                    <p className={styles.successSub}>{successLine}</p>
                  </div>
                </div>

                <article className={styles.hero}>
                  {article.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.coverImage}
                      alt=""
                      className={styles.cover}
                    />
                  ) : (
                    <div className={styles.coverPh} aria-hidden />
                  )}
                  <div className={styles.heroBody}>
                    <div className={styles.meta}>
                      <span className={styles.cat}>{article.category.name}</span>
                      {article.publishedAt ? (
                        <time dateTime={article.publishedAt}>
                          {new Date(article.publishedAt).toLocaleString(
                            "tr-TR",
                            {
                              timeZone: "Europe/Istanbul",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </time>
                      ) : null}
                    </div>
                    <h2 className={styles.title}>{article.title}</h2>
                    <p className={styles.excerpt}>
                      {article.excerpt?.trim() ||
                        stripHtml(article.content).slice(0, 220) ||
                        "—"}
                    </p>
                    <div className={styles.heroActions}>
                      <a
                        href={publicUrl}
                        className={styles.btnPrimary}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={16} aria-hidden />
                        Sitede görüntüle
                      </a>
                      <Link
                        href={`/articles/${article.id}`}
                        className={styles.btnGhost}
                      >
                        <Pencil size={16} aria-hidden />
                        Düzenle
                      </Link>
                    </div>
                  </div>
                </article>
              </div>

              <aside className={styles.sideCol} aria-labelledby="next-steps">
                <section className={styles.section}>
                  <h3 id="next-steps" className={styles.sectionTitle}>
                    Sonraki adımlar
                  </h3>
                  <div className={styles.actions}>
                    <div className={styles.shareBlock}>
                      <div className={styles.shareHead}>
                        <Share2 size={16} aria-hidden />
                        <span>Sosyal paylaşım</span>
                      </div>
                      <div className={styles.shareIcons}>
                        <a
                          className={styles.fb}
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook’ta paylaş"
                        >
                          Facebook
                        </a>
                        <a
                          className={styles.x}
                          href={`https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="X’te paylaş"
                        >
                          X
                        </a>
                        <a
                          className={styles.wa}
                          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${publicUrl}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="WhatsApp’ta paylaş"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className={styles.tileGrid}>
                      <Link
                        href={`/articles/${article.id}#images`}
                        className={styles.tile}
                      >
                        <span className={styles.tileIcon}>
                          <ImageIcon size={18} aria-hidden />
                        </span>
                        <span className={styles.tileLabel}>Görseller</span>
                        <span className={styles.tileHint}>Kapak alanları</span>
                      </Link>
                      <Link href="/articles/new" className={styles.tile}>
                        <span className={styles.tileIcon}>
                          <Plus size={18} aria-hidden />
                        </span>
                        <span className={styles.tileLabel}>Yeni haber</span>
                        <span className={styles.tileHint}>Boş form</span>
                      </Link>
                      <Link href="/articles" className={styles.tile}>
                        <span className={styles.tileIcon}>
                          <LayoutGrid size={18} aria-hidden />
                        </span>
                        <span className={styles.tileLabel}>Tüm haberler</span>
                        <span className={styles.tileHint}>Listeye dön</span>
                      </Link>
                      <button
                        type="button"
                        className={styles.tile}
                        disabled={cacheBusy}
                        onClick={() => void refreshCache()}
                      >
                        <span className={styles.tileIcon}>
                          <RefreshCw
                            size={18}
                            aria-hidden
                            className={cacheBusy ? styles.spin : undefined}
                          />
                        </span>
                        <span className={styles.tileLabel}>
                          {cacheBusy ? "Yenileniyor…" : "Önbellek"}
                        </span>
                        <span className={styles.tileHint}>Site önbelleği</span>
                      </button>
                    </div>
                  </div>
                  {cacheMsg ? (
                    <p className={styles.cacheNote} role="status">
                      {cacheMsg}
                    </p>
                  ) : null}
                </section>
              </aside>
            </div>

            <div className={styles.urlBar}>
              <span className={styles.urlLabel}>Yayın adresi</span>
              <a
                href={publicUrl}
                className={styles.urlLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {publicUrl}
              </a>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => void copyUrl()}
                aria-label="Adresi kopyala"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
