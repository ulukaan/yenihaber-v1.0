"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Radio } from "lucide-react";
import type { ApiElectionRace } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import {
  ElectionSetupPanel,
  type ElectionPartyRow,
} from "./election-setup-panel";
import { ElectionResultsPanel } from "./election-results-panel";
import { ElectionBrandPanel } from "./election-brand-panel";
import styles from "./elections.module.css";

type ElectionRow = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  status: string;
  raceCount: number;
  partyCount: number;
};

type Tab = "results" | "setup" | "brand";

const STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  live: "Canlı",
  closed: "Bitti",
};

/**
 * Seçim yönetimi — /secim Seçim Merkezi veri girişi
 */
export default function ElectionsAdminPage() {
  const [list, setList] = useState<ElectionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [races, setRaces] = useState<ApiElectionRace[]>([]);
  const [parties, setParties] = useState<ElectionPartyRow[]>([]);
  const [alliances, setAlliances] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [palette, setPalette] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("results");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const selected = useMemo(
    () => list.find((e) => e.id === selectedId) ?? null,
    [list, selectedId],
  );

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.elections.list();
      setList(res.data);
      setPalette(res.colorPalette ?? []);
      if (!selectedId && res.data[0]) setSelectedId(res.data[0].id);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadElection = useCallback(async (id: string) => {
    try {
      const res = (await adminApi.elections.get(id)) as {
        races: ApiElectionRace[];
        election?: {
          parties?: ElectionPartyRow[];
          alliances?: Array<{ id: string; name: string; color: string }>;
        };
        colorPalette?: string[];
      };
      setRaces((res.races ?? []).filter(Boolean));
      setParties(
        (res.election?.parties ?? []).map((p) => ({
          ...p,
          allianceId: p.allianceId ?? null,
        })),
      );
      setAlliances(res.election?.alliances ?? []);
      if (res.colorPalette?.length) setPalette(res.colorPalette);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seçim yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadElection(selectedId);
  }, [selectedId, loadElection]);

  async function setStatus(status: "draft" | "live" | "closed") {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      await adminApi.elections.update(selectedId, { status });
      await adminApi.elections.refreshStrip(selectedId);
      setOk(
        status === "live"
          ? "Seçim canlıya alındı — /secim’de görünür"
          : status === "closed"
            ? "Seçim bitirildi"
            : "Seçim taslağa alındı",
      );
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Durum güncellenemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <AdminPage
        title="Seçim Merkezi"
        subtitle="Sandık, oy, logo ve ittifak — canlıya al → /secim"
        wide
      >
        {error ? (
          <p className={styles.flashErr} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className={styles.flashOk} role="status">
            {ok}
          </p>
        ) : null}

        <div className={styles.layout}>
          <aside className={styles.side} aria-label="Seçimler">
            <div className={styles.sideHead}>
              <h2>Seçimler</h2>
              <span className={styles.sideCount}>{list.length}</span>
            </div>
            {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}
            <ul className={styles.sideList}>
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className={
                      selectedId === e.id ? styles.sideOn : styles.sideBtn
                    }
                    aria-pressed={selectedId === e.id}
                    onClick={() => {
                      setSelectedId(e.id);
                      setTab("results");
                    }}
                  >
                    <span className={styles.sideTitle}>{e.name}</span>
                    <span className={styles.sideMeta}>
                      <span className={styles.pill} data-status={e.status}>
                        {STATUS_LABEL[e.status] ?? e.status}
                      </span>
                      <span className={`${styles.pill} ${styles.pillSoft}`}>
                        {e.raceCount} yarış · {e.partyCount} parti
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!list.length && !loading ? (
              <p className={styles.sideEmpty}>
                Henüz seçim yok. Demo:
                <code>pnpm --filter @yenihaber/database seed:election</code>
              </p>
            ) : null}
          </aside>

          <div className={styles.main}>
            <div className={styles.mainTop}>
              <div className={styles.viewTabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "results"}
                  className={tab === "results" ? styles.tabOn : styles.tab}
                  onClick={() => setTab("results")}
                >
                  Canlı sonuç
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "setup"}
                  className={tab === "setup" ? styles.tabOn : styles.tab}
                  onClick={() => setTab("setup")}
                >
                  Parti &amp; aday
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "brand"}
                  className={tab === "brand" ? styles.tabOn : styles.tab}
                  onClick={() => setTab("brand")}
                >
                  Logo &amp; başlık
                </button>
              </div>

              {selected ? (
                <div
                  className={styles.statusBar}
                  role="group"
                  aria-label="Seçim durumu"
                >
                  <span
                    className={styles.statusBadge}
                    data-status={selected.status}
                  >
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                  {selected.status !== "live" ? (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={busy}
                      onClick={() => void setStatus("live")}
                    >
                      <Radio size={16} aria-hidden />
                      Canlıya al
                    </button>
                  ) : null}
                  {selected.status === "live" ? (
                    <button
                      type="button"
                      className={styles.warnBtn}
                      disabled={busy}
                      onClick={() => void setStatus("closed")}
                    >
                      Seçimi bitir
                    </button>
                  ) : null}
                  {selected.status !== "draft" ? (
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      disabled={busy}
                      onClick={() => void setStatus("draft")}
                    >
                      Taslağa al
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={styles.mainBody}>
              {tab === "brand" ? (
                <ElectionBrandPanel
                  electionId={selectedId}
                  electionName={selected?.name ?? ""}
                  onElectionNameSaved={(name) => {
                    setList((prev) =>
                      prev.map((e) =>
                        e.id === selectedId ? { ...e, name } : e,
                      ),
                    );
                  }}
                  onBusy={setBusy}
                  onError={setError}
                  onOk={setOk}
                />
              ) : null}

              {tab === "setup" && selectedId ? (
                <ElectionSetupPanel
                  electionId={selectedId}
                  parties={parties}
                  alliances={alliances}
                  races={races}
                  colorPalette={palette}
                  onChanged={async () => {
                    await loadElection(selectedId);
                    await loadList();
                  }}
                  onBusy={setBusy}
                  onError={setError}
                  onOk={setOk}
                />
              ) : null}

              {tab === "results" && selected ? (
                <ElectionResultsPanel
                  key={selected.id}
                  electionId={selected.id}
                  electionName={selected.name}
                  electionStatus={selected.status}
                  races={races}
                  busy={busy}
                  onBusy={setBusy}
                  onError={setError}
                  onOk={setOk}
                  onRacesChange={setRaces}
                />
              ) : null}

              {tab === "results" && !selected ? (
                <p className={styles.emptyMain}>Sol listeden seçim seçin.</p>
              ) : null}
            </div>
          </div>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
