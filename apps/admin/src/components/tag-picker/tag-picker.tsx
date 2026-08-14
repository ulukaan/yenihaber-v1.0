"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ApiTag } from "@yenihaber/shared";
import {
  TAG_PER_ARTICLE_MAX,
  TAG_PER_ARTICLE_WARN,
  isTagBlacklisted,
  normalizeTagName,
  stringSimilarity,
  tagSlugFromName,
} from "@yenihaber/shared";
import { adminApi } from "@/lib/api";
import styles from "./tag-picker.module.css";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

/**
 * Editör etiket alanı: otomatik tamamla + benzer uyarı + 7 uyarı / 10 kilit
 */
export function TagPicker({ value, onChange, disabled }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ApiTag[]>([]);
  const [open, setOpen] = useState(false);
  const [similar, setSimilar] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 1) {
      setSuggestions([]);
      setSimilar(null);
      return;
    }
    const t = window.setTimeout(() => {
      void adminApi.tags
        .suggest(query.trim(), 10)
        .then((rows) => {
          setSuggestions(rows.filter((r) => !value.includes(r.name)));
          const qSlug = tagSlugFromName(query);
          const hit = rows.find(
            (r) =>
              r.slug !== qSlug &&
              stringSimilarity(r.slug, qSlug) > 0.6,
          );
          setSimilar(
            hit
              ? `Mevcut benzer: «${hit.name}» — yeni açmak yerine onu seçin`
              : null,
          );
        })
        .catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(t);
  }, [query, value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const locked = value.length >= TAG_PER_ARTICLE_MAX;
  const warn = value.length >= TAG_PER_ARTICLE_WARN;

  function add(raw: string) {
    const name = normalizeTagName(raw);
    if (name.length < 2 || locked) return;
    if (isTagBlacklisted(name)) {
      setSimilar(`«${name}» kara listede — kişi / kurum / olay yazın`);
      return;
    }
    const slug = tagSlugFromName(name);
    if (value.some((v) => tagSlugFromName(v) === slug)) {
      setQuery("");
      return;
    }
    onChange([...value, name]);
    setQuery("");
    setOpen(false);
    setSuggestions([]);
  }

  function remove(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  return (
    <div className={styles.wrap} ref={boxRef}>
      <label className={styles.label} htmlFor={listId}>
        Etiketler
        <span className={styles.helper}>
          3–6 ideal · {value.length}/{TAG_PER_ARTICLE_MAX}
          {warn && !locked ? " — 7+ uyarısı" : ""}
          {locked ? " — kilit (10)" : ""}
        </span>
      </label>
      <div className={styles.chips}>
        {value.map((t) => (
          <button
            key={t}
            type="button"
            className={styles.chip}
            onClick={() => remove(t)}
            disabled={disabled}
            aria-label={`${t} kaldır`}
          >
            {t}
            <span aria-hidden>×</span>
          </button>
        ))}
      </div>
      <input
        id={listId}
        className={styles.input}
        value={query}
        disabled={disabled || locked}
        placeholder={
          locked
            ? "En fazla 10 etiket"
            : "Yazın, öneriden seçin veya Enter"
        }
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (query.trim()) add(query);
          }
          if (e.key === "Backspace" && !query && value.length) {
            remove(value[value.length - 1]!);
          }
        }}
        aria-autocomplete="list"
        aria-expanded={open}
        autoComplete="off"
      />
      {similar ? (
        <p className={styles.warn} role="status">
          {similar}
        </p>
      ) : null}
      {warn ? (
        <p className={styles.warn} role="status">
          Haber başına 3–6 etiket ideal; 10’da kilitlenir.
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul className={styles.suggest} role="listbox">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={styles.suggestBtn}
                onClick={() => add(s.name)}
              >
                <span>{s.name}</span>
                <span className={styles.count}>{s.articleCount ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
