import { DEFAULT_CITY_SLUG, findCity, TURKEY_CITIES } from "./turkey-cities";

export type PrayerTimesDto = {
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
};

export type PrayerNext = {
  key: keyof PrayerTimesDto;
  label: string;
  time: string;
};

export type PrayerSnapshot = {
  city: { slug: string; name: string };
  date: string;
  times: PrayerTimesDto;
  next: PrayerNext;
  source: string;
  updatedAt: string;
};

const LABELS: Record<keyof PrayerTimesDto, string> = {
  imsak: "İmsak",
  gunes: "Güneş",
  ogle: "Öğle",
  ikindi: "İkindi",
  aksam: "Akşam",
  yatsi: "Yatsı",
};

const ORDER: (keyof PrayerTimesDto)[] = [
  "imsak",
  "gunes",
  "ogle",
  "ikindi",
  "aksam",
  "yatsi",
];

type CacheEntry = { at: number; data: PrayerSnapshot };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 30 * 60 * 1000;

function cleanTime(v: string): string {
  // "20:08 (EEST)" → "20:08"
  return (v || "").split(" ")[0]!.trim();
}

function minutesNowIstanbul(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function pickNext(times: PrayerTimesDto): PrayerNext {
  const now = minutesNowIstanbul();
  for (const key of ORDER) {
    const time = times[key];
    if (toMinutes(time) > now) {
      return { key, label: LABELS[key], time };
    }
  }
  // Gece yatsı geçtiyse yarın imsak
  return { key: "imsak", label: LABELS.imsak, time: times.imsak };
}

function fallback(slug: string): PrayerSnapshot {
  const city = findCity(slug);
  const times: PrayerTimesDto = {
    imsak: "04:38",
    gunes: "06:08",
    ogle: "13:05",
    ikindi: "16:45",
    aksam: "20:14",
    yatsi: "21:38",
  };
  return {
    city: { slug: city.slug, name: city.name },
    date: new Date().toISOString().slice(0, 10),
    times,
    next: pickNext(times),
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
}

/** Aladhan method 13 ≈ Diyanet; okul=1 (Hanefi) */
export async function getPrayerTimes(
  citySlug?: string | null,
  force = false,
): Promise<PrayerSnapshot> {
  const city = findCity(citySlug);
  const cached = cache.get(city.slug);
  if (!force && cached && Date.now() - cached.at < CACHE_MS) {
    return { ...cached.data, next: pickNext(cached.data.times) };
  }

  try {
    const url = new URL("https://api.aladhan.com/v1/timingsByCity");
    url.searchParams.set("city", city.query);
    url.searchParams.set("country", "Turkey");
    url.searchParams.set("method", "13");
    url.searchParams.set("school", "1");

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`prayer ${res.status}`);
    const json = (await res.json()) as {
      code?: number;
      data?: {
        date?: { readable?: string; gregorian?: { date?: string } };
        timings?: Record<string, string>;
      };
    };
    const t = json.data?.timings;
    if (!t) throw new Error("no timings");

    const times: PrayerTimesDto = {
      imsak: cleanTime(t.Fajr ?? t.Imsak ?? ""),
      gunes: cleanTime(t.Sunrise ?? ""),
      ogle: cleanTime(t.Dhuhr ?? ""),
      ikindi: cleanTime(t.Asr ?? ""),
      aksam: cleanTime(t.Maghrib ?? ""),
      yatsi: cleanTime(t.Isha ?? ""),
    };

    if (!times.aksam) throw new Error("empty aksam");

    const data: PrayerSnapshot = {
      city: { slug: city.slug, name: city.name },
      date:
        json.data?.date?.gregorian?.date ??
        json.data?.date?.readable ??
        new Date().toISOString().slice(0, 10),
      times,
      next: pickNext(times),
      source: "aladhan",
      updatedAt: new Date().toISOString(),
    };

    cache.set(city.slug, { at: Date.now(), data });
    return data;
  } catch {
    return fallback(city.slug);
  }
}

export function listCities() {
  return TURKEY_CITIES.map((c) => ({ slug: c.slug, name: c.name })).sort(
    (a, b) => a.name.localeCompare(b.name, "tr"),
  );
}

export { DEFAULT_CITY_SLUG };
