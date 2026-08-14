"use client";

import { useState } from "react";
import type { ApiElectionCandidate, ApiElectionSeat } from "@yenihaber/shared";
import { adminApi } from "@/lib/api";
import { formatPct, formatVotes } from "./election-preview-chrome";
import { PersonSilhouette } from "./person-silhouette";
import styles from "./elections.module.css";

type VoteListProps = {
  candidates: ApiElectionCandidate[];
  votes: Record<string, number>;
  totalVotes: number;
  onChange: (candidateId: string, value: number) => void;
  onCandidatePatched?: () => void;
  onBusy?: (v: boolean) => void;
  onError?: (msg: string) => void;
  onOk?: (msg: string) => void;
};

/** Sade oy girişi — foto, logo, ittifak, oy, oran */
export function ElectionVoteList({
  candidates,
  votes,
  totalVotes,
  onChange,
  onCandidatePatched,
  onBusy,
  onError,
  onOk,
}: VoteListProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  if (!candidates.length) {
    return (
      <p className={styles.muted}>
        Aday yok — Parti &amp; aday sekmesinden ekleyin.
      </p>
    );
  }

  async function uploadPhoto(candidateId: string, file: File) {
    setUploadingId(candidateId);
    onBusy?.(true);
    onError?.("");
    try {
      const res = await adminApi.media.upload(file, {
        kind: "genel",
        alt: "Aday fotoğrafı",
      });
      await adminApi.elections.updateCandidate(candidateId, {
        photoUrl: res.url,
      });
      onOk?.("Fotoğraf kaydedildi");
      await onCandidatePatched?.();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Fotoğraf yüklenemedi");
    } finally {
      setUploadingId(null);
      onBusy?.(false);
    }
  }

  return (
    <ul className={styles.siteVoteList}>
      {candidates.map((c) => {
        const v = votes[c.id] ?? 0;
        const pct =
          totalVotes > 0 ? Math.round((v / totalVotes) * 1000) / 10 : 0;
        const color = c.party?.color ?? "#64748B";
        const meta = [c.party?.name, c.party?.allianceName]
          .filter(Boolean)
          .join(" · ");

        return (
          <li key={c.id} className={styles.siteVoteRow}>
            <div className={styles.siteAvatar}>
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photoUrl} alt="" />
              ) : (
                <PersonSilhouette className={styles.sitePhotoFb} />
              )}
              <span className={styles.siteLogoBadge} style={{ borderColor: color }}>
                {c.party?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.party.logoUrl} alt="" />
                ) : (
                  <i style={{ background: color }} aria-hidden />
                )}
              </span>
              <label className={styles.sitePhotoBtn} title="Fotoğraf yükle">
                {uploadingId === c.id ? "…" : "+"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  disabled={uploadingId === c.id}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadPhoto(c.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className={styles.siteVoteInfo}>
              <strong>{c.name}</strong>
              {meta ? <span>{meta}</span> : null}
              <div className={styles.voteBarTrack}>
                <div
                  className={styles.voteBarFill}
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>

            <label className={styles.voteInputWrap} htmlFor={`vote-${c.id}`}>
              <span>Oy</span>
              <input
                id={`vote-${c.id}`}
                className={styles.voteInput}
                type="number"
                min={0}
                value={v}
                onChange={(e) => onChange(c.id, Number(e.target.value))}
                aria-label={`${c.name} oy`}
              />
            </label>

            <div className={styles.siteVotePct}>
              <b>%{formatPct(pct)}</b>
              <small>{formatVotes(v)}</small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ElectionSeatsBlock({ seats }: { seats: ApiElectionSeat[] }) {
  if (!seats.length) return null;
  return (
    <div className={styles.seats}>
      <h3>Koltuklar</h3>
      <ul className={styles.seatsList}>
        {seats.map((s) => (
          <li key={s.partyId} className={styles.seatItem}>
            {s.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logoUrl} alt="" className={styles.seatLogo} />
            ) : (
              <i
                className={styles.seatSwatch}
                style={{ background: s.color }}
                aria-hidden
              />
            )}
            <div className={styles.seatText}>
              <span>{s.partyName}</span>
              {s.allianceName ? <em>{s.allianceName}</em> : null}
            </div>
            <strong>
              {s.seats} · %{s.voteShare}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
