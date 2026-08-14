import type { Dispatch, SetStateAction } from "react";

export type EditorActions = {
  run: (cmd: string, arg?: string) => void;
  insertLink: () => void;
  insertVideo: () => void;
  insertTable: () => void;
  insertHtml: (html: string) => void;
  switchMode: (next: "visual" | "html") => void;
  openFile: () => void;
  setFullscreen: Dispatch<SetStateAction<boolean>>;
  setFindOpen: Dispatch<SetStateAction<boolean>>;
};

export const FONTS = [
  { label: "Sistem Yazı Tipi", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
] as const;

export const SIZES = [
  { label: "10pt", value: "1" },
  { label: "12pt", value: "3" },
  { label: "14pt", value: "4" },
  { label: "18pt", value: "5" },
  { label: "24pt", value: "6" },
] as const;

export const BLOCKS = [
  { label: "Paragraf", value: "p" },
  { label: "Başlık 1", value: "h1" },
  { label: "Başlık 2", value: "h2" },
  { label: "Başlık 3", value: "h3" },
  { label: "Başlık 4", value: "h4" },
  { label: "Ön biçimli", value: "pre" },
] as const;

export const EMOTICONS = [
  "😀",
  "🙂",
  "😂",
  "😍",
  "🔥",
  "👍",
  "❤️",
  "⭐",
  "📰",
  "✅",
] as const;

/** HTML → kelime sayısı */
export function countWords(html: string): number {
  const t = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t ? t.split(" ").filter(Boolean).length : 0;
}

export function selectionPath(root: HTMLElement | null): string {
  const sel = window.getSelection();
  if (!sel?.anchorNode || !root?.contains(sel.anchorNode)) return "p";
  let n: Node | null = sel.anchorNode;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentElement;
  const tags: string[] = [];
  while (n && n !== root) {
    if (n instanceof HTMLElement) tags.unshift(n.tagName.toLowerCase());
    n = n.parentElement;
  }
  return tags.length ? tags.join(" › ") : "p";
}

export function youtubeEmbedUrl(raw: string): string {
  const u = raw.trim();
  const yt =
    u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] ??
    null;
  return yt ? `https://www.youtube.com/embed/${yt}` : u;
}

export function buildTableHtml(rows: number, cols: number): string {
  let html =
    '<table border="1" style="border-collapse:collapse;width:100%"><tbody>';
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += '<td style="padding:6px;min-width:48px"> </td>';
    }
    html += "</tr>";
  }
  return `${html}</tbody></table><p><br></p>`;
}
