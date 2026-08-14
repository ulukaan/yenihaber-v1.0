"use client";

import { API_BASE } from "@/lib/public-env";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { ApiComment } from "@yenihaber/shared";
import { createApiClient } from "@yenihaber/api-client";
import { ArticleQuickComment } from "./article-quick-comment";
import styles from "./article-comments.module.css";

const client = createApiClient({
  baseUrl: API_BASE,
});

const NAME_KEY = "yh-comment-name";

export type ArticleCommentsProps = {
  articleId: string;
  initialCount?: number;
  /** Kategori slug — hızlı yorum hassas kapatma */
  categorySlug?: string;
  /** Admin bayrağı: kategori.disableQuickComment */
  disableQuickComment?: boolean;
  /** Haber: Yoruma Kapalı */
  commentsClosed?: boolean;
  /** Kategori geneli yorum */
  categoryCommentsEnabled?: boolean;
  /** Sonsuz akış sonraki haberler — kapalı başlar */
  startCollapsed?: boolean;
};

/**
 * Yorumlar: hızlı yorum (3 hal) + detaylı form + lazy onaylı liste.
 */
export function ArticleComments({
  articleId,
  initialCount = 0,
  categorySlug = "",
  disableQuickComment = false,
  commentsClosed = false,
  categoryCommentsEnabled = true,
  startCollapsed = false,
}: ArticleCommentsProps) {
  const formId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const detailedRef = useRef<HTMLFormElement | null>(null);
  const [expanded, setExpanded] = useState(!startCollapsed);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiComment[]>([]);
  const [pendingMine, setPendingMine] = useState<ApiComment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [highlightDetailed, setHighlightDetailed] = useState(false);

  const fullyClosed = commentsClosed || categoryCommentsEnabled === false;

  const quickOff =
    fullyClosed ||
    disableQuickComment ||
    /(asayis|asayiş|olum|ölüm|cinayet|secim|seçim|teror|terör)/i.test(
      categorySlug,
    );

  useEffect(() => {
    setCount(initialCount);
    setPendingMine([]);
    try {
      setName(localStorage.getItem(NAME_KEY) || "");
    } catch {
      setName("");
    }
  }, [initialCount, articleId]);

  useEffect(() => {
    setExpanded(!startCollapsed);
    setOpen(false);
  }, [articleId, startCollapsed]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || open || !expanded) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOpen(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open, articleId, expanded]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void client.comments
      .public(articleId)
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        const n =
          rows.reduce((acc, r) => acc + 1 + (r.replies?.length ?? 0), 0) ||
          initialCount;
        setCount(n);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, articleId, initialCount]);

  const openDetailed = useCallback(() => {
    setHighlightDetailed(true);
    requestAnimationFrame(() => {
      detailedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      const ta = detailedRef.current?.querySelector("textarea");
      ta?.focus();
    });
  }, []);

  function onQuickPosted(c: ApiComment) {
    if (c.status === "ONAYLI") {
      setItems((prev) => [c, ...prev.filter((x) => x.id !== c.id)]);
      setCount((n) => n + 1);
    } else {
      setPendingMine((prev) => [c, ...prev.filter((x) => x.id !== c.id)]);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const displayName = name.trim();
      try {
        if (displayName) localStorage.setItem(NAME_KEY, displayName);
      } catch {
        // ignore
      }
      const created = await client.comments.create({
        articleId,
        name: displayName,
        content: content.trim(),
        parentId: replyTo,
        website,
        isQuick: false,
      });
      setPendingMine((prev) => [created, ...prev]);
      setMessage(
        created.status === "ONAYLI"
          ? "Yorumunuz yayınlandı."
          : "Yorumunuz alındı. Onay sonrası herkese görünür.",
      );
      setContent("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  function renderComment(c: ApiComment, isMinePending = false) {
    return (
      <li
        key={c.id}
        className={isMinePending ? styles.itemMine : styles.item}
      >
        <div className={styles.meta}>
          <strong>{c.name}</strong>
          {isMinePending && c.status !== "ONAYLI" ? (
            <span className={styles.pendingBadge}>Onay bekliyor</span>
          ) : null}
          <time dateTime={c.createdAt}>
            {new Date(c.createdAt).toLocaleString("tr-TR", {
              timeZone: "Europe/Istanbul",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <p className={styles.body}>{c.content}</p>
        {!isMinePending && !fullyClosed ? (
          <button
            type="button"
            className={styles.replyBtn}
            onClick={() => {
              setReplyTo(c.id);
              openDetailed();
            }}
          >
            Yanıtla
          </button>
        ) : null}
        {c.replies && c.replies.length > 0 ? (
          <ul className={styles.replies}>
            {c.replies.map((r) => (
              <li key={r.id}>
                <div className={styles.meta}>
                  <strong>{r.name}</strong>
                  <time dateTime={r.createdAt}>
                    {new Date(r.createdAt).toLocaleString("tr-TR", {
                      timeZone: "Europe/Istanbul",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className={styles.body}>{r.content}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <section
      ref={rootRef}
      className={styles.wrap}
      aria-labelledby={`${formId}-title`}
    >
      {!expanded ? (
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => {
            setExpanded(true);
            setOpen(true);
          }}
          aria-label={`${count} yorumu göster`}
        >
          {count > 0 ? `${count} yorum` : "Yorumları göster"}
        </button>
      ) : (
        <>
      <header className={styles.head}>
        <h2 id={`${formId}-title`}>
          Yorumlar
          {count > 0 ? (
            <span className={styles.badge}>{count}</span>
          ) : null}
        </h2>
        {fullyClosed ? (
          <p className={styles.note}>
            Bu haber yorumlara kapatılmıştır. Mevcut onaylı yorumlar görüntülenir.
          </p>
        ) : (
          <p className={styles.note}>
            Hızlı yorum refleks içindir (280 karakter). Uzun metin için detaylı
            formu kullanın.
          </p>
        )}
      </header>

      {fullyClosed ? null : (
        <ArticleQuickComment
          articleId={articleId}
          disabled={quickOff}
          onPosted={onQuickPosted}
          onOpenDetailed={openDetailed}
        />
      )}

      {!fullyClosed && quickOff ? (
        <p className={styles.quickOff}>
          Bu kategoride hızlı yorum kapalıdır.
        </p>
      ) : null}

      {!open ? (
        <p className={styles.placeholder} aria-hidden>
          {count > 0
            ? `${count} onaylı yorum — kaydırdıkça yüklenir`
            : "Yorumlar kaydırdıkça yüklenir"}
        </p>
      ) : null}

      {open && loading ? (
        <p className={styles.placeholder}>Yorumlar yükleniyor…</p>
      ) : null}

      {open && !loading ? (
        <ul className={styles.list}>
          {pendingMine.map((c) => renderComment(c, true))}
          {items.length === 0 && pendingMine.length === 0 ? (
            <li className={styles.empty}>
              {fullyClosed
                ? "Bu haber yorumlara kapalı."
                : "Henüz onaylı yorum yok. Ne düşünüyorsunuz?"}
            </li>
          ) : null}
          {items.map((c) => renderComment(c, false))}
        </ul>
      ) : null}

      {fullyClosed ? null : (
      <form
        ref={detailedRef}
        id={`${formId}-detailed`}
        className={`${styles.form} ${highlightDetailed ? styles.formFocus : ""}`}
        onSubmit={(e) => void onSubmit(e)}
      >
        <h3 className={styles.formTitle}>Detaylı yorum</h3>
        {replyTo ? (
          <p className={styles.replying}>
            Bir yoruma yanıt yazıyorsunuz.{" "}
            <button type="button" onClick={() => setReplyTo(null)}>
              İptal
            </button>
          </p>
        ) : null}

        <label className={styles.field}>
          <span>Adınız (isteğe bağlı)</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="nickname"
            placeholder="Boş bırakırsanız «Okuyucu»"
          />
        </label>

        <label className={styles.field}>
          <span>Yorumunuz</span>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={3}
            maxLength={2000}
            rows={4}
            placeholder="Düşüncelerinizi yazın…"
          />
        </label>

        <label className={styles.hp} aria-hidden tabIndex={-1}>
          Website
          <input
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>

        <p className={styles.kvkk}>
          Göndererek{" "}
          <Link href="/kvkk">KVKK aydınlatma metnini</Link> okuduğunuzu kabul
          edersiniz. Giriş zorunlu değildir. E-posta istemiyoruz.
        </p>

        {message ? <p className={styles.ok}>{message}</p> : null}
        {error ? (
          <p className={styles.err} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={styles.submit}
          disabled={submitting}
        >
          {submitting ? "Gönderiliyor…" : "Yorumu gönder"}
        </button>
      </form>
      )}
        </>
      )}
    </section>
  );
}
