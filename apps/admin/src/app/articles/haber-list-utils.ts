import type { ArticleStatus, HaberStatusCounts } from "@yenihaber/shared";
import type { StatusDotTone } from "@yenihaber/ui";

export const EMPTY_COUNTS: HaberStatusCounts = {
  hepsi: 0,
  taslak: 0,
  onayda: 0,
  zamanli: 0,
  yayinda: 0,
  arsiv: 0,
};

export function statusTone(status: ArticleStatus): StatusDotTone {
  if (status === "YAYINDA") return "ok";
  if (status === "ONAYDA") return "warn";
  if (status === "ZAMANLANMIS") return "info";
  return "muted";
}

export function statusLabel(status: ArticleStatus): string {
  if (status === "YAYINDA") return "Yayında";
  if (status === "TASLAK") return "Taslak";
  if (status === "ONAYDA") return "Onayda";
  if (status === "ZAMANLANMIS") return "Zamanlı";
  return "Arşiv";
}

export function authorShort(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length < 2) return name;
  const first = p[0] ?? "";
  const last = p[p.length - 1] ?? "";
  if (!first || !last) return name;
  return `${first[0]}. ${last}`;
}

export function formatViews(n: number): string {
  if (n == null || Number.isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}b`;
  return String(n);
}

/** Liste satırı: gg.aa.yyyy ss:dd */
export function formatWhenFull(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWhen(iso: string | null, fallback: string): string {
  const raw = iso ?? fallback;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startY = new Date(startToday);
  startY.setDate(startY.getDate() - 1);
  if (d >= startToday) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  if (d >= startY) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export type UndoItem = {
  id: string;
  status: ArticleStatus;
  categoryId: string;
  isFeatured: boolean;
};

export type UndoState = {
  message: string;
  items: UndoItem[];
};

export type InlineEdit = {
  id: string;
  field: "title" | "category" | "time";
};
