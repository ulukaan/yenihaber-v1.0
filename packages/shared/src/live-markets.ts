/**
 * canlidoviz.com piyasa verisi.
 * Kaynaklar (öncelik sırası):
 *  1) https://api.canlidoviz.com/web/items?marketId=1&type={0|1|2}
 *  2) a.canlidoviz.com aynı path
 *  3) SSR HTML (döviz + altın)
 *  4) TCMB (döviz) + CoinGecko (kripto) yedek
 */

export type MarketItem = {
  code: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
  buy?: string | null;
  sell?: string | null;
};

export type MarketsSnapshot = {
  fx: MarketItem[];
  gold: MarketItem[];
  crypto: MarketItem[];
  source: string;
  updatedAt: string;
};

const TYPE_FX = 0;
const TYPE_GOLD = 1;
const TYPE_CRYPTO = 2;

const BASES = [
  process.env.CANLIDOVIZ_API_BASE,
  "https://api.canlidoviz.com",
  "https://a.canlidoviz.com",
].filter(Boolean) as string[];

const HEADERS: HeadersInit = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (compatible; YenihaberBot/1.0; +https://yenihaber.local)",
  "Accept-Language": "tr-TR,tr;q=0.9",
  Referer: "https://canlidoviz.com/",
  Origin: "https://canlidoviz.com",
};

let cache: { at: number; data: MarketsSnapshot } | null = null;
const CACHE_MS = 60_000;

