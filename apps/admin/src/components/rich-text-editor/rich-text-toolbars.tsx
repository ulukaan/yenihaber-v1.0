"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  RemoveFormatting,
  Search,
  Smile,
  Table,
  Type,
  Video,
} from "lucide-react";
import { ToolBtn } from "./rich-text-chrome";
import {
  BLOCKS,
  EMOTICONS,
  FONTS,
  SIZES,
  type EditorActions,
} from "./rich-text-utils";
import styles from "./rich-text-editor.module.css";

type PrimaryProps = {
  disabled?: boolean;
  busyImg?: boolean;
  font: string;
  size: string;
  block: string;
  color: string;
  bg: string;
  setFont: (v: string) => void;
  setSize: (v: string) => void;
  setBlock: (v: string) => void;
  setColor: (v: string) => void;
  setBg: (v: string) => void;
  alignMenu: boolean;
  setAlignMenu: Dispatch<SetStateAction<boolean>>;
  emoOpen: boolean;
  setEmoOpen: Dispatch<SetStateAction<boolean>>;
  a: EditorActions;
};

/** Ana biçim araç çubuğu */
export function EditorPrimaryToolbar(p: PrimaryProps) {
  const { a, disabled } = p;
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Biçim">
      <ToolBtn title="Kalın" disabled={disabled} onClick={() => a.run("bold")}>
        <Bold size={15} strokeWidth={2.5} />
      </ToolBtn>
      <ToolBtn
        title="İtalik"
        disabled={disabled}
        onClick={() => a.run("italic")}
      >
        <Italic size={15} />
      </ToolBtn>
      <div className={styles.colorWrap} title="Yazı rengi">
        <Type size={14} aria-hidden />
        <input
          type="color"
          className={styles.colorInput}
          value={p.color}
          disabled={disabled}
          aria-label="Yazı rengi"
          onChange={(e) => {
            p.setColor(e.target.value);
            a.run("foreColor", e.target.value);
          }}
        />
      </div>
      <div className={styles.colorWrap} title="Arka plan">
        <Highlighter size={14} aria-hidden />
        <input
          type="color"
          className={styles.colorInput}
          value={p.bg}
          disabled={disabled}
          aria-label="Arka plan rengi"
          onChange={(e) => {
            p.setBg(e.target.value);
            a.run("hiliteColor", e.target.value);
          }}
        />
      </div>
      <ToolBtn
        title="Biçimi temizle"
        disabled={disabled}
        onClick={() => a.run("removeFormat")}
      >
        <RemoveFormatting size={15} />
      </ToolBtn>
      <span className={styles.sep} aria-hidden />
      <select
        className={styles.select}
        value={p.font}
        disabled={disabled}
        aria-label="Yazı tipi"
        onChange={(e) => {
          p.setFont(e.target.value);
          if (e.target.value) a.run("fontName", e.target.value);
        }}
      >
        {FONTS.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        className={styles.selectSm}
        value={p.size}
        disabled={disabled}
        aria-label="Yazı boyutu"
        onChange={(e) => {
          p.setSize(e.target.value);
          a.run("fontSize", e.target.value);
        }}
      >
        {SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        className={styles.select}
        value={p.block}
        disabled={disabled}
        aria-label="Blok biçimi"
        onChange={(e) => {
          p.setBlock(e.target.value);
          a.run("formatBlock", e.target.value);
        }}
      >
        {BLOCKS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
      <div className={styles.alignGroup}>
        <ToolBtn
          title="Hizalama"
          disabled={disabled}
          onClick={() => p.setAlignMenu((v) => !v)}
        >
          <AlignLeft size={15} />
        </ToolBtn>
        {p.alignMenu ? (
          <div className={styles.alignMenu}>
            <ToolBtn
              title="Sola"
              onClick={() => {
                a.run("justifyLeft");
                p.setAlignMenu(false);
              }}
            >
              <AlignLeft size={15} />
            </ToolBtn>
            <ToolBtn
              title="Ortala"
              onClick={() => {
                a.run("justifyCenter");
                p.setAlignMenu(false);
              }}
            >
              <AlignCenter size={15} />
            </ToolBtn>
            <ToolBtn
              title="Sağa"
              onClick={() => {
                a.run("justifyRight");
                p.setAlignMenu(false);
              }}
            >
              <AlignRight size={15} />
            </ToolBtn>
            <ToolBtn
              title="İki yana"
              onClick={() => {
                a.run("justifyFull");
                p.setAlignMenu(false);
              }}
            >
              <AlignJustify size={15} />
            </ToolBtn>
          </div>
        ) : null}
      </div>
      <span className={styles.sep} aria-hidden />
      <div className={styles.alignGroup}>
        <ToolBtn
          title="İfade"
          disabled={disabled}
          onClick={() => p.setEmoOpen((v) => !v)}
        >
          <Smile size={15} />
        </ToolBtn>
        {p.emoOpen ? (
          <div className={styles.emoMenu} role="listbox">
            {EMOTICONS.map((em) => (
              <button
                key={em}
                type="button"
                className={styles.emoBtn}
                onMouseDown={(e) => {
                  e.preventDefault();
                  a.insertHtml(em);
                  p.setEmoOpen(false);
                }}
              >
                {em}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <ToolBtn
        title="Resim"
        disabled={disabled || p.busyImg}
        onClick={a.openFile}
      >
        <ImageIcon size={15} />
      </ToolBtn>
      <ToolBtn title="Video" disabled={disabled} onClick={a.insertVideo}>
        <Video size={15} />
      </ToolBtn>
      <ToolBtn
        title="Alıntı"
        disabled={disabled}
        onClick={() => a.run("formatBlock", "blockquote")}
      >
        <Quote size={15} />
      </ToolBtn>
      <ToolBtn title="Bağlantı" disabled={disabled} onClick={a.insertLink}>
        <Link2 size={15} />
      </ToolBtn>
      <ToolBtn
        title="Numaralı liste"
        disabled={disabled}
        onClick={() => a.run("insertOrderedList")}
      >
        <ListOrdered size={15} />
      </ToolBtn>
      <ToolBtn
        title="Madde listesi"
        disabled={disabled}
        onClick={() => a.run("insertUnorderedList")}
      >
        <List size={15} />
      </ToolBtn>
      <ToolBtn title="Tablo" disabled={disabled} onClick={a.insertTable}>
        <Table size={15} />
      </ToolBtn>
    </div>
  );
}

type SecProps = {
  disabled?: boolean;
  mode: "visual" | "html";
  fullscreen: boolean;
  findOpen: boolean;
  findQ: string;
  setFindQ: (v: string) => void;
  findInContent: () => void;
  a: EditorActions;
};

/** Bul / kaynak / tam ekran */
export function EditorSecondaryToolbar(p: SecProps) {
  const { a, disabled, mode } = p;
  return (
    <div className={styles.toolbar2} role="toolbar" aria-label="Araçlar">
      <ToolBtn
        title="Bul"
        disabled={disabled}
        onClick={() => a.setFindOpen((v) => !v)}
      >
        <Search size={15} />
      </ToolBtn>
      <ToolBtn
        title="Kaynak kodu"
        disabled={disabled}
        active={mode === "html"}
        onClick={() => a.switchMode(mode === "html" ? "visual" : "html")}
      >
        <Code2 size={15} />
      </ToolBtn>
      <ToolBtn
        title={p.fullscreen ? "Tam ekrandan çık" : "Tam ekran"}
        disabled={disabled}
        active={p.fullscreen}
        onClick={() => a.setFullscreen((v) => !v)}
      >
        {p.fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </ToolBtn>
      {p.findOpen ? (
        <div className={styles.findBar}>
          <input
            className={styles.findInput}
            value={p.findQ}
            onChange={(e) => p.setFindQ(e.target.value)}
            placeholder="Bul…"
            aria-label="Metin ara"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                p.findInContent();
              }
            }}
          />
          <button
            type="button"
            className={styles.findGo}
            onClick={p.findInContent}
          >
            Ara
          </button>
        </div>
      ) : null}
    </div>
  );
}
