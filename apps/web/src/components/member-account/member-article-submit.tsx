"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ARTICLE_STATUS_LABELS,
  type ApiArticle,
  type ApiCategory,
  type ArticleStatus,
} from "@yenihaber/shared";
import { clientApi } from "@/lib/client-api";
import styles from "./member-submit.module.css";

/** Üye haber gönder formu + liste */
export function MemberArticleSubmitPanel() {
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [mine, setMine] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [coverCredit, setCoverCredit] = useState("");

  async function loadMine() {
    try {
      const res = await clientApi.articles.mine({ limit: 30 });
      setMine(res.data);
    } catch {
      setMine([]);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [categories] = await Promise.all([
          clientApi.categories.list(),
          loadMine(),
        ]);
        if (cancelled) return;
        const flat = flattenCategories(categories);
        setCats(flat);
        if (flat[0] && !categoryId) setCategoryId(flat[0].id);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Yüklenemedi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setSubmitting(true);
    try {
      await clientApi.articles.memberSubmit({
        title,
        content,
        excerpt: excerpt || undefined,
        categoryId,
        coverImage: coverImage || undefined,
        coverAlt: coverAlt || undefined,
        coverCredit: coverCredit || undefined,
      });
      setOk(
        "Haberiniz editör onayına gönderildi. Onaylanınca yayına alınır ve size e-posta gider.",
      );
      setTitle("");
      setContent("");
      setExcerpt("");
      setCoverImage("");
      setCoverAlt("");
      setCoverCredit("");
      await loadMine();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.card} aria-label="Haber gönderme formu">
        <p className={styles.cardHead}>
          Metniniz doğrudan sitede görünmez. Editör onayından sonra yayınlanır;
          yayınlandığında e-postanıza bildirim gider.
        </p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span>Başlık</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={8}
              maxLength={200}
              required
              placeholder="Haber başlığı"
            />
          </label>

          <label className={styles.field}>
            <span>Kategori</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={!cats.length}
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Metin</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={80}
              rows={12}
              placeholder="Haber metninizi yazın. Paragrafları boş satırla ayırın."
            />
          </label>

          <label className={styles.field}>
            <span>Kısa özet (isteğe bağlı)</span>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Liste ve sosyal paylaşım için kısa özet"
            />
          </label>

          <details className={styles.details}>
            <summary>Kapak görseli (isteğe bağlı)</summary>
            <div className={styles.form}>
              <label className={styles.field}>
                <span>Görsel URL</span>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <label className={styles.field}>
                <span>Alt metin</span>
                <input
                  value={coverAlt}
                  onChange={(e) => setCoverAlt(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Kaynak / kredi</span>
                <input
                  value={coverCredit}
                  onChange={(e) => setCoverCredit(e.target.value)}
                />
              </label>
            </div>
          </details>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          {ok ? (
            <p className={styles.ok} role="status">
              {ok}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submit}
            disabled={submitting || loading}
          >
            {submitting ? "Gönderiliyor…" : "Onaya gönder"}
          </button>
        </form>
      </section>

      <section className={styles.card} aria-labelledby="mine-heading">
        <h2 id="mine-heading" className={styles.listTitle}>
          Gönderdiğim haberler
        </h2>
        {loading ? (
          <p className={styles.hint}>Yükleniyor…</p>
        ) : mine.length === 0 ? (
          <p className={styles.hint}>Henüz gönderilmiş haber yok.</p>
        ) : (
          <ul className={styles.list}>
            {mine.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.title}</strong>
                  <span className={styles.meta}>
                    {statusLabel(a.status as ArticleStatus)}
                    {a.category?.name ? ` · ${a.category.name}` : ""}
                  </span>
                </div>
                {a.status === "YAYINDA" ? (
                  <Link href={`/haber/${a.slug}`} className={styles.link}>
                    Görüntüle
                  </Link>
                ) : (
                  <span className={styles.badge}>
                    {statusLabel(a.status as ArticleStatus)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function statusLabel(s: ArticleStatus): string {
  return ARTICLE_STATUS_LABELS[s] ?? s;
}

function flattenCategories(rows: ApiCategory[]): ApiCategory[] {
  const out: ApiCategory[] = [];
  function walk(list: ApiCategory[], depth: number) {
    for (const c of list) {
      out.push({
        ...c,
        name: depth ? `${"— ".repeat(depth)}${c.name}` : c.name,
      });
      if (c.children?.length) walk(c.children as ApiCategory[], depth + 1);
    }
  }
  walk(rows, 0);
  return out;
}
