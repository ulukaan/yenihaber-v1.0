"use client";

import { useId, useState } from "react";
import Link from "next/link";
import type { ApiSportMatch, ApiSports } from "@yenihaber/shared";
import styles from "./sport-panel.module.css";

type Tab = "live" | "fixtures" | "table";

function isLiveMinute(minute: string, status?: ApiSportMatch["status"]) {
  if (status === "live") return true;
  return minute.endsWith("'") || minute === "HT" || minute === "ET" || minute === "Canlı";
}

/** Skor panosu: canlı → son skor → yaklaşan program */
function boardMatches(data: ApiSports): ApiSportMatch[] {
  if (data.live.length) return data.live.slice(0, 6);
  if (data.recent.length) return data.recent.slice(0, 6);
  return data.fixtures.slice(0, 6).map((f) => ({
    id: f.id,
    league: f.league,
    home: f.home,
    away: f.away,
    homeScore: 0,
    awayScore: 0,
    minute: f.time,
    status: "scheduled" as const,
    kickoff: f.kickoff,
  }));
}

export type SportPanelViewProps = {
  data: ApiSports;
};

/** Sporda canlı skor / program / puan — gerçek veri (ESPN) */
export function SportPanelView({ data }: SportPanelViewProps) {
  const baseId = useId();
  const [tab, setTab] = useState<Tab>("live");
  const matches = boardMatches(data);
  const table = data.standings.slice(0, 5);
  const standings = data.standings;
  const hasLive = data.live.length > 0;
  const boardMode = hasLive
    ? "live"
    : data.recent.length
      ? "recent"
      : "upcoming";

  const tabs: { id: Tab; label: string }[] = [
    {
      id: "live",
      label:
        boardMode === "live"
          ? "Canlı"
          : boardMode === "recent"
            ? "Skor"
            : "Maçlar",
    },
    { id: "fixtures", label: "Program" },
    { id: "table", label: "Puan durumu" },
  ];

  return (
    <section className={styles.wrap} aria-label="Spor özeti">
      <header className={styles.head}>
        <div className={styles.headLeft}>
          <span className={styles.bar} aria-hidden />
          <div className={styles.headTitles}>
            <h2>Spor</h2>
            <p className={styles.headSub}>
              {data.leagueName}
              {data.source === "espn" ? " · güncel" : " · yedek veri"}
            </p>
          </div>
          <span
            className={styles.liveTag}
            data-active={hasLive && tab === "live" ? "true" : "false"}
          >
            <i className={styles.pulse} aria-hidden />
            {boardMode === "live"
              ? "Canlı skor"
              : boardMode === "recent"
                ? "Son skorlar"
                : "Yaklaşan"}
          </span>
        </div>

        <nav className={styles.controls} aria-label="Spor paneli">
          <div className={styles.tabs} role="tablist" aria-label="Spor panelleri">
            {tabs.map((t) => {
              const selected = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  className={selected ? styles.tabActive : styles.tab}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <Link href="/kategori/spor" className={styles.more}>
            Tüm maçlar
            <span className={styles.moreArrow} aria-hidden>
              →
            </span>
          </Link>
        </nav>
      </header>

      <div
        className={styles.body}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${tab}`}
      >
        {tab === "live" ? (
          <div className={styles.liveLayout}>
            {matches.length ? (
              <ul className={styles.matchBoard}>
                {matches.map((m) => {
                  const live = isLiveMinute(m.minute, m.status);
                  return (
                    <li key={m.id} className={styles.match}>
                      <div className={styles.matchMeta}>
                        <span className={styles.league}>{m.league}</span>
                        <span
                          className={
                            live ? styles.minuteLive : styles.minuteDone
                          }
                        >
                          {live ? <i className={styles.dot} aria-hidden /> : null}
                          {m.minute}
                        </span>
                      </div>

                      <div className={styles.teams}>
                        <div className={styles.side}>
                          <span className={styles.crest} aria-hidden>
                            {m.home.slice(0, 2).toLocaleUpperCase("tr-TR")}
                          </span>
                          <span className={styles.teamName}>{m.home}</span>
                          <strong className={styles.goals}>
                            {m.status === "scheduled" ? "—" : m.homeScore}
                          </strong>
                        </div>
                        <div className={styles.side}>
                          <span className={styles.crest} aria-hidden>
                            {m.away.slice(0, 2).toLocaleUpperCase("tr-TR")}
                          </span>
                          <span className={styles.teamName}>{m.away}</span>
                          <strong className={styles.goals}>
                            {m.status === "scheduled" ? "—" : m.awayScore}
                          </strong>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.empty}>Şu an gösterilecek maç yok.</p>
            )}

            <aside className={styles.tableAside} aria-label="Puan durumu özeti">
              <div className={styles.asideHead}>
                <h3>{data.leagueName}</h3>
                <span>Puan</span>
              </div>
              {table.length ? (
                <ol className={styles.rankList}>
                  {table.map((r) => (
                    <li key={r.team}>
                      <span
                        className={r.pos <= 3 ? styles.posTop : styles.pos}
                      >
                        {r.pos}
                      </span>
                      <span className={styles.rankTeam}>{r.team}</span>
                      <span className={styles.rankPlayed}>{r.played}</span>
                      <strong className={styles.rankPts}>{r.pts}</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.emptyCompact}>Puan durumu yüklenemedi.</p>
              )}
              <button
                type="button"
                className={styles.asideLink}
                onClick={() => setTab("table")}
              >
                Tamamını gör
              </button>
            </aside>
          </div>
        ) : null}

        {tab === "fixtures" ? (
          data.fixtures.length ? (
            <ul className={styles.fixtures}>
              {data.fixtures.map((f) => (
                <li key={f.id}>
                  <div className={styles.fixTime}>
                    <time dateTime={f.kickoff ?? undefined}>{f.time}</time>
                    <span>{f.league}</span>
                  </div>
                  <div className={styles.fixTeams}>
                    <span>{f.home}</span>
                    <em>vs</em>
                    <span>{f.away}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Yaklaşan maç programı yok.</p>
          )
        ) : null}

        {tab === "table" ? (
          standings.length ? (
            <div className={styles.tableFull}>
              <table>
                <caption className={styles.srOnly}>
                  {data.leagueName} puan durumu
                </caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Takım</th>
                    <th scope="col">O</th>
                    <th scope="col">P</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((r) => (
                    <tr
                      key={r.team}
                      className={r.pos <= 3 ? styles.rowTop : undefined}
                    >
                      <td>
                        <span
                          className={r.pos <= 3 ? styles.posTop : styles.pos}
                        >
                          {r.pos}
                        </span>
                      </td>
                      <td className={styles.tableTeam}>{r.team}</td>
                      <td>{r.played}</td>
                      <td>
                        <strong>{r.pts}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.empty}>Puan durumu yüklenemedi.</p>
          )
        ) : null}
      </div>
    </section>
  );
}
