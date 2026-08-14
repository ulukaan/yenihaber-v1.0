/**
 * Hızlı yorum otomatik triyaj.
 * Temiz → yayında; riskli → kuyruk; net ihlal → red.
 */

export type TriyajSonuc = "yayinla" | "kuyruk" | "reddet";

export type TriyajCtx = {
  hassasKategori: boolean;
  /** Son yorumdan bu yana saniye (aynı IP) */
  sonYorumSaniye: number;
  /** Bugünkü yorum adedi (aynı IP) */
  gunlukSayi: number;
  /** Daha önce ONAYLI yorumu olan cihaz/IP */
  oncedenOnayliCihaz: boolean;
  isQuick: boolean;
};

/** Temel hakaret / spam — düşük eşik, false-positive'de sadece kuyruk */
export const KARA_LISTE = [
  "amk",
  "aq ",
  " a.q",
  "orospu",
  "siktir",
  "piç",
  "pic ",
  "gerizekalı",
  "salak ",
  "aptal ",
  "mal ",
  "ibne",
  "pezevenk",
  "kancık",
  "yavşak",
  "şerefsiz",
  "kahpe",
] as const;

/** Asayiş / ölüm / seçim sinyali (slug veya isim) */
export function isHassasKategori(slug: string, name = ""): boolean {
  const s = `${slug} ${name}`.toLocaleLowerCase("tr-TR");
  return /(asayis|asayiş|olum|ölüm|cinayet|kaza|trafik-kaz|secim|seçim|teror|terör)/i.test(
    s,
  );
}

export function triyaj(metin: string, ctx: TriyajCtx): TriyajSonuc {
  const t = metin.trim().toLowerCase();
  const max = ctx.isQuick ? 280 : 2000;
  if (t.length < 3 || t.length > max) return "reddet";

  // link, mention, uzun rakam dizisi
  if (/(https?:\/\/|www\.|@[a-z0-9_]|\d{10,})/i.test(t)) return "kuyruk";

  if (KARA_LISTE.some((k) => t.includes(k))) return "kuyruk";

  if (ctx.hassasKategori) return "kuyruk";

  if (ctx.sonYorumSaniye < 30 || ctx.gunlukSayi > 15) return "kuyruk";

  // Hızlı yorumda temiz + bilinen cihaz → anında yayın
  if (ctx.isQuick && ctx.oncedenOnayliCihaz) return "yayinla";

  // Detaylı form veya ilk cihaz — kuyrukta kalır (güvenli varsayılan)
  if (!ctx.isQuick) return "kuyruk";

  // Hızlı, ilk cihaz, temiz: yine kuyruk (kullanıcıya anında gösterilir)
  return "kuyruk";
}

export function normalizeDisplayName(name: string | undefined | null): string {
  const n = (name || "").trim();
  return n.length >= 1 ? n.slice(0, 80) : "Okuyucu";
}
