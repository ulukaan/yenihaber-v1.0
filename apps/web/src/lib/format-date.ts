/**
 * Tek tarih biçimleyici — tüm sitede buradan geçsin.
 *
 * Kural:
 * - 24 saatten yeniyse göreli ("3 saat önce", "18 dk önce")
 * - daha eskiyse tam tarih ("12 Ağustos 2026")
 * - legal: hukuki satır (saat dahil)
 * - short: kart/liste (gün + ay, saat yok)
 */

const TZ = "Europe/Istanbul";

export type TarihModu = "auto" | "relative" | "absolute" | "legal" | "short";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function absoluteLong(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function absoluteLegal(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function absoluteShort(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function relative(d: Date, now = Date.now()): string {
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return absoluteLong(d);
}

/**
 * Site geneli tarih — varsayılan `auto` (24 saat kuralı).
 */
export function tarihBicimle(
  value: string | Date | null | undefined,
  mode: TarihModu = "auto",
): string {
  const d = toDate(value);
  if (!d) return "";

  switch (mode) {
    case "relative":
      return relative(d);
    case "absolute":
      return absoluteLong(d);
    case "legal":
      return absoluteLegal(d);
    case "short":
      return absoluteShort(d);
    case "auto":
    default: {
      const age = Date.now() - d.getTime();
      if (age < 24 * 60 * 60 * 1000 && age >= 0) return relative(d);
      return absoluteLong(d);
    }
  }
}

/** @deprecated → tarihBicimle(v, "legal") */
export function formatDate(value: string | null | undefined): string {
  return tarihBicimle(value, "legal");
}

/** @deprecated → tarihBicimle(v, "short") */
export function formatDateShort(value: string | null | undefined): string {
  return tarihBicimle(value, "short");
}

/** @deprecated → tarihBicimle(v, "auto") */
export function formatRelative(value: string | null | undefined): string {
  return tarihBicimle(value, "auto");
}
