"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ApiComment } from "@yenihaber/shared";
import { createApiClient } from "@yenihaber/api-client";
import styles from "./article-quick-comment.module.css";

const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
});

const NAME_KEY = "yh-comment-name";
const PHRASE_PREFIX = "yh-quick-phrase:";
const MAX = 280;

const PRESETS = [
  "Çok doğru",
  "Katılmıyorum",
  "Dikkat çekici",
  "Teşekkürler",
  "Yazık oldu",
] as const;

export type ArticleQuickCommentProps = {
  articleId: string;
  /** Hassas kategori / bayrak — hızlı yorum gizli */
  disabled?: boolean;
  onPosted?: (comment: ApiComment) => void;
  onOpenDetailed?: () => void;
};

type Phase = "closed" | "open" | "pending";

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

function saveName(name: string) {
  try {
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
  } catch {
    // ignore
  }
}

function usedPhrases(articleId: string): Set<string> {
  try {
    const raw = localStorage.getItem(PHRASE_PREFIX + articleId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markPhrase(articleId: string, phrase: string) {
  const set = usedPhrases(articleId);
  set.add(phrase.trim().toLocaleLowerCase("tr-TR"));
  try {
    localStorage.setItem(
      PHRASE_PREFIX + articleId,
      JSON.stringify([...set]),
    );
  } catch {
    // ignore
  }
}

/**
 * Hızlı yorum — kapalı satır / açık kutu / onay bekliyor (sadece yazana).
 */
export function ArticleQuickComment({
  articleId,
  disabled = false,
  onPosted,
  onOpenDetailed,
}: ArticleQuickCommentProps) {
  const uid = useId();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mine, setMine] = useState<ApiComment | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [editLeft, setEditLeft] = useState(0);

  useEffect(() => {
    setName(loadName());
    setPhase("closed");
    setContent("");
    setMine(null);
    setError("");
  }, [articleId]);

  useEffect(() => {
    if (!mine?.editableUntil) {
      setEditLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(
        0,
        new Date(mine.editableUntil!).getTime() - Date.now(),
      );
      setEditLeft(left);
      if (left <= 0) setEditing(false);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [mine?.editableUntil, mine?.id]);

  const resizeTa = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 160)}px`;
  }, []);

  useEffect(() => {
    if (phase === "open") resizeTa();
  }, [content, phase, resizeTa]);

  function openBox() {
    setPhase("open");
    setError("");
    requestAnimationFrame(() => {
      taRef.current?.focus();
      boxRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function fillPreset(p: string) {
    const used = usedPhrases(articleId);
    if (used.has(p.toLocaleLowerCase("tr-TR"))) {
      setError("Bu ifadeyi bu habere zaten kullandınız.");
      return;
    }
    setContent(p);
    setPhase("open");
    requestAnimationFrame(() => {
      taRef.current?.focus();
      resizeTa();
    });
  }

  async function submit() {
    const text = content.trim();
    if (text.length < 3) {
      setError("En az 3 karakter yazın.");
      return;
    }
    if (text.length > MAX) {
      setError("Hızlı yorum en fazla 280 karakter.");
      return;
    }

    const used = usedPhrases(articleId);
    const key = text.toLocaleLowerCase("tr-TR");
    if (used.has(key) && PRESETS.some((p) => p.toLocaleLowerCase("tr-TR") === key)) {
      setError("Bu ifadeyi bu habere zaten gönderdiniz.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      saveName(name);
      const created = await client.comments.create({
        articleId,
        name: name.trim(),
        content: text,
        isQuick: true,
        website,
        parentId: null,
      });
      markPhrase(articleId, text);
      setMine({
        ...created,
        status: created.status === "ONAYLI" ? "ONAYLI" : "BEKLEMEDE",
      });
      setPhase("pending");
      setContent("");
      onPosted?.(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  async function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    await submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  async function saveEdit() {
    if (!mine || editLeft <= 0) return;
    const text = editDraft.trim();
    if (text.length < 3 || text.length > MAX) {
      setError("3–280 karakter arasında yazın.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await client.comments.editMine(mine.id, {
        content: text,
        website: "",
      });
      setMine(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Düzenlenemedi");
    } finally {
      setSubmitting(false);
    }
  }

  if (disabled) return null;

  if (phase === "pending" && mine) {
    return (
      <div className={styles.wrap} ref={boxRef}>
        <article className={styles.mine} aria-live="polite">
          <div className={styles.mineMeta}>
            <strong>{mine.name}</strong>
            {mine.status !== "ONAYLI" ? (
              <span className={styles.badge}>Onay bekliyor</span>
            ) : (
              <span className={styles.badgeOk}>Yayında</span>
            )}
          </div>
          {editing ? (
            <div className={styles.editBox}>
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value.slice(0, MAX))}
                maxLength={MAX}
                rows={2}
                className={styles.ta}
              />
              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setEditing(false)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className={styles.send}
                  disabled={submitting}
                  onClick={() => void saveEdit()}
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.mineBody}>{mine.content}</p>
          )}
          {editLeft > 0 && !editing ? (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => {
                setEditDraft(mine.content);
                setEditing(true);
              }}
            >
              Düzenle ({Math.ceil(editLeft / 1000)} sn)
            </button>
          ) : null}
          {error ? (
            <p className={styles.err} role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className={styles.again}
            onClick={() => {
              setPhase("closed");
              setMine(null);
            }}
          >
            Başka hızlı yorum yaz
          </button>
        </article>
      </div>
    );
  }

  if (phase === "closed") {
    return (
      <div className={styles.wrap} ref={boxRef}>
        <button
          type="button"
          className={styles.closed}
          onClick={openBox}
          aria-expanded={false}
          aria-controls={`${uid}-form`}
        >
          <span className={styles.closedPlaceholder}>
            Ne düşünüyorsunuz?
          </span>
          <span className={styles.closedHint}>Hızlı yorum</span>
        </button>
        <div className={styles.presets} aria-label="Hazır ifadeler">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.chip}
              onClick={() => fillPreset(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const nearLimit = content.length >= 240;

  return (
    <div className={styles.wrap} ref={boxRef}>
      <form
        id={`${uid}-form`}
        className={styles.form}
        onSubmit={(e) => void onFormSubmit(e)}
      >
        <label className={styles.visuallyHidden} htmlFor={`${uid}-content`}>
          Hızlı yorum
        </label>
        <textarea
          id={`${uid}-content`}
          ref={taRef}
          className={styles.ta}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX))}
          onKeyDown={onKeyDown}
          onFocus={() => {
            boxRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }}
          maxLength={MAX}
          rows={1}
          enterKeyHint="send"
          placeholder="Ne düşünüyorsunuz?"
          required
          minLength={3}
        />

        <div className={styles.toolbar}>
          <label className={styles.nameField}>
            <span>Ad (isteğe bağlı)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              maxLength={80}
              placeholder="Okuyucu"
              autoComplete="nickname"
            />
          </label>
          <span className={styles.counter} aria-live="polite">
            {content.length}/{MAX}
          </span>
          <button
            type="submit"
            className={styles.send}
            disabled={submitting || content.trim().length < 3}
          >
            {submitting ? "…" : "Gönder"}
          </button>
        </div>

        <div className={styles.presets} aria-label="Hazır ifadeler">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.chip}
              onClick={() => fillPreset(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {nearLimit ? (
          <p className={styles.limitHint}>
            Daha uzun yazmak için{" "}
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => onOpenDetailed?.()}
            >
              Detaylı yorum yaz
            </button>
          </p>
        ) : null}

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

        {error ? (
          <p className={styles.err} role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
