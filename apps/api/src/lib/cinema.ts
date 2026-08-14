/**
 * Beyazperde vizyon listesi — HTML scrape + bellek cache
 * Kaynak: https://www.beyazperde.com/filmler/vizyondakiler/sinema-sayisi/
 */

import type { ApiCinema, ApiCinemaFilm } from "@yenihaber/shared";

const VIZYON_URL =
  "https://www.beyazperde.com/filmler/vizyondakiler/sinema-sayisi/";
const BP_ORIGIN = "https://www.beyazperde.com";

const HEADERS: HeadersInit = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "tr-TR,tr;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (compatible; YenihaberCinema/1.0; +https://duzceradikal.com)",
};

type CacheEntry = { at: number; data: ApiCinema };
let cache: CacheEntry | null = null;
/** Vizyon listesi seyrek değişir — 6 saat */
const TTL_MS = 6 * 60 * 60 * 1000;

const FALLBACK: ApiCinema = {
  films: [],
  source: "beyazperde",
  listUrl: VIZYON_URL,
  updatedAt: new Date().toISOString(),
  error: "Veri alınamadı",
};

function decodeHtml(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .trim();
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function first(re: RegExp, html: string): string | null {
  const m = re.exec(html);
  return m?.[1]?.trim() ? decodeHtml(m[1].trim()) : null;
}

function parseFilmCard(block: string): ApiCinemaFilm | null {
  const href = first(
    /<a[^>]*class="[^"]*meta-title-link[^"]*"[^>]*href="\/filmler\/film-([^"/]+)\/"/i,
    block,
  );
  const title =
    first(
      /<a[^>]*class="[^"]*meta-title-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
      block,
    ) ?? null;
  if (!href || !title) return null;

  const lazy = first(
    /<img[^>]*class="[^"]*thumbnail-img[^"]*"[^>]*data-src="([^"]+)"/i,
    block,
  );
  const src = first(
    /<img[^>]*class="[^"]*thumbnail-img[^"]*"[^>]*src="([^"]+)"/i,
    block,
  );
  let poster = lazy || src || null;
  if (poster?.startsWith("//")) poster = `https:${poster}`;

  const date = first(/<span class="date">([\s\S]*?)<\/span>/i, block);
  const duration = first(
    /<span class="spacer">\/<\/span>\s*([^<]+?)\s*<span class="spacer">/i,
    block,
  );
  const originalName = first(
    /<span class="light">Orijinal adı\s*<\/span>([\s\S]*?)(?:<\/div>|$)/i,
    block,
  );
  const descriptionRaw = first(
    /<div class="content-txt\s*">([\s\S]*?)<\/div>/i,
    block,
  );

  return {
    id: href,
    title: stripTags(title),
    poster,
    url: `${BP_ORIGIN}/filmler/film-${href}/`,
    date: date ? stripTags(date) : null,
    duration: duration ? stripTags(duration) : null,
    originalName: originalName ? stripTags(originalName) : null,
    description: descriptionRaw ? stripTags(descriptionRaw) : null,
  };
}

function parseVizyonHtml(html: string): ApiCinemaFilm[] {
  const blocks = [...html.matchAll(/<li class="mdl">([\s\S]*?)<\/li>/gi)];
  const out: ApiCinemaFilm[] = [];
  const seen = new Set<string>();

  for (const m of blocks) {
    const film = parseFilmCard(m[1] ?? "");
    if (!film || seen.has(film.id)) continue;
    seen.add(film.id);
    out.push(film);
  }
  return out;
}

async function fetchHtml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Vizyondaki filmler — cache’li */
export async function getCinemaSnapshot(
  force = false,
): Promise<ApiCinema> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.data;
  }

  const html = await fetchHtml(VIZYON_URL);
  if (!html) {
    if (cache) return { ...cache.data, error: "Kaynak yanıt vermedi" };
    return { ...FALLBACK, updatedAt: new Date().toISOString() };
  }

  const films = parseVizyonHtml(html);
  const data: ApiCinema = {
    films,
    source: "beyazperde",
    listUrl: VIZYON_URL,
    updatedAt: new Date().toISOString(),
    ...(films.length ? {} : { error: "Liste boş veya HTML değişti" }),
  };

  if (films.length) {
    cache = { at: Date.now(), data };
  } else if (cache) {
    return { ...cache.data, error: "Parse başarısız — eski cache" };
  }

  return data;
}
