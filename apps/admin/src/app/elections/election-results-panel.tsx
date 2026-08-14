"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Radio, Save, Star } from "lucide-react";
import type { ApiElectionRace } from "@yenihaber/shared";
import { adminApi } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/public-env";
import {
  ElectionPreviewChrome,
  formatPct,
  formatVotes,
  RACE_TYPE_LABEL,
} from "./election-preview-chrome";
import {
  ElectionSeatsBlock,
  ElectionVoteList,
} from "./election-vote-list";
import styles from "./elections.module.css";

type Props = {
  electionId: string;
  electionName: string;
  electionStatus: string;
  races: ApiElectionRace[];
  busy: boolean;
  onBusy: (v: boolean) => void;
  onError: (msg: string) => void;
  onOk: (msg: string) => void;
  onRacesChange: (races: ApiElectionRace[]) => void;
};

/**
 * Sonuç girişi — /secim Seçim Merkezi alanlarıyla birebir hizalı
 */
export function ElectionResultsPanel({
  electionId,
  electionName,
  electionStatus,
  races,
  busy,
  onBusy,
  onError,
  onOk,
  onRacesChange,
}: Props) {
  const featured = useMemo(
    () => races.find((r) => r.isFeatured) ?? races[0] ?? null,
    [races],
  );

  const [activeRaceId, setActiveRaceId] = useState("");
  const activeRace =
    races.find((r) => r.id === activeRaceId) ?? races[0] ?? null;

  const [votes, setVotes] = useState<Record<string, number>>({});
  const [ballotOpen, setBallotOpen] = useState(0);
  const [ballotTotal, setBallotTotal] = useState(0);
  const [note, setNote] = useState("");
  const [noteTone, setNoteTone] = useState<"info" | "warn" | "ok">("info");
  const booted = useRef(false);

  function hydrate(race: ApiElectionRace) {
    const map: Record<string, number> = {};
    for (const c of race.candidates) map[c.id] = c.votes;
    setVotes(map);
    setBallotOpen(race.region.ballotOpen);
    setBallotTotal(race.region.ballotTotal);
    setNote(race.note ?? "");
    setNoteTone((race.noteTone as "info" | "warn" | "ok") || "info");
  }

  useEffect(() => {
    if (!races.length || booted.current) return;
    const race = races.find((r) => r.isFeatured) ?? races[0];
    if (!race) return;
    setActiveRaceId(race.id);
    hydrate(race);
    booted.current = true;
  }, [races]);

  function selectRace(id: string) {
    const race = races.find((r) => r.id === id);
    if (!race) return;
    setActiveRaceId(id);
    hydrate(race);
  }

  const totalVotes = useMemo(
    () => Object.values(votes).reduce((s, v) => s + (Number(v) || 0), 0),
    [votes],
  );

  const ballotPct = useMemo(() => {
    if (!ballotTotal || ballotTotal <= 0) return 0;
    return Math.min(100, Math.round((ballotOpen / ballotTotal) * 1000) / 10);
  }, [ballotOpen, ballotTotal]);

  const ranked = useMemo(() => {
    if (!activeRace) return [];
    return [...activeRace.candidates].sort(
      (a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0),
    );
  }, [activeRace, votes]);

  const previewStats = useMemo(() => {
    if (!featured) return { open: 0, total: 0, pct: 0, votes: 0 };
    if (activeRace?.id === featured.id) {
      return {
        open: ballotOpen,
        total: ballotTotal,
        pct: ballotPct,
        votes: totalVotes,
      };
    }
    return {
      open: featured.region.ballotOpen,
      total: featured.region.ballotTotal,
      pct: featured.region.ballotPct,
      votes: featured.totalVotes,
    };
  }, [
    featured,
    activeRace?.id,
    ballotOpen,
    ballotTotal,
    ballotPct,
    totalVotes,
  ]);

  const siteUrl = SITE_ORIGIN;

  async function setFeatured(raceId: string) {
    onBusy(true);
    onError("");
    try {
      const res = await adminApi.elections.updateRace(raceId, {
        isFeatured: true,
      });
      onRacesChange(
        races.map((r) =>
          r.id === res.race.id ? res.race : { ...r, isFeatured: false },
        ),
      );
      await adminApi.elections.refreshStrip(electionId);
      onOk("Üst bar güncellendi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Öne çıkarma başarısız");
    } finally {
      onBusy(false);
    }
  }

  async function saveResults() {
    if (!activeRace) return;
    onBusy(true);
    onError("");
    try {
      const res = await adminApi.elections.saveResults(activeRace.id, {
        results: Object.entries(votes).map(([candidateId, v]) => ({
          candidateId,
          votes: Number(v) || 0,
          source: "manuel",
        })),
        ballot: { ballotOpen, ballotTotal, source: "manuel" },
        note: note || null,
        noteTone,
        recomputeSeats: true,
      });
      if (res.race) {
        onRacesChange(
          races.map((r) => (r.id === res.race!.id ? res.race! : r)),
        );
        hydrate(res.race);
      }
      await adminApi.elections.refreshStrip(electionId);
      onOk("Sonuçlar kaydedildi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      onBusy(false);
    }
  }

  if (!races.length) {
    return (
      <p className={styles.emptyMain}>
        Bu seçimde yarış yok. Önce Parti &amp; aday sekmesinden yapılandırın
        veya seed çalıştırın.
      </p>
    );
  }

  return (
    <div className={styles.centerMirror}>
      <ElectionPreviewChrome
        electionName={electionName}
        electionStatus={electionStatus}
        featuredName={featured?.name ?? null}
        featuredStar={Boolean(featured?.isFeatured)}
        stats={previewStats}
        siteUrl={siteUrl}
      />

      <div className={styles.raceTabs} role="tablist" aria-label="Yarışlar">
        {races.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={activeRace?.id === r.id}
            className={
              activeRace?.id === r.id ? styles.raceTabOn : styles.raceTab
            }
            onClick={() => selectRace(r.id)}
          >
            {r.isFeatured ? <Star size={12} aria-hidden /> : null}
            {r.name}
          </button>
        ))}
      </div>

      {activeRace ? (
        <div className={styles.raceEditor}>
          <header className={styles.raceEditorHead}>
            <div>
              <p className={styles.raceType}>
                {RACE_TYPE_LABEL[activeRace.type] ?? activeRace.type}
              </p>
              <h3>{activeRace.name}</h3>
              <p className={styles.raceRegion}>
                Bölge: {activeRace.region.name} · kaynak:{" "}
                {activeRace.region.source}
              </p>
            </div>
            <button
              type="button"
              className={
                activeRace.isFeatured ? styles.featuredOn : styles.featuredBtn
              }
              disabled={busy || activeRace.isFeatured}
              onClick={() => void setFeatured(activeRace.id)}
              aria-pressed={activeRace.isFeatured}
              title="Seçim Merkezi üst barında bu yarışın sandığı gösterilir"
            >
              <Star size={16} aria-hidden />
              {activeRace.isFeatured
                ? "Üst barda (öne çıkan)"
                : "Üst bara al"}
            </button>
          </header>

          <div className={styles.ballotCard}>
            <div className={styles.ballotFields}>
              <label className={styles.field}>
                <span>Açılan sandık</span>
                <input
                  type="number"
                  min={0}
                  value={ballotOpen}
                  onChange={(e) => setBallotOpen(Number(e.target.value))}
                  aria-label="Açılan sandık"
                />
                <em className={styles.fieldHint}>Kart başlığında % olarak görünür</em>
              </label>
              <label className={styles.field}>
                <span>Toplam sandık</span>
                <input
                  type="number"
                  min={0}
                  value={ballotTotal}
                  onChange={(e) => setBallotTotal(Number(e.target.value))}
                  aria-label="Toplam sandık"
                />
              </label>
            </div>
            <div className={styles.ballotMeter}>
              <div className={styles.ballotMeterTop}>
                <span className={styles.ballotMeterLabel}>Açılma oranı</span>
                <strong className={styles.ballotMeterPct}>
                  %{formatPct(ballotPct)}
                </strong>
              </div>
              <div
                className={styles.meterTrack}
                role="progressbar"
                aria-valuenow={ballotPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Sandık açılma oranı"
              >
                <div
                  className={styles.meterFill}
                  style={{ width: `${ballotPct}%` }}
                />
              </div>
            </div>
          </div>

          <section
            className={styles.voteSection}
            aria-label="Parti / aday oyları"
          >
            <div className={styles.voteSectionHead}>
              <h3>Oy girişi</h3>
              <span className={styles.voteTotal}>
                Toplam {formatVotes(totalVotes)} oy
              </span>
            </div>
            <ElectionVoteList
              candidates={ranked}
              votes={votes}
              totalVotes={totalVotes}
              onChange={(id, value) =>
                setVotes((prev) => ({ ...prev, [id]: value }))
              }
              onBusy={onBusy}
              onError={onError}
              onOk={onOk}
              onCandidatePatched={async () => {
                try {
                  const res = (await adminApi.elections.get(electionId)) as {
                    races: ApiElectionRace[];
                  };
                  onRacesChange((res.races ?? []).filter(Boolean));
                } catch {
                  /* ignore */
                }
              }}
            />
          </section>

          {(activeRace.type === "meclis" ||
            activeRace.type === "milletvekili" ||
            activeRace.type === "il_genel") &&
          activeRace.seats.length ? (
            <ElectionSeatsBlock seats={activeRace.seats} />
          ) : null}

          <div className={styles.noteGrid}>
            <label className={styles.noteField}>
              Editör notu
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn. Geçici sonuçlar — YSK kesinleştirmesi bekleniyor"
              />
            </label>
            <label className={styles.field}>
              <span>Not tonu</span>
              <select
                value={noteTone}
                onChange={(e) =>
                  setNoteTone(e.target.value as "info" | "warn" | "ok")
                }
                aria-label="Not tonu"
              >
                <option value="info">Bilgi (mavi)</option>
                <option value="warn">Uyarı (sarı)</option>
                <option value="ok">Olumlu (yeşil)</option>
              </select>
            </label>
          </div>

          <div className={styles.saveBar}>
            <p className={styles.saveHint}>
              <Radio size={14} aria-hidden />
              Kaydet → /secim ve şerit yenilenir
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={busy || !ranked.length}
              onClick={() => void saveResults()}
            >
              <Save size={16} aria-hidden />
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
