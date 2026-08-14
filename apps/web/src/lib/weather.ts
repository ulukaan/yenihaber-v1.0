/**
 * Open-Meteo (anahtarsız) — Düzce ve bölge hava durumu
 * https://open-meteo.com
 */

export type WeatherNow = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  desc: string;
  time: string;
};

export type WeatherDayForecast = {
  date: string;
  dateLabel: string;
  code: number;
  desc: string;
  tMax: number;
  tMin: number;
  precip: number;
  uv: number;
};

export type WeatherHour = {
  time: string;
  hourLabel: string;
  temp: number;
  code: number;
  desc: string;
  precipProb: number;
};

export type WeatherSnapshot = {
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  now: WeatherNow;
  daily: WeatherDayForecast[];
  hourly: WeatherHour[];
  source: string;
  updatedAt: string;
  error?: string;
};

const DUZCE = { lat: 40.8438, lon: 31.1565, name: "Düzce" };

/** WMO hava kodu → Türkçe kısa açıklama */
export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Açık";
  if (code === 1) return "Çoğunlukla açık";
  if (code === 2) return "Parçalı bulutlu";
  if (code === 3) return "Kapalı";
  if (code === 45 || code === 48) return "Sisli";
  if (code >= 51 && code <= 55) return "Çiseleyen yağmur";
  if (code >= 56 && code <= 57) return "Dondurucu çisenti";
  if (code >= 61 && code <= 65) return "Yağmurlu";
  if (code >= 66 && code <= 67) return "Dondurucu yağmur";
  if (code >= 71 && code <= 77) return "Karlı";
  if (code >= 80 && code <= 82) return "Sağanak";
  if (code >= 85 && code <= 86) return "Kar sağanağı";
  if (code === 95) return "Gök gürültülü";
  if (code === 96 || code === 99) return "Dolu riski";
  return "Değişken";
}

function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function hourLabel(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type OpenMeteoJson = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    uv_index_max?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    precipitation_probability?: number[];
  };
};

function fallbackSnapshot(error?: string): WeatherSnapshot {
  const today = new Date();
  const daily: WeatherDayForecast[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const base = 24 - Math.abs(i - 2);
    return {
      date: iso,
      dateLabel: dayLabel(iso),
      code: i % 3 === 0 ? 2 : 1,
      desc: weatherCodeLabel(i % 3 === 0 ? 2 : 1),
      tMax: base + 4,
      tMin: base - 4,
      precip: i === 3 ? 2.4 : 0,
      uv: Math.max(1, 6 - i * 0.4),
    };
  });

  return {
    city: DUZCE.name,
    lat: DUZCE.lat,
    lon: DUZCE.lon,
    timezone: "Europe/Istanbul",
    now: {
      temp: 24,
      feels: 25,
      humidity: 55,
      wind: 12,
      code: 2,
      desc: "Parçalı bulutlu",
      time: today.toISOString(),
    },
    daily,
    hourly: Array.from({ length: 12 }, (_, i) => {
      const t = new Date(today);
      t.setHours(t.getHours() + i, 0, 0, 0);
      const code = i > 6 ? 3 : 1;
      return {
        time: t.toISOString(),
        hourLabel: hourLabel(t.toISOString()),
        temp: 22 + Math.round(Math.sin(i / 3) * 3),
        code,
        desc: weatherCodeLabel(code),
        precipProb: i > 7 ? 30 : 10,
      };
    }),
    source: error ? "yedek" : "",
    updatedAt: today.toISOString(),
    error,
  };
}

/** Düzce 7 günlük + saatlik tahmin */
export async function getWeather(): Promise<WeatherSnapshot> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(DUZCE.lat));
    url.searchParams.set("longitude", String(DUZCE.lon));
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max",
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,weather_code,precipitation_probability",
    );
    url.searchParams.set("timezone", "Europe/Istanbul");
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("wind_speed_unit", "kmh");

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`weather ${res.status}`);

    const data = (await res.json()) as OpenMeteoJson;
    const cur = data.current;
    if (!cur || typeof cur.temperature_2m !== "number") {
      throw new Error("missing current");
    }

    const code = Number(cur.weather_code ?? 0);
    const dailyTimes = data.daily?.time ?? [];
    const daily: WeatherDayForecast[] = dailyTimes.map((date, i) => {
      const c = Number(data.daily?.weather_code?.[i] ?? 0);
      return {
        date,
        dateLabel: dayLabel(date),
        code: c,
        desc: weatherCodeLabel(c),
        tMax: Math.round(Number(data.daily?.temperature_2m_max?.[i] ?? 0)),
        tMin: Math.round(Number(data.daily?.temperature_2m_min?.[i] ?? 0)),
        precip: Number(data.daily?.precipitation_sum?.[i] ?? 0),
        uv: Number(data.daily?.uv_index_max?.[i] ?? 0),
      };
    });

    const nowMs = Date.now();
    const hourlyAll = data.hourly?.time ?? [];
    const hourly: WeatherHour[] = [];
    for (let i = 0; i < hourlyAll.length && hourly.length < 18; i++) {
      const t = hourlyAll[i];
      if (!t) continue;
      const ms = new Date(t).getTime();
      if (ms < nowMs - 60 * 60 * 1000) continue;
      const c = Number(data.hourly?.weather_code?.[i] ?? 0);
      hourly.push({
        time: t,
        hourLabel: hourLabel(t),
        temp: Math.round(Number(data.hourly?.temperature_2m?.[i] ?? 0)),
        code: c,
        desc: weatherCodeLabel(c),
        precipProb: Number(data.hourly?.precipitation_probability?.[i] ?? 0),
      });
    }

    return {
      city: DUZCE.name,
      lat: DUZCE.lat,
      lon: DUZCE.lon,
      timezone: "Europe/Istanbul",
      now: {
        temp: Math.round(cur.temperature_2m),
        feels: Math.round(Number(cur.apparent_temperature ?? cur.temperature_2m)),
        humidity: Math.round(Number(cur.relative_humidity_2m ?? 0)),
        wind: Math.round(Number(cur.wind_speed_10m ?? 0)),
        code,
        desc: weatherCodeLabel(code),
        time: cur.time ?? new Date().toISOString(),
      },
      daily,
      hourly: hourly.slice(0, 12),
      source: "Open-Meteo",
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackSnapshot("Canlı hava kaynağına ulaşılamadı.");
  }
}

/** Giyim / konfor notu */
export function weatherAdvice(temp: number, code: number, precip: number): string[] {
  const tips: string[] = [];
  if (temp <= 5) tips.push("Soğuk hava: katmanlı giyinin, rüzgâra dikkat.");
  else if (temp <= 12) tips.push("Serin: ince mont veya hırka yeterli olabilir.");
  else if (temp <= 22) tips.push("Ilıman: günlük dışarı çıkmak için uygun.");
  else if (temp <= 28) tips.push("Sıcak: gölge ve su tüketimine dikkat.");
  else tips.push("Sıcak dalga riski: zorunlu değilse öğle dışarıyı sınırlayın.");

  if (code >= 61 || precip >= 2) {
    tips.push("Yağış ihtimali: şemsiye veya su geçirmez katman önerilir.");
  }
  if (code >= 71) tips.push("Kar / buz riski: yollarda temkinli olun.");
  if (code === 0 || code === 1) tips.push("Güneşli: UV yüksekse şapka/gözlük düşünün.");
  return tips;
}
