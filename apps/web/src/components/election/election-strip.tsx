"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { ApiElectionStrip } from "@yenihaber/shared";
import styles from "./election-strip.module.css";

const API = "/api/v1";

const ROTATE_MS = 5000;

type StripCand = ApiElectionStrip["candidates"][number];

function fmtPct(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function pickSlots(
  cands: StripCand[],
  fixedIds: string[],
  rotateIdx: number,
): StripCand[] {
  if (!cands.length) return [];

  const byId = new Map(cands.map((c) => [c.id, c]));
  const fixed: StripCand[] = [];
  for (const id of fixedIds.slice(0, 2)) {
    const c = byId.get(id);
    if (c) fixed.push(c);
  }

  const used = new Set(fixed.map((c) => c.id));
  const ranked = cands
    .filter((c) => !used.has(c.id))
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name, "tr"));

  while (fixed.length < 2 && ranked.length) {
    fixed.push(ranked.shift()!);
  }

  let dyn: StripCand[] = [];
  if (ranked.length <= 2) {
    dyn = ranked;
  } else {
    const i = ((rotateIdx % ranked.length) + ranked.length) % ranked.length;
    dyn = [ranked[i]!, ranked[(i + 1) % ranked.length]!];
  }

  return [...fixed, ...dyn];
}

function resolveFixedIds(cands: StripCand[]): string[] {
  const p1 = cands.find((c) => c.stripPin === 1);
  const p2 = cands.find((c) => c.stripPin === 2);
  if (p1 || p2) {
    return [p1?.id, p2?.id].filter((id): id is string => Boolean(id));
  }
  return cands.slice(0, 2).map((c) => c.id);
}

function CandidateCard({
  c,
  slot,
  rank,
}: {
  c: StripCand;
  slot: "fixed" | "dynamic";
  rank: number;
}) {
  const fill = Math.max(0, Math.min(100, c.percent));
  const partyLabel = c.partyShortName || c.partyName;
  const allianceName = c.allianceName?.trim() || null;

  return (
    <article
      className={styles.card}
      data-slot={slot}
      data-lead={c.leading || rank === 0 ? "1" : undefined}
      style={
        {
          ["--cand-color" as string]: c.color,
          ["--alliance-color" as string]: c.allianceColor || c.color,
        } as CSSProperties
      }
    >
      <div className={styles.person} aria-hidden>
        <span className={styles.personGlow} />
        <div className={styles.portrait}>
          {c.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photoUrl} alt="" width={160} height={190} />
          ) : (
            <span className={styles.portraitFallback}>{c.initials}</span>
          )}
        </div>
        <div className={styles.logoChip} title={c.partyName}>
          {c.partyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.partyLogoUrl} alt="" width={40} height={40} />
          ) : (
            <em>{partyLabel.slice(0, 2).toLocaleUpperCase("tr-TR")}</em>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.meter} aria-hidden>
          <span style={{ width: `${fill}%` }} />
        </div>
        <strong className={styles.pct}>
          <small>%</small>
          {fmtPct(c.percent)}
        </strong>
        <h3 className={styles.name}>{c.name.toLocaleUpperCase("tr-TR")}</h3>
        <div className={styles.tags}>
          <span className={styles.partyTag}>{partyLabel}</span>
          {allianceName ? (
            <span className={styles.allianceTag}>
              <i aria-hidden />
              {allianceName}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Header üstü seçim şeridi — modern kartlar, 1–2 sabit / 3–4 dönen
 */
export function ElectionStrip() {
  const [strip, setStrip] = useState<ApiElectionStrip | null>(null);
  const [rotateIdx, setRotateIdx] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lockedFixedRef = useRef<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/elections/strip`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { strip: ApiElectionStrip | null };
        if (!cancelled) setStrip(data.strip);
      } catch {
        /* ignore */
      }
    }
    void load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const fixedIds = useMemo(() => {
    if (!strip?.candidates.length) return [];
    const fromPins = resolveFixedIds(strip.candidates);
    const hasPins = strip.candidates.some(
      (c) => c.stripPin === 1 || c.stripPin === 2,
    );
    if (hasPins) {
      lockedFixedRef.current = fromPins;
      return fromPins;
    }
    if (!lockedFixedRef.current) lockedFixedRef.current = fromPins;
    return lockedFixedRef.current;
  }, [strip]);

  const poolSize = useMemo(() => {
    if (!strip?.candidates.length) return 0;
    const used = new Set(fixedIds);
    return strip.candidates.filter((c) => !used.has(c.id)).length;
  }, [strip, fixedIds]);

  useEffect(() => {
    if (reduceMotion || poolSize <= 2) return;
    const id = window.setInterval(() => setRotateIdx((n) => n + 1), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [poolSize, reduceMotion]);

  if (!strip?.enabled || !strip.candidates.length) return null;

  const shown = pickSlots(strip.candidates, fixedIds, rotateIdx);
  if (!shown.length) return null;
  const fixedSet = new Set(fixedIds);

  return (
    <aside className={styles.strip} aria-label="Seçim sonuçları">
      <Link href={strip.href} className={styles.inner}>
        <div className={styles.head}>
          {strip.live ? (
            <span className={styles.live}>
              <i aria-hidden />
              Canlı sonuç
            </span>
          ) : (
            <span className={styles.liveOff}>Sonuç</span>
          )}
          <span className={styles.ballot}>{strip.ballotLabel}</span>
          <time className={styles.clock}>{strip.clock}</time>
        </div>

        <div className={styles.row}>
          {shown.map((c, i) => (
            <CandidateCard
              key={i < 2 ? `fixed-${c.id}` : `dyn-${rotateIdx}-${c.id}`}
              c={c}
              rank={i}
              slot={fixedSet.has(c.id) && i < 2 ? "fixed" : "dynamic"}
            />
          ))}
        </div>

        <p className={styles.title}>
          {strip.title.trim() || "Türkiye geneli seçim sonuçları"}
        </p>
      </Link>
    </aside>
  );
}
