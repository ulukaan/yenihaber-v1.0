/**
 * Düzce Belediyesi MEBİS — vefat listesi
 * Kaynak: https://mebis.duzce.bel.tr/vefat-edenler
 * Resmî REST yok (Blazor); SSR HTML parse edilir. Bilgilendirme amaçlıdır.
 */

const MEBIS_URL = "https://mebis.duzce.bel.tr/vefat-edenler";
const SOURCE_LABEL = "Düzce Belediyesi MEBİS";

export type VefatNotice = {
  fullName: string;
  fatherName: string;
  motherName: string;
  burialDate: string;
  deathDate: string;
  announcement: string;
  address: string;
  cemetery: string;
};

export type VefatSnapshot = {
  dateLabel: string;
  items: VefatNotice[];
  sourceUrl: string;
  sourceLabel: string;
  fetchedAt: string;
  error?: string;
};

function decodeEntities(raw: string): string {
  return raw
    .replace(/&#x([0-9A-Fa-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) =>
      String.fromCodePoint(Number(d)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function fieldMap(cardHtml: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re =
    /info-label">([^<]*)<\/span>\s*<span class="info-value">([\s\S]*?)<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cardHtml))) {
    const label = decodeEntities(m[1] ?? "")
      .replace(/:$/, "")
      .toLocaleLowerCase("tr-TR");
    out[label] = decodeEntities(m[2] ?? "");
  }
  return out;
}

function pick(
  fields: Record<string, string>,
  ...keys: string[]
): string {
  for (const k of keys) {
    const hit = fields[k.toLocaleLowerCase("tr-TR")];
    if (hit) return hit;
  }
  for (const [label, value] of Object.entries(fields)) {
    if (keys.some((k) => label.includes(k.toLocaleLowerCase("tr-TR")))) {
      return value;
    }
  }
  return "";
}

function parseCards(html: string): VefatNotice[] {
  const chunks = html.split(/<div class="vefat-card">/i).slice(1);
  const items: VefatNotice[] = [];

  for (const chunk of chunks) {
    const titleMatch = chunk.match(
      /class="card-title">([\s\S]*?)<\/h3>/i,
    );
    const fullName = decodeEntities(titleMatch?.[1] ?? "");
    if (!fullName) continue;

    const fields = fieldMap(chunk);
    const cemeteryMatch = chunk.match(
      /mezarlik-banner[\s\S]*?<span>([\s\S]*?)<\/span>/i,
    );

    items.push({
      fullName,
      fatherName: pick(fields, "baba adı", "baba"),
      motherName: pick(fields, "anne adı", "anne"),
      burialDate: pick(fields, "defin tarihi", "defin"),
      deathDate: pick(fields, "ölüm tarihi", "olum tarihi", "ölüm"),
      announcement: pick(fields, "cenaze duyurusu", "duyuru"),
      address: pick(fields, "cenaze adresi", "adres"),
      cemetery: decodeEntities(cemeteryMatch?.[1] ?? ""),
    });
  }

  return items;
}

function todayTrLabel(): string {
  return new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Bugünkü (veya sayfadaki) vefat listesini çeker */
export async function getVefatNotices(): Promise<VefatSnapshot> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(MEBIS_URL, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "DuzceRadikalBot/1.0 (+https://duzceradikal.com; yerel haber servisi)",
        "accept-language": "tr-TR,tr;q=0.9",
      },
      next: { revalidate: 1800, tags: ["vefat", "servis"] },
    });
    if (!res.ok) {
      throw new Error(`MEBİS HTTP ${res.status}`);
    }
    const html = await res.text();
    const items = parseCards(html);
    return {
      dateLabel: todayTrLabel(),
      items,
      sourceUrl: MEBIS_URL,
      sourceLabel: SOURCE_LABEL,
      fetchedAt,
      ...(items.length === 0
        ? { error: "Bu tarih için kayıt bulunamadı veya sayfa yapısı değişti." }
        : {}),
    };
  } catch (e) {
    return {
      dateLabel: todayTrLabel(),
      items: [],
      sourceUrl: MEBIS_URL,
      sourceLabel: SOURCE_LABEL,
      fetchedAt,
      error: e instanceof Error ? e.message : "Vefat listesi alınamadı",
    };
  }
}
