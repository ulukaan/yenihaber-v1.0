"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import type {
  ApiCategory,
  MansetBreaking,
  MansetCandidate,
  MansetLogEntry,
  MansetPanelResponse,
  MansetSettings,
  MansetSlot,
} from "@yenihaber/shared";
import {
  DEFAULT_MANSET_SETTINGS,
  defaultBreakingExpiresAt,
  mansetSlotCountForKind,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import { CandidateList, SlotBoard } from "./slot-board";
import { LayoutPicker } from "./manset-preview";
import { SlotDetailEditor } from "./slot-detail";
import styles from "./manset.module.css";

type Tab = "ana" | "kategori" | "sondakika" | "log";

const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default function MansetPage() {
  const [tab, setTab] = useState<Tab>("ana");
  const [kind, setKind] = useState("home");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [panel, setPanel] = useState<MansetPanelResponse | null>(null);
  const [slots, setSlots] = useState<MansetSlot[]>([]);
  const [breaking, setBreaking] = useState<MansetBreaking | null>(null);
  const [candidates, setCandidates] = useState<MansetCandidate[]>([]);
  const [only48h, setOnly48h] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [logs, setLogs] = useState<MansetLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [localDirty, setLocalDirty] = useState(false);
  const [settings, setSettings] = useState<MansetSettings | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);

  const locked = Boolean(panel?.lock.byMe);
  const blocked = Boolean(panel?.lock.held && !panel.lock.byMe);

  const applyPanel = useCallback((p: MansetPanelResponse) => {
    setPanel(p);
    setSlots(
      p.slots.map((s) => ({
        slot: s.slot,
        articleId: s.article?.id ?? null,
        headlineTitle: s.headlineTitle ?? null,
        kicker: s.kicker ?? null,
        spot: s.spot ?? null,
        badgeText: s.badgeText ?? null,
        badgeColor: s.badgeColor ?? null,
        badgeExpiresAt: s.badgeExpiresAt ?? null,
      })),
    );
    setBreaking(p.breaking);
    if (p.settings) setSettings(p.settings);
    setLocalDirty(false);
  }, []);

  const load = useCallback(async (k = kind) => {
    setLoading(true);
    setError("");
    try {
      const [p, cand] = await Promise.all([
        adminApi.manset.panel(k),
        adminApi.manset.candidates(k, only48h ? 48 : undefined),
      ]);
      applyPanel(p);
      setCandidates(cand.data);
      setSelectedSlot(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [kind, only48h, applyPanel]);

  useEffect(() => {
    void adminApi.categories.list().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    void load(kind);
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void adminApi.manset
      .candidates(kind, only48h ? 48 : undefined)
      .then((r) => setCandidates(r.data))
      .catch(() => undefined);
  }, [only48h, kind]);

  /** Kilit heartbeat 15 sn */
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => {
      void adminApi.manset.heartbeat(kind).catch(() => undefined);
    }, 15_000);
    return () => clearInterval(id);
  }, [locked, kind]);

  useEffect(() => {
    if (tab !== "log") return;
    void adminApi.manset
      .log(kind)
      .then((r) => setLogs(r.data))
      .catch(() => undefined);
  }, [tab, kind]);

  const usedIds = useMemo(
    () => new Set(slots.map((s) => s.articleId).filter(Boolean) as string[]),
    [slots],
  );

  const dirtyCount =
    (panel?.dirtyCount ?? 0) + (localDirty ? 1 : 0) || (localDirty ? 1 : 0);

  function touchSlots(next: MansetSlot[]) {
    setSlots(next);
    setLocalDirty(true);
  }

  function moveSlot(slot: number, dir: -1 | 1) {
    const idx = slots.findIndex((s) => s.slot === slot);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= slots.length) return;
    const next = slots.map((s) => ({ ...s }));
    const a = next[idx]!.articleId;
    next[idx]!.articleId = next[target]!.articleId;
    next[target]!.articleId = a;
    touchSlots(next);
    setSelectedSlot(next[target]!.slot);
  }

  function clearSlot(slot: number) {
    touchSlots(
      slots.map((s) => (s.slot === slot ? { ...s, articleId: null } : s)),
    );
  }

  function assignToSlot(slot: number, articleId: string) {
    const cand = candidates.find((c) => c.id === articleId);
    if (!cand?.hasMansetCover) {
      setError("Kapak olmadan manşete alınamaz");
      return;
    }
    const next = slots.map((s) => {
      if (s.articleId === articleId) return { ...s, articleId: null };
      if (s.slot === slot) return { ...s, articleId };
      return s;
    });
    touchSlots(next);
  }

  function assignToSelected(articleId: string) {
    assignToSlot(selectedSlot, articleId);
  }

  async function takeLock() {
    setBusy(true);
    setError("");
    try {
      applyPanel(await adminApi.manset.lock(kind));
      setMessage("Kilit alındı — düzenleyebilirsiniz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kilit alınamadı");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!locked) {
      setError("Önce kilidi alın");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload: MansetBreaking | null =
        kind === "home"
          ? breaking ?? {
              enabled: false,
              text: "",
              url: null,
              expiresAt: null,
            }
          : null;
      if (payload?.enabled && !payload.expiresAt) {
        payload.expiresAt = defaultBreakingExpiresAt();
      }
      const p = await adminApi.manset.saveDraft({
        kind,
        slots,
        breaking: payload,
      });
      applyPanel(p);
      setMessage("Taslak kaydedildi (canlıya çıkmadı)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Taslak kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!locked) {
      setError("Önce kilidi alın");
      return;
    }
    if (localDirty) {
      await saveDraft();
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const p = await adminApi.manset.publish(kind);
      applyPanel(p);
      setMessage("Yayınlandı — ana sayfa yenilendi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yayın başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function toggleEmergency(next: boolean) {
    setSettingsBusy(true);
    setError("");
    try {
      const res = await adminApi.manset.updateSettings({ emergency: next });
      setSettings(res.settings);
      setMessage(
        next
          ? "Olağanüstü: otomatik geçiş durdu (ilk slayt sabit)"
          : "Olağanüstü kapandı — sürgü autoplay açık",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ayar kaydedilemedi");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function saveAutoplay(patch: {
    autoplay?: boolean;
    autoplaySec?: number;
    desktopLimit?: number;
    mainLimit?: number;
  }) {
    setSettingsBusy(true);
    try {
      const res = await adminApi.manset.updateSettings(patch);
      setSettings(res.settings);
      setMessage(
        patch.desktopLimit !== undefined
          ? `Sürgü sayısı: ${res.settings.desktopLimit}`
          : "Sürgü ayarları güncellendi",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ayar kaydedilemedi");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function saveFeaturedFill(
    fill: MansetSettings["featured"]["fill"],
  ) {
    setSettingsBusy(true);
    try {
      const base = settings ?? DEFAULT_MANSET_SETTINGS;
      const res = await adminApi.manset.updateSettings({
        featured: { ...base.featured, fill },
      });
      setSettings(res.settings);
      setMessage("Öne çıkan doldurma güncellendi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ayar kaydedilemedi");
    } finally {
      setSettingsBusy(false);
    }
  }

  const panelSlotsView = useMemo(() => {
    if (!panel) return [];
    return panel.slots.map((s) => {
      const id = slots.find((x) => x.slot === s.slot)?.articleId ?? null;
      if (id === (s.article?.id ?? null)) return s;
      const cand = candidates.find((c) => c.id === id);
      return {
        ...s,
        article: cand
          ? cand
          : id
            ? s.article?.id === id
              ? s.article
              : null
            : null,
        empty: !id && !cand,
      };
    });
  }, [panel, slots, candidates]);

  // enrich from candidates for local edits
  const displaySlots = useMemo(() => {
    if (!panel) return [];
    return slots.map((slot) => {
      const base = panel.slots.find((p) => p.slot === slot.slot);
      let article = base?.article ?? null;
      if (slot.articleId) {
        if (article?.id !== slot.articleId) {
          const c = candidates.find((x) => x.id === slot.articleId);
          article = c ?? article;
        }
      } else {
        article = null;
      }
      return {
        slot: slot.slot,
        label: base?.label ?? `Slot ${slot.slot}`,
        article,
        empty: !article,
        warning: null,
      };
    });
  }, [panel, slots, candidates]);

  const lastChangeLabel = panel?.lastChange
    ? `${new Date(panel.lastChange.at).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })}${panel.lastChange.by ? ` · ${panel.lastChange.by.name}` : ""}`
    : "—";

  function setBreakingField<K extends keyof MansetBreaking>(
    key: K,
    value: MansetBreaking[K],
  ) {
    setBreaking((prev) => {
      const base: MansetBreaking = prev ?? {
        enabled: false,
        text: "",
        url: null,
        expiresAt: null,
      };
      const next = { ...base, [key]: value };
      if (key === "enabled" && value === true && !next.expiresAt) {
        next.expiresAt = defaultBreakingExpiresAt();
      }
      return next;
    });
    setLocalDirty(true);
  }

  return (
    <AdminShell>
      <AdminPage
        title="Manşet & Son Dakika"
        subtitle="Editöryel manşet · sürgü + sağ liste · yayınla. Olağanüstü günde otomatik geçiş durur."
        wide
        className={styles.page}
        actions={
          <div className={styles.headActions}>
            {kind === "home" ? (
              <label className={styles.emergency}>
                <input
                  type="checkbox"
                  checked={Boolean(settings?.emergency)}
                  disabled={settingsBusy}
                  onChange={(e) => void toggleEmergency(e.target.checked)}
                />
                <span>Olağanüstü (sürgüyü sabitle)</span>
              </label>
            ) : null}
            <a
              className={styles.secondaryBtn}
              href={WEB_URL}
              target="_blank"
              rel="noreferrer"
            >
              Siteyi aç
            </a>
            {!locked ? (
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={busy || blocked}
                onClick={() => void takeLock()}
              >
                Kilidi al
              </button>
            ) : (
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={busy}
                onClick={() => void saveDraft()}
              >
                Taslağı kaydet
              </button>
            )}
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={busy || blocked || !locked}
              onClick={() => void publish()}
            >
              {panel?.unpublished ? "Yayınla (siteye gönder)" : "Yayınla"}
            </button>
          </div>
        }
      >
        <nav className={styles.tabs} aria-label="Manşet sekmeleri">
          <button
            type="button"
            className={tab === "ana" ? styles.tabOn : styles.tab}
            onClick={() => {
              setTab("ana");
              setKind("home");
            }}
          >
            Ana manşet
          </button>
          <button
            type="button"
            className={tab === "kategori" ? styles.tabOn : styles.tab}
            onClick={() => setTab("kategori")}
          >
            Kategori vitrinleri
          </button>
          <button
            type="button"
            className={tab === "sondakika" ? styles.tabOn : styles.tab}
            onClick={() => {
              setTab("sondakika");
              setKind("home");
            }}
          >
            Son dakika
          </button>
          <button
            type="button"
            className={tab === "log" ? styles.tabOn : styles.tab}
            onClick={() => setTab("log")}
          >
            Günlük
          </button>
        </nav>

        {blocked ? (
          <p className={styles.lockBanner} role="status">
            Kilit: {panel?.lock.lockedBy?.name ?? "başka editör"} düzenliyor
            {panel?.lock.expiresAt
              ? ` (bitiş ${new Date(panel.lock.expiresAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })})`
              : ""}
          </p>
        ) : null}

        {panel?.warnings?.length ? (
          <ul className={styles.warnList}>
            {panel.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className={styles.ok}>{message}</p> : null}
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        {tab === "kategori" ? (
          <div className={styles.catPick}>
            <label htmlFor="cat-showcase">
              Kategori
              <select
                id="cat-showcase"
                value={kind.startsWith("cat:") ? kind.slice(4) : ""}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) setKind(`cat:${id}`);
                }}
              >
                <option value="">Seçin…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.muted}>
              Kategori başına 1 öne çıkan + 3 satır (sabit)
            </p>
          </div>
        ) : null}

        {(tab === "ana" || (tab === "kategori" && kind.startsWith("cat:"))) &&
        !loading &&
        panel ? (
          <>
            {tab === "ana" ? (
              <>
                <LayoutPicker />
                <div className={styles.featuredBar}>
                  <label>
                    Öne çıkan doldurma
                    <select
                      value={settings?.featured.fill ?? "hybrid"}
                      disabled={settingsBusy}
                      onChange={(e) =>
                        void saveFeaturedFill(
                          e.target.value as MansetSettings["featured"]["fill"],
                        )
                      }
                    >
                      <option value="hybrid">Karma (2 sabit + otomatik)</option>
                      <option value="editor">Editör seçimi</option>
                      <option value="auto">Otomatik</option>
                    </select>
                  </label>
                  <label className={styles.emergency}>
                    <input
                      type="checkbox"
                      checked={settings?.autoplay !== false}
                      disabled={settingsBusy || Boolean(settings?.emergency)}
                      onChange={(e) =>
                        void saveAutoplay({ autoplay: e.target.checked })
                      }
                    />
                    <span>Otomatik geçiş</span>
                  </label>
                  <label>
                    Sürgü haber sayısı
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={settings?.desktopLimit ?? 12}
                      disabled={settingsBusy}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        void saveAutoplay({
                          desktopLimit: Math.min(24, Math.max(1, Math.round(n))),
                          mainLimit: Math.min(24, Math.max(1, Math.round(n))),
                        });
                      }}
                    />
                  </label>
                  <label>
                    Geçiş süresi (sn)
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={settings?.autoplaySec ?? 6}
                      disabled={settingsBusy}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        void saveAutoplay({
                          autoplaySec: Math.min(30, Math.max(3, Math.round(n))),
                        });
                      }}
                    />
                  </label>
                  <p className={styles.muted}>
                    Haber formunda «Manşete al» işaretlenenler buraya düşer.
                    Sayıyı 1–24 arası ayarlayın; Ayarlar → İçerik ile aynı alan.
                  </p>
                </div>
              </>
            ) : null}
            <div className={styles.workspace}>
              <SlotBoard
                title="Yayındaki düzen (taslak)"
                slots={displaySlots.length ? displaySlots : panelSlotsView}
                selectedSlot={selectedSlot}
                disabled={!locked || blocked}
                onSelectSlot={setSelectedSlot}
                onClear={clearSlot}
                onMove={moveSlot}
                onDropArticle={assignToSlot}
              />
              <CandidateList
                items={candidates}
                only48h={only48h}
                onOnly48h={setOnly48h}
                usedIds={usedIds}
                disabled={!locked || blocked}
                onAssign={assignToSelected}
              />
            </div>
            {tab === "ana" && selectedSlot ? (
              <SlotDetailEditor
                slot={slots.find((s) => s.slot === selectedSlot) ?? null}
                articleTitle={
                  displaySlots.find((s) => s.slot === selectedSlot)?.article
                    ?.title ?? ""
                }
                disabled={!locked || blocked}
                onChange={(patch) => {
                  touchSlots(
                    slots.map((s) =>
                      s.slot === selectedSlot ? { ...s, ...patch } : s,
                    ),
                  );
                }}
              />
            ) : null}
          </>
        ) : null}

        {tab === "sondakika" && !loading ? (
          <section className={styles.breakingPanel} aria-labelledby="brk-title">
            <h2 id="brk-title">Son dakika bandı</h2>
            <div className={styles.breakingBar}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={Boolean(breaking?.enabled)}
                  disabled={!locked}
                  onChange={(e) => setBreakingField("enabled", e.target.checked)}
                />
                <span>Açık</span>
              </label>
              <input
                className={styles.breakingInput}
                placeholder="Son dakika: …"
                value={breaking?.text ?? ""}
                disabled={!locked || !breaking?.enabled}
                onChange={(e) => setBreakingField("text", e.target.value)}
                maxLength={180}
              />
              <label className={styles.expires}>
                <Clock size={14} aria-hidden />
                <span className={styles.srOnly}>Bitiş</span>
                <input
                  type="datetime-local"
                  disabled={!locked || !breaking?.enabled}
                  value={
                    breaking?.expiresAt
                      ? toLocalInput(breaking.expiresAt)
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setBreakingField(
                      "expiresAt",
                      v ? new Date(v).toISOString() : defaultBreakingExpiresAt(),
                    );
                  }}
                />
              </label>
            </div>
            <p className={styles.hint}>
              Bitiş zorunlu (varsayılan +3 saat). Süre dolunca bant kapanır.
            </p>
          </section>
        ) : null}

        {tab === "log" ? (
          <section className={styles.logPanel}>
            <h2 className={styles.colTitle}>Değişiklik günlüğü</h2>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Editör</th>
                  <th>İşlem</th>
                  <th>Özet</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {new Date(l.createdAt).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{l.actor?.name ?? "—"}</td>
                    <td>{l.action}</td>
                    <td>{l.summary}</td>
                  </tr>
                ))}
                {!logs.length ? (
                  <tr>
                    <td colSpan={4}>Kayıt yok</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        ) : null}

        {(tab === "ana" || tab === "kategori" || tab === "sondakika") && (
          <section className={styles.breakingPreview}>
            {kind === "home" && breaking?.enabled && breaking.text ? (
              <div className={styles.breakingBarLive}>
                <span className={styles.toggleDot} />
                <span>Son dakika: {breaking.text}</span>
                {breaking.expiresAt ? (
                  <span className={styles.expireHint}>
                    <Clock size={12} />{" "}
                    {new Date(breaking.expiresAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    &apos;da kalkar
                  </span>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

        <footer className={styles.foot}>
          <span>Son değişiklik: {lastChangeLabel}</span>
          <span className={dirtyCount > 0 ? styles.dirty : styles.muted}>
            {dirtyCount > 0
              ? `Yayınlanmamış ${dirtyCount} değişiklik`
              : "Canlı ile taslak aynı"}
          </span>
          <span className={styles.muted}>
            Sabit slot: {mansetSlotCountForKind(kind)}
          </span>
        </footer>
      </AdminPage>
    </AdminShell>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
