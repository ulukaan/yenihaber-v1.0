/**
 * Kurumsal kimlik — footer / künye / iletişim aynı kaynaktan.
 */

export type CorporateIdentity = {
  siteName: string;
  tagline: string;
  legalName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappTip: string;
  contactAddress: string;
  contactCity: string;
  contactDistrict: string;
  taxOffice: string;
  taxNo: string;
  siteUrl: string;
  imtiyazSahibi: string;
  sorumluMudur: string;
  uetsAddress: string;
  yayinPeriyodu: string;
  hostingProvider: string;
  yayinTuru: string;
  kunyeEntries: KunyeRow[];
};

export type KunyeRow = {
  detail: string;
  department: string;
  email: string;
  sortOrder: number;
};

const DEFAULTS: CorporateIdentity = {
  siteName: "Düzce Radikal",
  tagline: "Düzce ve bölgeden gündem",
  legalName: "",
  contactEmail: "iletisim@duzceradikal.com",
  contactPhone: "",
  whatsappTip: "",
  contactAddress: "",
  contactCity: "Düzce",
  contactDistrict: "",
  taxOffice: "",
  taxNo: "",
  siteUrl: "https://duzceradikal.com",
  imtiyazSahibi: "",
  sorumluMudur: "",
  uetsAddress: "",
  yayinPeriyodu: "Sürekli (internet)",
  hostingProvider: "",
  yayinTuru: "İnternet haber sitesi",
  kunyeEntries: [],
};

function pick(
  s: Record<string, string>,
  ...keys: string[]
): string {
  for (const k of keys) {
    const v = s[k]?.trim();
    if (v) return v;
  }
  return "";
}

function parseKunye(raw: string | undefined): KunyeRow[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as KunyeRow[];
    if (!Array.isArray(data)) return [];
    return data
      .map((r, i) => ({
        detail: String(r.detail ?? "").trim(),
        department: String(r.department ?? "").trim(),
        email: String(r.email ?? "").trim(),
        sortOrder: Number(r.sortOrder) || i + 1,
      }))
      .filter((r) => r.detail || r.department)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

/** Ayar map → kurumsal kimlik (tek kaynak) */
export function resolveCorporate(
  s: Record<string, string> | null | undefined,
): CorporateIdentity {
  const src = s ?? {};
  const siteName =
    pick(src, "displayName", "site.name", "siteName") || DEFAULTS.siteName;
  return {
    siteName,
    tagline:
      pick(src, "site.tagline", "siteTagline") || DEFAULTS.tagline,
    legalName: pick(src, "legalName"),
    contactEmail:
      pick(src, "contactEmail", "email.fromAddress") ||
      DEFAULTS.contactEmail,
    contactPhone: pick(src, "contactPhone"),
    whatsappTip: pick(src, "whatsappTip", "contactPhone", "social.whatsapp"),
    contactAddress: pick(src, "contactAddress"),
    contactCity: pick(src, "contactCity") || DEFAULTS.contactCity,
    contactDistrict: pick(src, "contactDistrict"),
    taxOffice: pick(src, "taxOffice"),
    taxNo: pick(src, "taxNo"),
    siteUrl:
      pick(src, "site.url", "siteUrl") || DEFAULTS.siteUrl,
    imtiyazSahibi: pick(src, "imtiyazSahibi"),
    sorumluMudur: pick(src, "sorumluMudur"),
    uetsAddress: pick(src, "uetsAddress", "kepAddress"),
    yayinPeriyodu:
      pick(src, "yayinPeriyodu") || DEFAULTS.yayinPeriyodu,
    hostingProvider: pick(src, "hostingProvider"),
    yayinTuru: pick(src, "yayinTuru") || DEFAULTS.yayinTuru,
    kunyeEntries: parseKunye(src.kunyeEntries),
  };
}

export function placeLine(c: CorporateIdentity): string {
  return (
    [c.contactAddress, c.contactDistrict, c.contactCity]
      .filter(Boolean)
      .join(" · ") || `${c.contactCity}, Türkiye`
  );
}
