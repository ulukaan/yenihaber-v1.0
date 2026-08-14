import { type FuelPrice } from "@/lib/live-data";

export type { FuelPrice };

const FUEL_URL = "https://ucuzyakitbul.com.tr/api/prices/national";

/** Gösterim sırası (API sırası farklı gelebilir) */
const ORDER = ["Benzin", "Motorin", "LPG"] as const;

type NationalPrice = {
  fuelType: string;
  price: number;
  date: string;
};

type NationalResponse = {
  prices?: NationalPrice[];
};

export type FuelSnapshot = {
  items: FuelPrice[];
  place: string;
  source: string;
  updatedAt: string | null;
};

function formatTry(n: number): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayName(fuelType: string): string {
  const t = fuelType.trim();
  if (/benzin/i.test(t)) return "Benzin";
  if (/motorin|dizel/i.test(t)) return "Motorin";
  if (/lpg/i.test(t)) return "LPG";
  return t;
}

function sortKey(name: string): number {
  const i = ORDER.findIndex((o) => name.startsWith(o));
  return i === -1 ? ORDER.length : i;
}

/**
 * Ulusal pompa ortalaması — ucuzyakitbul.com.tr
 * Revalidate: 1 saat
 */
export async function getFuelPrices(): Promise<FuelSnapshot> {
  try {
    const res = await fetch(FUEL_URL, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Yenihaber/1.0 (+https://yenihaber.local)",
      },
    });
    if (!res.ok) {
      throw new Error(`fuel API ${res.status}`);
    }

    const data = (await res.json()) as NationalResponse;
    const raw = Array.isArray(data.prices) ? data.prices : [];
    if (!raw.length) throw new Error("empty fuel prices");

    const items: FuelPrice[] = raw
      .filter((p) => typeof p.price === "number" && Number.isFinite(p.price))
      .map((p) => ({
        name: displayName(p.fuelType),
        price: formatTry(p.price),
        unit: "₺/L",
      }))
      .sort((a, b) => sortKey(a.name) - sortKey(b.name));

    if (!items.length) throw new Error("no mappable fuel prices");

    const dates = raw
      .map((p) => p.date)
      .filter(Boolean)
      .sort();
    const latestDate = dates[dates.length - 1] ?? null;

    return {
      items,
      place: "Ulusal",
      source: "ucuzyakitbul",
      updatedAt: latestDate,
    };
  } catch {
    return {
      items: [],
      place: "Ulusal",
      source: "",
      updatedAt: null,
    };
  }
}