function formatTr(n: number, digits = 2): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function formatChange(n: number | null | undefined): {
  change: string;
  up: boolean;
} {
  if (n == null || Number.isNaN(n)) return { change: "—", up: true };
  const up = n >= 0;
  const abs = Math.abs(n);
  const pct = formatTr(abs, abs >= 10 ? 1 : 2);
  return { change: `${up ? "+" : "−"}${pct}%`, up };
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v
      .replace(/%/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function normalizeRow(raw: unknown): MarketItem | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const codeRaw = pick(root, ["code", "symbol", "ShortName", "shortName", "id"]);
  const nameRaw = pick(root, ["name", "Name", "title", "fullName", "label"]);
  const code = String(codeRaw ?? nameRaw ?? "").trim();
  const label = String(nameRaw ?? codeRaw ?? "").trim();
  if (!code && !label) return null;

  const sell = asNumber(
    pick(data, [
      "lastSellPrice",
      "sellPrice",
      "selling",
      "satis",
      "Satis",
      "amount",
      "price",
      "last",
      "close",
      "bA",
      "sA",
    ]),
  );
  const buy = asNumber(
    pick(data, [
      "lastBuyPrice",
      "buyPrice",
      "buying",
      "alis",
      "Alis",
      "bA",
    ]),
  );
  const valueNum = sell ?? buy;
  if (valueNum == null) return null;

  let changeNum = asNumber(
    pick(data, [
      "dailyChangeRate",
      "changeRate",
      "changePercent",
      "percent",
      "dailyChange",
      "change",
      "yuzde",
      "ratio",
    ]),
  );
  // Bazı feed'ler 0.18 (=0.18%) bazıları 0.0018 oranı veriyor; |x|<1 ve çok küçükse *100
  if (changeNum != null && Math.abs(changeNum) > 0 && Math.abs(changeNum) < 0.5) {
    // 0.18 → +0,18% mümkün; 0.0018 → +0,18%
    if (Math.abs(changeNum) < 0.01) changeNum = changeNum * 100;
  }

  const { change, up } = formatChange(changeNum);
  const digits = valueNum >= 1000 ? 2 : valueNum >= 10 ? 2 : 4;

  return {
    code: code || label,
    label: label || code,
    value: formatTr(valueNum, digits),
    change,
    up,
    buy: buy != null ? formatTr(buy, digits) : null,
    sell: sell != null ? formatTr(sell, digits) : null,
  };
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  for (const k of ["data", "items", "result", "results", "list"]) {
    if (Array.isArray(o[k])) return o[k] as unknown[];
  }
  // { "USD": { ... }, "EUR": {...} }
  const values = Object.values(o);
  if (
    values.length &&
    values.every((v) => v && typeof v === "object" && !Array.isArray(v))
  ) {
    return values.map((v, i) => {
      const keys = Object.keys(o);
      return { code: keys[i], ...(v as object) };
    });
  }
  return [];
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim().startsWith("<")) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function fetchCanlidovizType(type: number): Promise<MarketItem[]> {
  for (const base of BASES) {
    const url = `${base.replace(/\/$/, "")}/web/items?marketId=1&type=${type}`;
    const json = await fetchJson(url);
    if (!json) continue;
    const rows = extractList(json)
      .map(normalizeRow)
      .filter((x): x is MarketItem => Boolean(x));
    if (rows.length) return rows;
  }
  return [];
}

/** SSR HTML düşen yedek — döviz/altın özetleri */
async function scrapeCanlidovizHtml(): Promise<{
  fx: MarketItem[];
  gold: MarketItem[];
}> {
  const fx: MarketItem[] = [];
  const gold: MarketItem[] = [];
  try {
    const res = await fetch("https://canlidoviz.com/doviz-kurlari", {
      headers: HEADERS,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return { fx, gold };
    const html = await res.text();

    // USD / EUR / GBP: content="USD" ... dt="bA">47.70
    const fxCodes: Array<{ code: string; label: string }> = [
      { code: "USD", label: "Dolar" },
      { code: "EUR", label: "Euro" },
      { code: "GBP", label: "Sterlin" },
    ];

    for (const { code, label } of fxCodes) {
      const re = new RegExp(
        `currency" content="${code}"[\\s\\S]{0,900}?dt="bA"[^>]*>\\s*([0-9.,]+)`,
        "i",
      );
      const m = html.match(re);
      const n = m?.[1] ? Number(m[1].replace(",", ".")) : null;
      if (n && Number.isFinite(n)) {
        fx.push({
          code,
          label,
          value: formatTr(n, 4),
          change: "—",
          up: true,
          sell: formatTr(n, 4),
        });
      }
    }

    const gram = html.match(
      /Gram\s*Alt[^\n]{0,120}[\s\S]{0,400}?dt="amount"[^>]*>\s*([0-9.,]+)/i,
    );
    const gramChange = html.match(
      /Gram\s*Alt[\s\S]{0,600}?dt="change"[^>]*>\s*%?\s*([0-9.,+-]+)/i,
    );
    if (gram?.[1]) {
      const n = Number(gram[1].replace(",", "."));
      let ch = 0;
      if (gramChange?.[1]) {
        ch = Number(gramChange[1].replace(",", ".").replace("+", ""));
      }
      const { change, up } = formatChange(Number.isFinite(ch) ? ch : 0);
      if (Number.isFinite(n)) {
        gold.push({
          code: "GA",
          label: "Gram",
          value: `${formatTr(n, 2)} TL`,
          change,
          up,
          sell: formatTr(n, 2),
        });
      }
    }
  } catch {
    // ignore
  }
  return { fx, gold };
}

/** canlidoviz.com/altin-fiyatlari — gram / çeyrek / yarım / tam / ata / ons */
async function scrapeCanlidovizGold(): Promise<MarketItem[]> {
  const wanted: Array<{ code: string; label: string }> = [
    { code: "GA", label: "Gram" },
    { code: "C", label: "Çeyrek" },
    { code: "Y", label: "Yarım" },
    { code: "T", label: "Tam" },
    { code: "ATA", label: "Ata" },
    { code: "XAU/USD", label: "Ons" },
    { code: "GAG", label: "Gümüş" },
  ];
  try {
    const res = await fetch("https://canlidoviz.com/altin-fiyatlari", {
      headers: HEADERS,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out: MarketItem[] = [];
    for (const { code, label } of wanted) {
      const esc = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const priceRe = new RegExp(
        `currency"\\s+content="${esc}"[\\s\\S]{0,1400}?dt="(?:sA|bA|amount)"[^>]*>\\s*([0-9.,]+)`,
        "i",
      );
      const m = html.match(priceRe);
      if (!m?.[1]) continue;
      const n = Number(m[1].replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) continue;

      let changeNum: number | null = null;
      const changeRe = new RegExp(
        `currency"\\s+content="${esc}"[\\s\\S]{0,2200}?dt="change"(?![A-Za-z])[^>]*>\\s*%?\\s*([+-]?[0-9.,]+)`,
        "i",
      );
      const cm = html.match(changeRe);
      if (cm?.[1]) {
        changeNum = Number(cm[1].replace(/\s/g, "").replace(",", "."));
      }
      const { change, up } = formatChange(
        Number.isFinite(changeNum) ? changeNum : null,
      );
      const digits = n >= 1000 ? 2 : n >= 10 ? 2 : 4;
      const unit = code === "XAU/USD" ? " $" : " TL";
      out.push({
        code,
        label,
        value: `${formatTr(n, digits)}${unit}`,
        change,
        up,
        sell: formatTr(n, digits),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** canlidoviz.com/kripto-paralar HTML — dış API’ler engelli ortamlar için */
async function scrapeCanlidovizCrypto(): Promise<MarketItem[]> {
  const wanted: Array<{ code: string; label: string }> = [
    { code: "BTC", label: "Bitcoin" },
    { code: "ETH", label: "Ethereum" },
    { code: "USDT", label: "Tether" },
    { code: "BNB", label: "BNB" },
    { code: "XRP", label: "XRP" },
    { code: "SOL", label: "Solana" },
    { code: "DOGE", label: "Dogecoin" },
  ];
  try {
    const res = await fetch("https://canlidoviz.com/kripto-paralar", {
      headers: HEADERS,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out: MarketItem[] = [];
    for (const { code, label } of wanted) {
      const re = new RegExp(
        `currency"\\s+content="${code}"[\\s\\S]{0,1200}?itemprop="price"[\\s\\S]{0,200}?dt="amount"[^>]*>\\s*([0-9.,]+)`,
        "i",
      );
      const m = html.match(re);
      if (!m?.[1]) continue;
      const n = Number(m[1].replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) continue;

      let changeNum: number | null = null;
      const changeRe = new RegExp(
        `currency"\\s+content="${code}"[\\s\\S]{0,2000}?dt="change"(?![A-Za-z])[^>]*>\\s*%?\\s*([+-]?[0-9.,]+)`,
        "i",
      );
      const cm = html.match(changeRe);
      if (cm?.[1]) {
        changeNum = Number(cm[1].replace(/\s/g, "").replace(",", "."));
      }
      const { change, up } = formatChange(
        Number.isFinite(changeNum) ? changeNum : null,
      );
      const digits = n >= 1000 ? 0 : n >= 10 ? 2 : 4;
      out.push({
        code,
        label,
        value: `${formatTr(n, digits)} $`,
        change,
        up,
        sell: formatTr(n, 2),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchTcmbFx(): Promise<MarketItem[]> {
  try {
    const json = await fetchJson("https://hasanadiguzel.com.tr/api/kurgetir");
    if (!json || typeof json !== "object") return [];
    const list = (json as { TCMB_AnlikKurBilgileri?: unknown[] })
      .TCMB_AnlikKurBilgileri;
    if (!Array.isArray(list)) return [];

    const want: Record<string, string> = {
      "ABD DOLARI": "USD",
      EURO: "EUR",
      "İNGİLİZ STERLİNİ": "GBP",
    };

    const out: MarketItem[] = [];
    for (const row of list) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const isim = String(r.Isim ?? "").trim();
      const code = want[isim];
      if (!code) continue;
      const sell = asNumber(r.ForexSelling) ?? asNumber(r.BanknoteSelling);
      const buy = asNumber(r.ForexBuying);
      if (sell == null) continue;
      out.push({
        code,
        label: code === "USD" ? "Dolar" : code === "EUR" ? "Euro" : "Sterlin",
        value: formatTr(sell, 4),
        change: "—",
        up: true,
        buy: buy != null ? formatTr(buy, 4) : null,
        sell: formatTr(sell, 4),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function hasMarketValue(item: MarketItem): boolean {
  const v = (item.value ?? "").trim();
  return Boolean(v) && v !== "—" && v !== "-" && v.toLowerCase() !== "n/a";
}

/** Binance public ticker — ücretsiz, genelde hızlı */
async function fetchBinanceCrypto(): Promise<MarketItem[]> {
  const pairs: Array<{ symbol: string; code: string; label: string }> = [
    { symbol: "BTCUSDT", code: "BTC", label: "Bitcoin" },
    { symbol: "ETHUSDT", code: "ETH", label: "Ethereum" },
    { symbol: "BNBUSDT", code: "BNB", label: "BNB" },
    { symbol: "XRPUSDT", code: "XRP", label: "XRP" },
    { symbol: "SOLUSDT", code: "SOL", label: "Solana" },
    { symbol: "DOGEUSDT", code: "DOGE", label: "Dogecoin" },
  ];
  try {
    const symbols = encodeURIComponent(
      JSON.stringify(pairs.map((p) => p.symbol)),
    );
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`;
    const json = await fetchJson(url);
    if (!Array.isArray(json)) return [];
    const bySymbol = new Map<string, Record<string, unknown>>();
    for (const row of json) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const sym = String(o.symbol ?? "");
      if (sym) bySymbol.set(sym, o);
    }
    const out: MarketItem[] = [];
    for (const p of pairs) {
      const row = bySymbol.get(p.symbol);
      if (!row) continue;
      const last = asNumber(row.lastPrice);
      if (last == null) continue;
      const pct = asNumber(row.priceChangePercent);
      const { change, up } = formatChange(pct);
      out.push({
        code: p.code,
        label: p.label,
        value: `${formatTr(last, last >= 100 ? 0 : 2)} $`,
        change,
        up,
        sell: formatTr(last, 2),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchCoinGeckoCrypto(): Promise<MarketItem[]> {
  try {
    const map: Array<{ id: string; code: string; label: string }> = [
      { id: "bitcoin", code: "BTC", label: "Bitcoin" },
      { id: "ethereum", code: "ETH", label: "Ethereum" },
      { id: "tether", code: "USDT", label: "Tether" },
      { id: "binancecoin", code: "BNB", label: "BNB" },
      { id: "ripple", code: "XRP", label: "XRP" },
      { id: "solana", code: "SOL", label: "Solana" },
      { id: "dogecoin", code: "DOGE", label: "Dogecoin" },
    ];
    const ids = map.map((m) => m.id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const json = await fetchJson(url);
    if (!json || typeof json !== "object") return [];
    const out: MarketItem[] = [];
    for (const m of map) {
      const row = (json as Record<string, Record<string, number>>)[m.id];
      if (!row?.usd) continue;
      const { change, up } = formatChange(row.usd_24h_change);
      out.push({
        code: m.code,
        label: m.label,
        value: `${formatTr(row.usd, row.usd >= 100 ? 0 : 2)} $`,
        change,
        up,
        sell: formatTr(row.usd, 2),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchCryptoFallback(): Promise<{
  items: MarketItem[];
  source: string;
}> {
  const scraped = await scrapeCanlidovizCrypto();
  if (scraped.length) return { items: scraped, source: "canlidoviz-html-crypto" };
  const binance = await fetchBinanceCrypto();
  if (binance.length) return { items: binance, source: "binance" };
  const cg = await fetchCoinGeckoCrypto();
  if (cg.length) return { items: cg, source: "coingecko" };
  return { items: [], source: "" };
}

function pickPreferred(
  items: MarketItem[],
  codes: string[],
  limit = 6,
): MarketItem[] {
  const upper = items.map((i) => ({
    ...i,
    _c: i.code.toUpperCase(),
    _l: i.label.toLocaleUpperCase("tr-TR"),
  }));
  const used = new Set<string>();
  const selected: MarketItem[] = [];
  for (const code of codes) {
    const hit = upper.find((i) => {
      const key = `${i._c}|${i._l}`;
      if (used.has(key)) return false;
      if (i._c === code) return true;
      // Kısa kodlarda (C/Y/T) includes yanlış eşleşir
      if (code.length >= 2 && (i._c.includes(code) || i._l.includes(code))) {
        return true;
      }
      if (code === "USD" && (i._l.includes("DOLAR") || i._c === "USDTRY")) {
        return true;
      }
      if (code === "EUR" && i._l.includes("EURO")) return true;
      if (
        code === "GBP" &&
        (i._l.includes("STERLIN") || i._l.includes("POUND"))
      ) {
        return true;
      }
      if (code === "C" && (i._l.includes("ÇEYREK") || i._l.includes("CEYREK"))) {
        return true;
      }
      if (code === "Y" && (i._l.includes("YARIM") || i._l.includes("YARIM"))) {
        return true;
      }
      if (code === "T" && (i._l === "TAM" || i._l.startsWith("TAM "))) {
        return true;
      }
      if (code === "GA" && (i._l.includes("GRAM") || i._c === "GA")) return true;
      if (code === "BTC" && (i._l.includes("BITCOIN") || i._c.includes("BTC"))) {
        return true;
      }
      return false;
    });
    if (hit) {
      const { _c, _l, ...rest } = hit;
      used.add(`${_c}|${_l}`);
      selected.push(rest);
    }
  }
  if (selected.length >= Math.min(3, limit)) return selected.slice(0, limit);
  return items.slice(0, limit);
}

const FALLBACK: MarketsSnapshot = {
  fx: [
    { code: "USD", label: "Dolar", value: "—", change: "—", up: true },
    { code: "EUR", label: "Euro", value: "—", change: "—", up: true },
    { code: "GBP", label: "Sterlin", value: "—", change: "—", up: true },
  ],
  gold: [
    { code: "GA", label: "Gram", value: "—", change: "—", up: true },
    { code: "C", label: "Çeyrek", value: "—", change: "—", up: true },
    { code: "Y", label: "Yarım", value: "—", change: "—", up: true },
    { code: "T", label: "Tam", value: "—", change: "—", up: true },
    { code: "ATA", label: "Ata", value: "—", change: "—", up: true },
  ],
  crypto: [
    { code: "BTC", label: "Bitcoin", value: "—", change: "—", up: true },
    { code: "ETH", label: "Ethereum", value: "—", change: "—", up: true },
    { code: "USDT", label: "Tether", value: "—", change: "—", up: true },
    { code: "BNB", label: "BNB", value: "—", change: "—", up: true },
    { code: "XRP", label: "XRP", value: "—", change: "—", up: true },
    { code: "SOL", label: "Solana", value: "—", change: "—", up: true },
  ],
  source: "fallback",
  updatedAt: new Date().toISOString(),
};

export async function getMarketsSnapshot(
  force = false,
): Promise<MarketsSnapshot> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const sources: string[] = [];

  let [fxRaw, goldRaw, cryptoRaw] = await Promise.all([
    fetchCanlidovizType(TYPE_FX),
    fetchCanlidovizType(TYPE_GOLD),
    fetchCanlidovizType(TYPE_CRYPTO),
  ]);

  if (fxRaw.length) sources.push("canlidoviz-fx");
  if (goldRaw.length) sources.push("canlidoviz-gold");
  if (cryptoRaw.length) sources.push("canlidoviz-crypto");

  if (!fxRaw.length || !goldRaw.length) {
    const scraped = await scrapeCanlidovizHtml();
    if (!fxRaw.length && scraped.fx.length) {
      fxRaw = scraped.fx;
      sources.push("canlidoviz-html-fx");
    }
    if (!goldRaw.length && scraped.gold.length) {
      goldRaw = scraped.gold;
      sources.push("canlidoviz-html-gold");
    }
  }

  goldRaw = goldRaw.filter(hasMarketValue);
  if (goldRaw.length < 3) {
    const multiGold = await scrapeCanlidovizGold();
    if (multiGold.length > goldRaw.length) {
      goldRaw = multiGold;
      sources.push("canlidoviz-html-altin");
    }
  }

  if (!fxRaw.length) {
    const tcmb = await fetchTcmbFx();
    if (tcmb.length) {
      fxRaw = tcmb;
      sources.push("tcmb");
    }
  }

  cryptoRaw = cryptoRaw.filter(hasMarketValue);
  if (!cryptoRaw.length) {
    const fb = await fetchCryptoFallback();
    if (fb.items.length) {
      cryptoRaw = fb.items;
      sources.push(fb.source);
    }
  }

  const data: MarketsSnapshot = {
    fx: pickPreferred(fxRaw, ["USD", "EUR", "GBP"], 6),
    gold: pickPreferred(
      goldRaw,
      ["GA", "C", "Y", "T", "ATA", "XAU/USD", "GAG", "GRAM", "CEYREK", "YARIM", "TAM", "ONS", "XAU"],
      7,
    ),
    crypto: pickPreferred(
      cryptoRaw,
      ["BTC", "ETH", "USDT", "BNB", "XRP", "SOL", "DOGE"],
      7,
    ),
    source: sources.join("+") || FALLBACK.source,
    updatedAt: new Date().toISOString(),
  };

  if (!data.fx.length) data.fx = FALLBACK.fx;
  data.gold = data.gold.filter(hasMarketValue);
  if (!data.gold.length) data.gold = FALLBACK.gold;
  data.crypto = data.crypto.filter(hasMarketValue);
  if (!data.crypto.length) data.crypto = FALLBACK.crypto;

  cache = { at: Date.now(), data };
  return data;
}
