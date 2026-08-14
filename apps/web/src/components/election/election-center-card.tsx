"use client";

import Link from "next/link";
import type { ApiElectionRace } from "@yenihaber/shared";
import { ElectionHemicycle } from "./election-hemicycle";
import { PersonSilhouette } from "./person-silhouette";
import styles from "./election-center.module.css";

function fmtPct1(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtNum(n: number) {
  return n.toLocaleString("tr-TR");
}

type Props = {
  race: ApiElectionRace;
};

/**
 * Yarış kartı — sıkı satır: işaret · isim · bar · % · oy [· koltuk]
 */
export function ElectionRaceCard({ race }: Props) {
  const isSeatRace =
    race.type === "meclis" ||
    race.type === "il_genel" ||
    race.type === "milletvekili";

  const showHemi =
    isSeatRace && race.seats.some((s) => s.seats > 0);

  const rows = isSeatRace
    ? race.seats.map((s) => ({
        id: s.partyId,
        title: s.partyName,
        subtitle: s.allianceName ?? "",
        color: s.color,
        votes: Math.round((s.voteShare / 100) * (race.totalVotes || 0)),
        percent: s.voteShare,
        photoUrl: null as string | null,
        logoUrl: s.logoUrl,
        seats: s.seats as number | null,
        showAvatar: false,
      }))
    : race.candidates.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: [c.party?.name, c.party?.allianceName]
          .filter(Boolean)
          .join(" · "),
        color: c.party?.color ?? "#64748B",
        votes: c.votes,
        percent: c.percent,
        photoUrl: c.photoUrl,
        logoUrl: c.party?.logoUrl ?? null,
        seats: null as number | null,
        showAvatar: true,
      }));

  const shown = rows.slice(0, 12);

  return (
    <article
      className={
        showHemi ? `${styles.card} ${styles.cardSeat}` : styles.card
      }
    >
      <header className={styles.cardHead}>
        <h3>{race.name}</h3>
        <span>%{fmtPct1(race.region.ballotPct)} sandık</span>
      </header>

      <div className={showHemi ? styles.cardSplit : styles.cardBody}>
        <ul
          className={
            isSeatRace
              ? `${styles.resultList} ${styles.resultListSeats}`
              : styles.resultList
          }
          aria-label="Sonuçlar"
        >
          {shown.map((r) => (
            <li
              key={r.id}
              className={
                isSeatRace ? styles.seatRow : styles.resultRow
              }
            >
              {r.showAvatar ? (
                <div className={styles.avatar}>
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photoUrl} alt="" />
                  ) : (
                    <PersonSilhouette className={styles.avatarImg} />
                  )}
                  <span
                    className={styles.logoBadge}
                    style={{ borderColor: r.color }}
                  >
                    {r.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.logoUrl} alt="" />
                    ) : (
                      <i style={{ background: r.color }} aria-hidden />
                    )}
                  </span>
                </div>
              ) : (
                <div className={styles.partyMark}>
                  {r.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.logoUrl} alt="" />
                  ) : (
                    <i style={{ background: r.color }} aria-hidden />
                  )}
                </div>
              )}

              <div className={styles.resultInfo}>
                <strong title={r.title}>{r.title}</strong>
                {r.subtitle ? (
                  <span title={r.subtitle}>{r.subtitle}</span>
                ) : null}
                <div className={styles.rowBar} aria-hidden>
                  <div
                    className={styles.rowBarFill}
                    style={{
                      width: `${Math.min(100, r.percent)}%`,
                      background: r.color,
                    }}
                  />
                </div>
              </div>

              <div className={styles.resultNums}>
                <b>%{fmtPct1(r.percent)}</b>
                <small>{fmtNum(r.votes)}</small>
                {isSeatRace ? (
                  <em>
                    {r.seats != null && r.seats > 0
                      ? `${r.seats} koltuk`
                      : "—"}
                  </em>
                ) : null}
              </div>
            </li>
          ))}
          {!shown.length ? (
            <li className={styles.tableEmpty}>Henüz oy verisi yok</li>
          ) : null}
        </ul>

        {showHemi ? (
          <div className={styles.hemiSlot}>
            <ElectionHemicycle
              seatCount={
                race.seatCount ??
                race.seats.reduce((n, s) => n + s.seats, 0)
              }
              seats={race.seats}
              alliances={race.alliances ?? []}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ElectionCenterHelp({
  refreshSec,
  onBack,
}: {
  refreshSec: number;
  onBack: () => void;
}) {
  return (
    <section className={styles.help}>
      <h2>Yardım</h2>
      <p>
        Sonuçlar admin panelden girilir; bu sayfa {refreshSec} sn’de bir
        yenilenir.
      </p>
      <button type="button" className={styles.helpBack} onClick={onBack}>
        Sonuçlara dön
      </button>
      <Link href="/iletisim" className={styles.helpLink}>
        İletişim
      </Link>
    </section>
  );
}
