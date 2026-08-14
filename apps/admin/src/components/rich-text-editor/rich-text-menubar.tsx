"use client";

import { MenuDrop } from "./rich-text-chrome";
import type { EditorActions } from "./rich-text-utils";
import styles from "./rich-text-editor.module.css";

type MenuBarProps = {
  disabled?: boolean;
  mode: "visual" | "html";
  fullscreen: boolean;
  a: EditorActions;
};

/** Üst menü: Dosya … Tablo */
export function EditorMenuBar({ disabled, mode, fullscreen, a }: MenuBarProps) {
  return (
    <div className={styles.menubar} role="menubar" aria-label="Editör menü">
      <MenuDrop
        label="Dosya"
        disabled={disabled}
        items={[
          {
            label: mode === "html" ? "Görsel düzenle" : "Kaynak kodu",
            action: () => a.switchMode(mode === "html" ? "visual" : "html"),
          },
          { label: "Tam ekran", action: () => a.setFullscreen((v) => !v) },
        ]}
      />
      <MenuDrop
        label="Düzenle"
        disabled={disabled}
        items={[
          { label: "Geri al", action: () => a.run("undo") },
          { label: "Yinele", action: () => a.run("redo") },
          { label: "Tümünü seç", action: () => a.run("selectAll") },
          { label: "Biçimi temizle", action: () => a.run("removeFormat") },
          { label: "Bul…", action: () => a.setFindOpen(true) },
        ]}
      />
      <MenuDrop
        label="Görüntüle"
        disabled={disabled}
        items={[
          { label: "Kaynak kodu", action: () => a.switchMode("html") },
          { label: "Görsel", action: () => a.switchMode("visual") },
          {
            label: fullscreen ? "Tam ekrandan çık" : "Tam ekran",
            action: () => a.setFullscreen((v) => !v),
          },
        ]}
      />
      <MenuDrop
        label="Ekle"
        disabled={disabled}
        items={[
          { label: "Bağlantı", action: a.insertLink },
          { label: "Resim (dosya)", action: a.openFile },
          {
            label: "Resim (URL)",
            action: () => {
              const u = window.prompt("Resim URL");
              if (u?.trim()) {
                a.insertHtml(
                  `<p><img src="${u.trim()}" alt="" style="max-width:100%;height:auto" /></p>`,
                );
              }
            },
          },
          { label: "Video", action: a.insertVideo },
          { label: "Tablo", action: a.insertTable },
          {
            label: "Yatay çizgi",
            action: () => a.run("insertHorizontalRule"),
          },
        ]}
      />
      <MenuDrop
        label="Biçim"
        disabled={disabled}
        items={[
          { label: "Kalın", action: () => a.run("bold") },
          { label: "İtalik", action: () => a.run("italic") },
          { label: "Altı çizili", action: () => a.run("underline") },
          { label: "Üstü çizili", action: () => a.run("strikeThrough") },
          {
            label: "Alıntı",
            action: () => a.run("formatBlock", "blockquote"),
          },
          { label: "Kod", action: () => a.run("formatBlock", "pre") },
        ]}
      />
      <MenuDrop
        label="Araçlar"
        disabled={disabled}
        items={[
          {
            label: "Kaynak kodu",
            action: () => a.switchMode(mode === "html" ? "visual" : "html"),
          },
          { label: "Bul", action: () => a.setFindOpen(true) },
        ]}
      />
      <MenuDrop
        label="Tablo"
        disabled={disabled}
        items={[{ label: "Tablo ekle…", action: a.insertTable }]}
      />
    </div>
  );
}
