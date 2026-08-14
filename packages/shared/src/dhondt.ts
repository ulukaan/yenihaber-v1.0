/** D'Hondt — parti oyları → koltuk dağılımı */

export type DhondtInput = {
  id: string;
  votes: number;
};

export type DhondtSeat = {
  id: string;
  seats: number;
  voteShare: number;
};

/**
 * Klasik D'Hondt: her turda en yüksek (oy / (koltuk+1)) partisine 1 koltuk.
 */
export function allocateDhondt(
  parties: DhondtInput[],
  seatCount: number,
): DhondtSeat[] {
  const seats = Math.max(0, Math.floor(seatCount));
  const eligible = parties
    .filter((p) => p.votes > 0)
    .map((p) => ({ id: p.id, votes: p.votes, seats: 0 }));

  if (!eligible.length || seats === 0) {
    const total = parties.reduce((s, p) => s + Math.max(0, p.votes), 0);
    return parties.map((p) => ({
      id: p.id,
      seats: 0,
      voteShare: total > 0 ? (Math.max(0, p.votes) / total) * 100 : 0,
    }));
  }

  for (let i = 0; i < seats; i++) {
    let best = eligible[0]!;
    let bestScore = best.votes / (best.seats + 1);
    for (let j = 1; j < eligible.length; j++) {
      const row = eligible[j]!;
      const score = row.votes / (row.seats + 1);
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    }
    best.seats += 1;
  }

  const totalVotes = parties.reduce((s, p) => s + Math.max(0, p.votes), 0);
  const byId = new Map(eligible.map((e) => [e.id, e.seats]));
  return parties.map((p) => ({
    id: p.id,
    seats: byId.get(p.id) ?? 0,
    voteShare: totalVotes > 0 ? (Math.max(0, p.votes) / totalVotes) * 100 : 0,
  }));
}

/** İki parti rengi arası algılanabilir fark (RGB öklid) */
export function colorDistance(hexA: string, hexB: string): number {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return 999;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** ~80 altı: iki partiye yakın renk uyarısı */
export const COLOR_DISTANCE_WARN = 80;

export const PARTY_COLOR_PALETTE = [
  "#2563EB",
  "#EF4444",
  "#16A34A",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#0D9488",
  "#64748B",
  "#EA580C",
  "#0891B2",
] as const;

/**
 * Ana sayfa / kategori şerit aksanı — 10 ayırt edilebilir ton.
 * Serbest renk yok; zemin boyama yok (yalnız çizgi + etiket).
 */
export const CATEGORY_RAIL_PALETTE = [
  "#EF233C", // kırmızı
  "#1D4ED8", // mavi
  "#059669", // yeşil
  "#D97706", // kehribar
  "#7C3AED", // mor
  "#0891B2", // camgöbeği
  "#BE123C", // gül
  "#2B2D42", // mürekkep
  "#EA580C", // turuncu
  "#4F46E5", // indigo
] as const;

/** Şeritte gösterilecek minimum haber — altındaysa şerit gizlenir */
export const HOME_RAIL_MIN_ARTICLES = 1;

/**
 * Ana sayfa şerit önerilen üst sınır (uyarı için).
 * Sert engel değil — daha fazla eklenebilir; değişmek için bu sabiti artırın.
 */
export const HOME_RAIL_MAX_RECOMMENDED = 12;
