import type { ApiElectionCandidate, ApiElectionRace } from "@yenihaber/shared";
import styles from "./election-blocks.module.css";

function fmtPct(n: number) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtVotes(n: number) {
  return n.toLocaleString("tr-TR");
}

function clockOf(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Parti logosu veya renkli baş harf */
function PartyMark({
  candidate,
  className = styles.av,
}: {
  candidate: ApiElectionCandidate;
  className?: string;
}) {
  const color = candidate.party?.color ?? "#64748B";
  const logo = candidate.party?.logoUrl;
  if (logo) {
    return (
      <span className={`${className} ${styles.avLogo}`} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={40} height={40} />
      </span>
    );
  }
  return (
    <span className={className} style={{ background: color }} aria-hidden>
      {candidate.initials}
    </span>
  );
}

/** Belediye başkanlığı — ilk 2 kart + liste */
export function MayorRaceBlock({ race }: { race: ApiElectionRace }) {
  const [a, b, ...rest] = race.candidates;
  const leadGap =
    a && b ? Math.round((a.percent - b.percent) * 10) / 10 : 0;

  return (
    <section className={styles.card} aria-labelledby={`race-${race.id}`}>
      <header className={styles.head}>
        <div>
          <p className={styles.live}>
            <i /> Canlı
          </p>
          <h2 id={`race-${race.id}`}>{race.name}</h2>
          <p className={styles.sub}>{race.candidates.length} aday</p>
        </div>
        <time>{clockOf(race.updatedAt)}</time>
      </header>

      <p className={styles.ballot}>
        {fmtVotes(race.region.ballotOpen)} / {fmtVotes(race.region.ballotTotal)}{" "}
        sandık açıldı · %{fmtPct(race.region.ballotPct)}
      </p>
      <div className={styles.ballotBar} aria-hidden>
        <span style={{ width: `${Math.min(100, race.region.ballotPct)}%` }} />
      </div>

      {a && b ? (
        <div className={styles.duo}>
          <article
            className={styles.leadCard}
            style={{ borderColor: a.party?.color }}
          >
            <PartyMark candidate={a} />
            <div>
              <strong>{a.name}</strong>
              <em>{a.party?.name ?? "Bağımsız"}</em>
            </div>
            <p className={styles.bigPct}>%{fmtPct(a.percent)}</p>
            <p className={styles.votes}>{fmtVotes(a.votes)} oy</p>
            {leadGap > 0 ? (
              <span className={styles.ahead}>{fmtPct(leadGap)} puan önde</span>
            ) : null}
          </article>
          <article className={styles.secondCard}>
            <PartyMark candidate={b} />
            <div>
              <strong>{b.name}</strong>
              <em>{b.party?.name ?? "Bağımsız"}</em>
            </div>
            <p className={styles.bigPct}>%{fmtPct(b.percent)}</p>
            <p className={styles.votes}>{fmtVotes(b.votes)} oy</p>
          </article>
        </div>
      ) : null}

      <div className={styles.seg} aria-hidden>
        {race.candidates.map((c) => (
          <span
            key={c.id}
            style={{
              width: `${c.percent}%`,
              background: c.party?.color ?? "#64748B",
            }}
          />
        ))}
        <i className={styles.half} />
        <b>%50</b>
      </div>

      <ul className={styles.list}>
        {[a, b, ...rest].filter(Boolean).map((c) =>
          c ? (
            <li key={c.id}>
              <i style={{ background: c.party?.color ?? "#64748B" }} />
              <span className={styles.listName}>
                <strong>{c.name}</strong>
                <em>{c.party?.name ?? "Bağımsız"}</em>
              </span>
              <div className={styles.listBar}>
                <span
                  style={{
                    width: `${c.percent}%`,
                    background: c.party?.color ?? "#64748B",
                  }}
                />
              </div>
              <strong className={styles.listPct}>%{fmtPct(c.percent)}</strong>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}

/** Meclis koltuk dağılımı */
export function CouncilRaceBlock({ race }: { race: ApiElectionRace }) {
  const seats = race.seatCount ?? 0;
  const majority = Math.floor(seats / 2) + 1;
  const blocks: Array<{ color: string; key: string }> = [];
  for (const s of race.seats) {
    for (let i = 0; i < s.seats; i++) {
      blocks.push({ color: s.color, key: `${s.partyId}-${i}` });
    }
  }

  return (
    <section className={styles.card} aria-labelledby={`race-${race.id}`}>
      <header className={styles.head}>
        <div>
          <h2 id={`race-${race.id}`}>{race.name}</h2>
          <p className={styles.sub}>Koltuklar D&apos;Hondt yöntemiyle dağıtıldı</p>
        </div>
        <p className={styles.meta}>
          {seats} koltuk · çoğunluk için {majority}
        </p>
      </header>

      <div className={styles.seatGrid} aria-label="Koltuk dağılımı">
        {blocks.map((b) => (
          <span key={b.key} style={{ background: b.color }} />
        ))}
      </div>

      {race.note ? (
        <p
          className={
            race.noteTone === "ok"
              ? styles.noteOk
              : race.noteTone === "warn"
                ? styles.noteWarn
                : styles.note
          }
        >
          {race.note}
        </p>
      ) : null}

      <ul className={styles.seatList}>
        {race.seats.map((s) => (
          <li key={s.partyId}>
            <i style={{ background: s.color }} />
            <span>{s.partyName}</span>
            <em>
              {s.seats > 0 ? `${s.seats} koltuk` : "koltuk yok"}
            </em>
            <div className={styles.listBar}>
              <span
                style={{ width: `${s.voteShare}%`, background: s.color }}
              />
            </div>
            <strong>%{fmtPct(s.voteShare)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Cumhurbaşkanlığı — ülke vs Düzce */
export function PresidentialRaceBlock({ race }: { race: ApiElectionRace }) {
  const compare = race.compare;
  const topNational = race.candidates[0];
  const topLocal = compare?.candidates[0];
  const localNote =
    topLocal && topNational
      ? topLocal.percent >= 50
        ? `${compare!.region.name}'de ${topLocal.name} %50 eşiğini geçti — ülke ortalamasının ${fmtPct(Math.abs(topLocal.percent - topNational.percent))} puan üzerinde.`
        : race.note
      : null;

  return (
    <section className={styles.card} aria-labelledby={`race-${race.id}`}>
      <header className={styles.head}>
        <div>
          <p className={styles.live}>
            <i /> Canlı
          </p>
          <h2 id={`race-${race.id}`}>{race.name}</h2>
        </div>
        <time>{clockOf(race.updatedAt)}</time>
      </header>

      <div className={styles.cbAvatars}>
        {race.candidates.slice(0, 4).map((c) => (
          <div key={c.id}>
            <PartyMark candidate={c} />
            <strong>{c.name}</strong>
            <em>{c.party?.name}</em>
          </div>
        ))}
      </div>

      <CompareRow
        title="Türkiye geneli"
        ballotPct={race.region.ballotPct}
        candidates={race.candidates}
        updatedAt={race.updatedAt}
        source={race.region.source}
      />
      {race.note ? <p className={styles.noteWarn}>{race.note}</p> : null}

      {compare ? (
        <>
          <CompareRow
            title={compare.region.name}
            ballotPct={compare.region.ballotPct}
            candidates={compare.candidates}
            updatedAt={compare.updatedAt}
            source={compare.region.source}
          />
          {localNote ? (
            <p
              className={
                topLocal && topLocal.percent >= 50
                  ? styles.noteOk
                  : styles.noteWarn
              }
            >
              {localNote}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function CompareRow({
  title,
  ballotPct,
  candidates,
  updatedAt,
  source,
}: {
  title: string;
  ballotPct: number;
  candidates: ApiElectionRace["candidates"];
  updatedAt: string | null;
  source: string;
}) {
  return (
    <div className={styles.compare}>
      <div className={styles.compareHead}>
        <strong>{title}</strong>
        <span>
          %{fmtPct(ballotPct)} sandık
          {updatedAt ? ` · ${clockOf(updatedAt)}` : ""}
          {source === "ajans" ? " · ajans" : " · yerel"}
        </span>
      </div>
      <div className={styles.seg}>
        {candidates.map((c) => (
          <span
            key={c.id}
            style={{
              width: `${c.percent}%`,
              background: c.party?.color ?? "#64748B",
            }}
          />
        ))}
        <i className={styles.half} />
        <b>%50</b>
      </div>
      <p className={styles.compareNums}>
        {candidates.map((c, i) => (
          <span key={c.id}>
            {i > 0 ? " · " : null}
            {c.name}{" "}
            <strong style={{ color: c.party?.color }}>%{fmtPct(c.percent)}</strong>
          </span>
        ))}
      </p>
    </div>
  );
}

/** Milletvekili */
export function MpRaceBlock({ race }: { race: ApiElectionRace }) {
  const elected = race.elected ?? [];
  return (
    <section className={styles.card} aria-labelledby={`race-${race.id}`}>
      <header className={styles.head}>
        <div>
          <h2 id={`race-${race.id}`}>{race.name}</h2>
          <p className={styles.sub}>Koltuklar D&apos;Hondt yöntemiyle dağıtıldı</p>
        </div>
        <p className={styles.meta}>
          {race.seatCount} koltuk · %{fmtPct(race.region.ballotPct)} sandık
        </p>
      </header>

      {elected.length ? (
        <div className={styles.mpGrid}>
          {elected.map((c, idx) => (
            <article
              key={c.id}
              className={styles.mpCard}
              style={{ borderColor: c.party?.color }}
            >
              <PartyMark candidate={c} />
              <strong>{c.name}</strong>
              <em>
                {c.party?.name} · {(c.listOrder % 100) || idx + 1}. sıra
              </em>
            </article>
          ))}
        </div>
      ) : null}

      <h3 className={styles.h3}>Parti oy oranları</h3>
      <ul className={styles.seatList}>
        {race.seats.map((s) => (
          <li key={s.partyId}>
            <i style={{ background: s.color }} />
            <span>{s.partyName}</span>
            <em>{s.seats > 0 ? `${s.seats} vekil` : "—"}</em>
            <div className={styles.listBar}>
              <span
                style={{ width: `${s.voteShare}%`, background: s.color }}
              />
            </div>
            <strong>%{fmtPct(s.voteShare)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
