"use client";

import type { ApiElectionAlliance, ApiElectionSeat } from "@yenihaber/shared";
import styles from "./election-hemicycle.module.css";

type Props = {
  seatCount: number;
  seats: ApiElectionSeat[];
  alliances: ApiElectionAlliance[];
};

type AllianceGroup = {
  id: string;
  name: string;
  color: string;
  seats: number;
  voteShare: number;
  parties: ApiElectionSeat[];
};

type Dot = { x: number; y: number; color: string; partyId: string };

function layoutDots(
  total: number,
  colored: Array<{ partyId: string; color: string; n: number }>,
): Dot[] {
  const rows = Math.min(7, Math.max(4, Math.round(Math.sqrt(total * 0.5))));
  const weights: number[] = [];
  for (let r = 0; r < rows; r++) {
    weights.push(0.45 + (r / Math.max(1, rows - 1)) * 0.55);
  }
  const wSum = weights.reduce((a, b) => a + b, 0);
  const perRow: number[] = [];
  let assigned = 0;
  for (let r = 0; r < rows; r++) {
    if (r === rows - 1) perRow.push(Math.max(0, total - assigned));
    else {
      const n = Math.max(1, Math.round((weights[r]! / wSum) * total));
      perRow.push(n);
      assigned += n;
    }
  }
  let diff = total - perRow.reduce((a, b) => a + b, 0);
  let i = perRow.length - 1;
  while (diff !== 0 && i >= 0) {
    const next = perRow[i]! + (diff > 0 ? 1 : -1);
    if (next >= 0) {
      perRow[i] = next;
      diff += diff > 0 ? -1 : 1;
    }
    i -= 1;
  }

  const queue: Array<{ partyId: string; color: string }> = [];
  for (const c of colored) {
    for (let k = 0; k < c.n; k++) queue.push({ partyId: c.partyId, color: c.color });
  }
  while (queue.length < total) queue.push({ partyId: "_", color: "#d1d5db" });

  const dots: Dot[] = [];
  let qi = 0;
  for (let r = 0; r < rows; r++) {
    const count = perRow[r] ?? 0;
    if (!count) continue;
    const radius = 18 + (r / Math.max(1, rows - 1)) * 28;
    for (let s = 0; s < count; s++) {
      const t = count === 1 ? 0.5 : s / (count - 1);
      const angle = Math.PI - t * Math.PI;
      const item = queue[qi++] ?? { partyId: "_", color: "#d1d5db" };
      dots.push({
        x: 50 + radius * Math.cos(angle),
        y: 52 - radius * Math.sin(angle) * 0.92,
        color: item.color,
        partyId: item.partyId,
      });
    }
  }
  return dots;
}

function fmtPct(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function buildGroups(
  seats: ApiElectionSeat[],
  alliances: ApiElectionAlliance[],
): AllianceGroup[] {
  const byId = new Map<string, AllianceGroup>();
  for (const a of alliances) {
    byId.set(a.id, {
      id: a.id,
      name: a.name,
      color: a.color,
      seats: 0,
      voteShare: 0,
      parties: [],
    });
  }
  const unaligned: ApiElectionSeat[] = [];
  for (const s of seats) {
    if (!s.allianceId) {
      if (s.seats > 0) unaligned.push(s);
      continue;
    }
    let g = byId.get(s.allianceId);
    if (!g) {
      g = {
        id: s.allianceId,
        name: s.allianceName || "İttifak",
        color: s.color,
        seats: 0,
        voteShare: 0,
        parties: [],
      };
      byId.set(s.allianceId, g);
    }
    g.parties.push(s);
    g.seats += s.seats;
    g.voteShare += s.voteShare;
  }
  const groups = [...byId.values()]
    .map((g) => ({
      ...g,
      voteShare: Math.round(g.voteShare * 10) / 10,
      parties: [...g.parties].sort((a, b) => b.seats - a.seats),
    }))
    .filter((g) => g.parties.length > 0)
    .sort((a, b) => b.seats - a.seats);

  if (unaligned.length) {
    groups.push({
      id: "_other",
      name: "Diğer",
      color: "#6B7280",
      seats: unaligned.reduce((n, s) => n + s.seats, 0),
      voteShare:
        Math.round(unaligned.reduce((n, s) => n + s.voteShare, 0) * 10) / 10,
      parties: unaligned,
    });
  }
  return groups;
}

/** Hemicycle + kompakt ittifak satırları */
export function ElectionHemicycle({ seatCount, seats, alliances }: Props) {
  const groups = buildGroups(seats, alliances).filter((g) => g.seats > 0);
  const total = Math.max(seatCount, seats.reduce((s, x) => s + x.seats, 0));
  const colored = groups.flatMap((g) =>
    g.parties
      .filter((p) => p.seats > 0)
      .map((p) => ({ partyId: p.partyId, color: p.color, n: p.seats })),
  );
  const dots = layoutDots(total, colored);
  if (!groups.length) return null;

  return (
    <section className={styles.root} aria-label="Koltuk ve ittifaklar">
      <div className={styles.layout}>
        <div className={styles.hemiWrap}>
          <svg
            className={styles.hemi}
            viewBox="0 0 100 58"
            role="img"
            aria-label={`${total} koltuk`}
          >
            {dots.map((d, idx) => (
              <circle
                key={`${d.partyId}-${idx}`}
                cx={d.x}
                cy={d.y}
                r={0.85}
                fill={d.color}
              />
            ))}
            <text x="50" y="54" textAnchor="middle" className={styles.hemiLabel}>
              {total} KOLTUK
            </text>
          </svg>
        </div>

        <div className={styles.allianceRow}>
          {groups.map((g) => (
            <article
              key={g.id}
              className={styles.allianceCard}
              style={{ ["--ac" as string]: g.color }}
            >
              <header>{g.name}</header>
              <p className={styles.allianceMeta}>
                {g.parties
                  .filter((p) => p.seats > 0)
                  .map((p) => p.partyName)
                  .join(" · ")}
              </p>
              <p className={styles.alliancePct}>
                %{fmtPct(g.voteShare)}
                <span className={styles.allianceSeats}>{g.seats} koltuk</span>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
