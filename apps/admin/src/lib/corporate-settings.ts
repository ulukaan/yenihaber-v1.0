/** Kurumsal ayarlar — settings key sabitleri */

export type CommercialSettings = {
  legalName: string;
  displayName: string;
  taxOffice: string;
  taxNo: string;
  tradeRegistry: string;
  mersis: string;
};

export type ContactSettings = {
  contactEmail: string;
  contactPhone: string;
  whatsappTip: string;
  contactAddress: string;
  contactCity: string;
  contactDistrict: string;
  mapEmbedUrl: string;
};

/** BİK künye sabit alanları — serbest satırlardan ayrı */
export type BikImprintSettings = {
  imtiyazSahibi: string;
  sorumluMudur: string;
  uetsAddress: string;
  yayinPeriyodu: string;
  hostingProvider: string;
  yayinTuru: string;
};

export type KunyeEntry = {
  id: string;
  /** Ad / değer satırı */
  detail: string;
  department: string;
  email: string;
  sortOrder: number;
};

export const DEFAULT_COMMERCIAL: CommercialSettings = {
  legalName: "Düzce Radikal",
  displayName: "Düzce Radikal",
  taxOffice: "Düzce",
  taxNo: "",
  tradeRegistry: "",
  mersis: "",
};

export const DEFAULT_CONTACT: ContactSettings = {
  contactEmail: "info@duzceradikal.com",
  contactPhone: "",
  whatsappTip: "",
  contactAddress: "",
  contactCity: "Düzce",
  contactDistrict: "Merkez",
  mapEmbedUrl: "",
};

export const DEFAULT_BIK_IMPRINT: BikImprintSettings = {
  imtiyazSahibi: "",
  sorumluMudur: "",
  uetsAddress: "",
  yayinPeriyodu: "Sürekli (internet)",
  hostingProvider: "",
  yayinTuru: "İnternet haber sitesi",
};

export function parseCommercial(s: Record<string, string>): CommercialSettings {
  return {
    legalName: s.legalName ?? DEFAULT_COMMERCIAL.legalName,
    displayName: s.displayName ?? s.siteName ?? DEFAULT_COMMERCIAL.displayName,
    taxOffice: s.taxOffice ?? DEFAULT_COMMERCIAL.taxOffice,
    taxNo: s.taxNo ?? "",
    tradeRegistry: s.tradeRegistry ?? "",
    mersis: s.mersis ?? "",
  };
}

export function parseContact(s: Record<string, string>): ContactSettings {
  return {
    contactEmail: s.contactEmail ?? DEFAULT_CONTACT.contactEmail,
    contactPhone: s.contactPhone ?? "",
    whatsappTip: s.whatsappTip ?? s.contactPhone ?? "",
    contactAddress: s.contactAddress ?? "",
    contactCity: s.contactCity ?? DEFAULT_CONTACT.contactCity,
    contactDistrict: s.contactDistrict ?? DEFAULT_CONTACT.contactDistrict,
    mapEmbedUrl: s.mapEmbedUrl ?? "",
  };
}

export function parseBikImprint(s: Record<string, string>): BikImprintSettings {
  return {
    imtiyazSahibi: s.imtiyazSahibi ?? "",
    sorumluMudur: s.sorumluMudur ?? "",
    uetsAddress: s.uetsAddress ?? s.kepAddress ?? "",
    yayinPeriyodu: s.yayinPeriyodu ?? DEFAULT_BIK_IMPRINT.yayinPeriyodu,
    hostingProvider: s.hostingProvider ?? "",
    yayinTuru: s.yayinTuru ?? DEFAULT_BIK_IMPRINT.yayinTuru,
  };
}

export function parseKunye(s: Record<string, string>): KunyeEntry[] {
  const raw = s.kunyeEntries;
  if (!raw) return defaultKunye();
  try {
    const data = JSON.parse(raw) as KunyeEntry[];
    if (!Array.isArray(data)) return defaultKunye();
    return data
      .map((row, i) => ({
        id: row.id || `k-${i}`,
        detail: String(row.detail ?? ""),
        department: String(row.department ?? ""),
        email: String(row.email ?? ""),
        sortOrder: Number(row.sortOrder) || i + 1,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return defaultKunye();
  }
}

function defaultKunye(): KunyeEntry[] {
  return [
    {
      id: "k1",
      detail: "Düzce Radikal",
      department: "Yayıncı",
      email: "",
      sortOrder: 1,
    },
    {
      id: "k2",
      detail: "Haber Merkezi",
      department: "Genel Yayın Yönetimi",
      email: "",
      sortOrder: 2,
    },
  ];
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
