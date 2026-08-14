/**
 * CollectAPI — Nöbetçi eczane (https://api.collectapi.com/health/*)
 * Anahtar yalnızca sunucu tarafı: COLLECT_API_KEY
 */

const BASE = "https://api.collectapi.com";

export type PharmacyDistrict = {
  name: string;
  pharmacyNumber: number;
};

export type DutyPharmacy = {
  name: string;
  district: string;
  address: string;
  phone: string;
  /** "lat,lng" veya boş */
  loc: string;
};

export type PharmacySnapshot = {
  city: string;
  cityLabel: string;
  districts: PharmacyDistrict[];
  items: DutyPharmacy[];
  source: string;
  error?: string;
};

type DistrictApiItem = {
  text?: string;
  pharmacy_number?: string | number;
};

type PharmacyApiItem = {
  name?: string;
  dist?: string;
  address?: string;
  phone?: string;
  loc?: string;
};

type CollectEnvelope<T> = {
  success?: boolean;
  result?: T;
  message?: string;
};

function apiKey(): string | undefined {
  const raw = process.env.COLLECT_API_KEY?.trim();
  if (!raw) return undefined;
  // "apikey xxx" veya yalnızca token
  return raw.replace(/^apikey\s+/i, "");
}

function defaultCity(): string {
  return (process.env.COLLECT_API_CITY || "duzce").trim().toLowerCase();
}

function cityLabel(slug: string): string {
  if (slug === "duzce") return "Düzce";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

async function collectGet<T>(path: string): Promise<CollectEnvelope<T>> {
  const key = apiKey();
  if (!key) {
    throw new Error("COLLECT_API_KEY tanımlı değil");
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    signal: AbortSignal.timeout(8000),
    headers: {
      "content-type": "application/json",
      authorization: `apikey ${key}`,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`CollectAPI ${res.status}`);
  }

  return (await res.json()) as CollectEnvelope<T>;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return digits;
  if (digits.length === 10) return `0${digits}`;
  return phone.trim();
}

function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone).replace(/\D/g, "");
  if (d.length === 11) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
  }
  return phone;
}

/** Harita URL — loc: "lat,lng" */
export function pharmacyMapUrl(item: DutyPharmacy): string | null {
  if (item.loc && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(item.loc.trim())) {
    const [lat, lng] = item.loc.split(",").map((s) => s.trim());
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (item.address) {
    const q = encodeURIComponent(`${item.name} ${item.address} ${item.district}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  return null;
}

export function pharmacyTelHref(phone: string): string {
  const d = normalizePhone(phone).replace(/\D/g, "");
  return d ? `tel:+90${d.replace(/^0/, "")}` : `tel:${phone}`;
}

export function pharmacyPhoneLabel(phone: string): string {
  return formatPhoneDisplay(phone);
}

/**
 * İlçe listesi + bugünkü nöbetçi eczaneler.
 * @param district — CollectAPI ilçe adı (opsiyonel; boş = tüm il)
 */
export async function getDutyPharmacies(
  district?: string | null,
): Promise<PharmacySnapshot> {
  const city = defaultCity();
  const label = cityLabel(city);
  const empty: PharmacySnapshot = {
    city,
    cityLabel: label,
    districts: [],
    items: [],
    source: "CollectAPI",
  };

  if (!apiKey()) {
    return {
      ...empty,
      error: "Nöbetçi eczane servisi yapılandırılmamış (COLLECT_API_KEY).",
    };
  }

  try {
    const ilce = district?.trim() || "";
    const distPath = `/health/districtList?il=${encodeURIComponent(city)}`;
    const pharmPath =
      `/health/dutyPharmacy?il=${encodeURIComponent(city)}` +
      (ilce ? `&ilce=${encodeURIComponent(ilce)}` : "");

    const [distRes, pharmRes] = await Promise.all([
      collectGet<DistrictApiItem[]>(distPath),
      collectGet<PharmacyApiItem[]>(pharmPath),
    ]);

    const districts: PharmacyDistrict[] = (Array.isArray(distRes.result)
      ? distRes.result
      : []
    )
      .map((d) => ({
        name: String(d.text || "").trim(),
        pharmacyNumber: Number(d.pharmacy_number) || 0,
      }))
      .filter((d) => d.name)
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));

    const items: DutyPharmacy[] = (Array.isArray(pharmRes.result)
      ? pharmRes.result
      : []
    )
      .map((p) => ({
        name: String(p.name || "").trim(),
        district: String(p.dist || "").trim(),
        address: String(p.address || "").trim(),
        phone: String(p.phone || "").trim(),
        loc: String(p.loc || "").trim(),
      }))
      .filter((p) => p.name)
      .sort((a, b) => {
        const byDist = a.district.localeCompare(b.district, "tr");
        return byDist !== 0 ? byDist : a.name.localeCompare(b.name, "tr");
      });

    if (!distRes.success && !pharmRes.success) {
      return {
        ...empty,
        districts,
        items,
        error: distRes.message || pharmRes.message || "API yanıt vermedi.",
      };
    }

    return {
      city,
      cityLabel: label,
      districts,
      items,
      source: "CollectAPI",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return { ...empty, error: msg };
  }
}
