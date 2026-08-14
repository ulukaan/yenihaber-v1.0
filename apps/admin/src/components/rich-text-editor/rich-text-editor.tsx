"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import {
  EditorPrimaryToolbar,
  EditorSecondaryToolbar,
} from "./rich-text-toolbars";
import { EditorMenuBar } from "./rich-text-menubar";
import {
  buildTableHtml,
  countWords,
  selectionPath,
  youtubeEmbedUrl,
  type EditorActions,
} from "./rich-text-utils";
import styles from "./rich-text-editor.module.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  label?: string;
  onWordCount?: (n: number) => void;
};

/**
 * Haber gövdesi — Haber8 benzeri menü + araç çubuğu + contenteditable
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  label = "Haber gövdesi",
  onWordCount,
}: Props) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlDraft, setHtmlDraft] = useState(value);
  const [busyImg, setBusyImg] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [path, setPath] = useState("p");
  const [findOpen, setFindOpen] = useState(false);
  const [findQ, setFindQ] = useState("");
  const [emoOpen, setEmoOpen] = useState(false);
  const [alignMenu, setAlignMenu] = useState(false);
  const [font, setFont] = useState("");
  const [size, setSize] = useState("3");
  const [block, setBlock] = useState("p");
  const [color, setColor] = useState("#000000");
  const [bg, setBg] = useState("#ffff00");

  const emit = useCallback(
    (html: string) => {
      lastEmitted.current = html;
      onChange(html);
      onWordCount?.(countWords(html));
    },
    [onChange, onWordCount],
  );

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    if (mode === "visual" && ref.current) ref.current.innerHTML = value || "";
    if (mode === "html") setHtmlDraft(value);
    onWordCount?.(countWords(value));
  }, [value, mode, onWordCount]);

  useEffect(() => {
    if (mode === "visual" && ref.current && !ref.current.innerHTML && value) {
      ref.current.innerHTML = value;
    }
    onWordCount?.(countWords(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  function focusEditor() {
    ref.current?.focus();
  }

  function updatePath() {
    setPath(selectionPath(ref.current));
  }

  function run(cmd: string, arg?: string) {
    if (disabled || mode !== "visual") return;
    focusEditor();
    try {
      document.execCommand(cmd, false, arg);
    } catch {
      /* ignore */
    }
    if (ref.current) emit(ref.current.innerHTML);
    updatePath();
  }

  function onInput() {
    if (ref.current) emit(ref.current.innerHTML);
    updatePath();
  }

  function insertHtml(html: string) {
    if (disabled || mode !== "visual") return;
    focusEditor();
    try {
      document.execCommand("insertHTML", false, html);
    } catch {
      /* ignore */
    }
    if (ref.current) emit(ref.current.innerHTML);
  }

  function insertLink() {
    const url = window.prompt("Bağlantı adresi (https://…)");
    if (!url?.trim()) return;
    run("createLink", url.trim());
  }

  function insertVideo() {
    const url = window.prompt("YouTube / Vimeo / video URL");
    if (!url?.trim()) return;
    const embed = youtubeEmbedUrl(url);
    insertHtml(
      `<p><iframe src="${embed}" width="560" height="315" allowfullscreen loading="lazy" title="Video"></iframe></p>`,
    );
  }

  function insertTable() {
    const rows = Number(window.prompt("Satır sayısı", "3") || "0");
    const cols = Number(window.prompt("Sütun sayısı", "3") || "0");
    if (rows < 1 || cols < 1 || rows > 20 || cols > 10) return;
    insertHtml(buildTableHtml(rows, cols));
  }

  async function uploadAndInsert(file: File | null | undefined) {
    if (!file || disabled) return;
    setBusyImg(true);
    try {
      const res = await adminApi.media.upload(file, { kind: "haber" });
      insertHtml(
        `<p><img src="${res.url}" alt="" style="max-width:100%;height:auto" /></p>`,
      );
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Resim yüklenemedi");
    } finally {
      setBusyImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function switchMode(next: "visual" | "html") {
    if (next === mode) return;
    if (next === "html") {
      setHtmlDraft(ref.current?.innerHTML ?? value);
      setMode("html");
    } else {
      const html = htmlDraft;
      lastEmitted.current = html;
      onChange(html);
      setMode("visual");
      requestAnimationFrame(() => {
        if (ref.current) ref.current.innerHTML = html;
      });
      onWordCount?.(countWords(html));
    }
  }

  function findInContent() {
    const q = findQ.trim();
    if (!q) return;
    focusEditor();
    const findFn = (
      window as Window & {
        find?: (a: string, b?: boolean, c?: boolean, d?: boolean) => boolean;
      }
    ).find;
    if (findFn) findFn.call(window, q, false, false, true);
    else window.alert("Bu tarayıcıda bul desteklenmiyor");
  }

  const actions: EditorActions = useMemo(
    () => ({
      run,
      insertLink,
      insertVideo,
      insertTable,
      insertHtml,
      switchMode,
      openFile: () => fileRef.current?.click(),
      setFullscreen,
      setFindOpen,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, mode, htmlDraft, value],
  );

  const words = countWords(mode === "html" ? htmlDraft : value);

  return (
    <div
      className={fullscreen ? styles.wrapFull : styles.wrap}
      data-disabled={disabled || undefined}
    >
      <div className={styles.inlineImageRow}>
        <span className={styles.inlineLabel}>Haber İçi Resim</span>
        <div className={styles.inlineRow}>
          <button
            type="button"
            className={styles.uploadBtn}
            disabled={disabled || busyImg}
            onClick={() => fileRef.current?.click()}
          >
            {busyImg ? "Yükleniyor…" : "Dosya seç"}
          </button>
        </div>
        <p className={styles.dims} aria-label="Önerilen boyut">
          <span>↔ 1200px</span>
          <span>↕ 628px</span>
        </p>
      </div>

      <div className={styles.chrome}>
        <EditorMenuBar
          disabled={disabled}
          mode={mode}
          fullscreen={fullscreen}
          a={actions}
        />
        <EditorPrimaryToolbar
          disabled={disabled}
          busyImg={busyImg}
          font={font}
          size={size}
          block={block}
          color={color}
          bg={bg}
          setFont={setFont}
          setSize={setSize}
          setBlock={setBlock}
          setColor={setColor}
          setBg={setBg}
          alignMenu={alignMenu}
          setAlignMenu={setAlignMenu}
          emoOpen={emoOpen}
          setEmoOpen={setEmoOpen}
          a={actions}
        />
        <EditorSecondaryToolbar
          disabled={disabled}
          mode={mode}
          fullscreen={fullscreen}
          findOpen={findOpen}
          findQ={findQ}
          setFindQ={setFindQ}
          findInContent={findInContent}
          a={actions}
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className={styles.hiddenFile}
          onChange={(e) => void uploadAndInsert(e.target.files?.[0])}
        />

        {mode === "visual" ? (
          <div
            id={id}
            ref={ref}
            className={styles.editor}
            contentEditable={!disabled}
            role="textbox"
            aria-multiline
            aria-label={label}
            data-placeholder="Haber metnini yazın…"
            onInput={onInput}
            onBlur={onInput}
            onKeyUp={updatePath}
            onMouseUp={updatePath}
            suppressContentEditableWarning
          />
        ) : (
          <textarea
            className={styles.htmlSource}
            value={htmlDraft}
            disabled={disabled}
            aria-label={`${label} HTML`}
            onChange={(e) => {
              setHtmlDraft(e.target.value);
              emit(e.target.value);
            }}
            spellCheck={false}
          />
        )}

        <div className={styles.status} aria-live="polite">
          <span className={styles.path}>{path}</span>
          <span>
            {words} kelime{words === 1 ? "" : "ler"}
          </span>
        </div>
      </div>
    </div>
  );
}
