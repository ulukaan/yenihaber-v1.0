"use client";

import { useMemo, useState } from "react";
import type { ApiElectionRace } from "@yenihaber/shared";
import { adminApi } from "@/lib/api";
import { ApiError } from "@yenihaber/api-client";
import styles from "./elections.module.css";

export type ElectionPartyRow = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoUrl: string | null;
  allianceId?: string | null;
  alliance?: { id: string; name: string; color: string } | null;
};

type AllianceRow = { id: string; name: string; color: string };

type Props = {
  electionId: string;
  parties: ElectionPartyRow[];
  alliances: AllianceRow[];
  races: ApiElectionRace[];
  colorPalette: string[];
  onChanged: () => Promise<void>;
  onBusy: (v: boolean) => void;
  onError: (msg: string) => void;
  onOk: (msg: string) => void;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toLocaleUpperCase(
      "tr-TR",
    );
  }
  return name.slice(0, 2).toLocaleUpperCase("tr-TR");
}

/**
 * Parti (renk + logo) ve aday ekleme / düzenleme paneli
 */
export function ElectionSetupPanel({
  electionId,
  parties,
  alliances,
  races,
  colorPalette,
  onChanged,
  onBusy,
  onError,
  onOk,
}: Props) {
  const [partyName, setPartyName] = useState("");
  const [partyShort, setPartyShort] = useState("");
  const [partyColor, setPartyColor] = useState(colorPalette[0] ?? "#2563EB");
  const [partyLogo, setPartyLogo] = useState<string | null>(null);
  const [partyAllianceId, setPartyAllianceId] = useState("");
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [newAllianceName, setNewAllianceName] = useState("");
  const [newAllianceColor, setNewAllianceColor] = useState("#EA580C");

  const [candRaceId, setCandRaceId] = useState(races[0]?.id ?? "");
  const [candName, setCandName] = useState("");
  const [candPartyId, setCandPartyId] = useState("");
  const [candStrip, setCandStrip] = useState(false);
  const [candStripPin, setCandStripPin] = useState<"" | "1" | "2">("");
  const [candPhoto, setCandPhoto] = useState<string | null>(null);
  const [editingCandId, setEditingCandId] = useState<string | null>(null);

  const raceCandidates = useMemo(() => {
    const race = races.find((r) => r.id === candRaceId);
    return race?.candidates ?? [];
  }, [races, candRaceId]);

  async function uploadLogo(file: File) {
    onBusy(true);
    onError("");
    try {
      const res = await adminApi.media.upload(file, {
        kind: "genel",
        alt: partyName || "Parti logosu",
      });
      setPartyLogo(res.url);
      onOk("Logo yüklendi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Logo yüklenemedi");
    } finally {
      onBusy(false);
    }
  }

  function startEditParty(p: ElectionPartyRow) {
    setEditingPartyId(p.id);
    setPartyName(p.name);
    setPartyShort(p.shortName);
    setPartyColor(p.color);
    setPartyLogo(p.logoUrl);
    setPartyAllianceId(p.allianceId ?? "");
  }

  function resetPartyForm() {
    setEditingPartyId(null);
    setPartyName("");
    setPartyShort("");
    setPartyColor(colorPalette[0] ?? "#2563EB");
    setPartyLogo(null);
    setPartyAllianceId("");
  }

  async function saveParty(forceColor = false) {
    if (!partyName.trim() || !partyColor) return;
    onBusy(true);
    onError("");
    try {
      const body = {
        name: partyName.trim(),
        shortName: partyShort.trim(),
        color: partyColor,
        logoUrl: partyLogo,
        allianceId: partyAllianceId || null,
        forceColor,
      };
      if (editingPartyId) {
        await adminApi.elections.updateParty(editingPartyId, body);
      } else {
        await adminApi.elections.createParty(electionId, body);
      }
      resetPartyForm();
      await onChanged();
      onOk(editingPartyId ? "Parti güncellendi" : "Parti eklendi");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && !forceColor) {
        const okForce = window.confirm(
          e.message || "Renk çok yakın. Yine de kaydedilsin mi?",
        );
        if (okForce) {
          await saveParty(true);
          return;
        }
        return;
      }
      onError(e instanceof Error ? e.message : "Parti kaydedilemedi");
    } finally {
      onBusy(false);
    }
  }

  async function saveAlliance() {
    if (!newAllianceName.trim()) return;
    onBusy(true);
    onError("");
    try {
      await adminApi.elections.createAlliance(electionId, {
        name: newAllianceName.trim(),
        color: newAllianceColor,
      });
      setNewAllianceName("");
      await onChanged();
      onOk("İttifak eklendi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "İttifak eklenemedi");
    } finally {
      onBusy(false);
    }
  }

  async function removeParty(id: string) {
    if (!window.confirm("Parti silinsin mi? Bağlı adaylar partiden ayrılır.")) {
      return;
    }
    onBusy(true);
    try {
      await adminApi.elections.deleteParty(id);
      if (editingPartyId === id) resetPartyForm();
      await onChanged();
      onOk("Parti silindi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Parti silinemedi");
    } finally {
      onBusy(false);
    }
  }

  function startEditCand(c: {
    id: string;
    name: string;
    party: { id: string } | null;
    showInStrip: boolean;
    stripPin?: number | null;
    photoUrl?: string | null;
  }) {
    setEditingCandId(c.id);
    setCandName(c.name);
    setCandPartyId(c.party?.id ?? "");
    setCandStrip(c.showInStrip);
    setCandStripPin(
      c.stripPin === 1 || c.stripPin === 2 ? String(c.stripPin) : "",
    );
    setCandPhoto(c.photoUrl ?? null);
  }

  function resetCandForm() {
    setEditingCandId(null);
    setCandName("");
    setCandPartyId("");
    setCandStrip(false);
    setCandStripPin("");
    setCandPhoto(null);
  }

  async function uploadCandPhoto(file: File) {
    onBusy(true);
    onError("");
    try {
      const res = await adminApi.media.upload(file, {
        kind: "genel",
        alt: candName || "Aday fotoğrafı",
      });
      setCandPhoto(res.url);
      onOk("Aday fotoğrafı yüklendi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Fotoğraf yüklenemedi");
    } finally {
      onBusy(false);
    }
  }

  async function saveCandidate() {
    if (!candRaceId || !candName.trim()) return;
    onBusy(true);
    onError("");
    try {
      const body = {
        name: candName.trim(),
        partyId: candPartyId || null,
        initials: initialsOf(candName),
        showInStrip: candStrip || candStripPin !== "",
        stripPin: candStripPin === "" ? null : Number(candStripPin),
        photoUrl: candPhoto,
      };
      if (editingCandId) {
        await adminApi.elections.updateCandidate(editingCandId, body);
      } else {
        await adminApi.elections.createCandidate(candRaceId, body);
      }
      resetCandForm();
      await onChanged();
      onOk(editingCandId ? "Aday güncellendi" : "Aday eklendi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Aday kaydedilemedi");
    } finally {
      onBusy(false);
    }
  }

  async function removeCandidate(id: string) {
    if (!window.confirm("Aday silinsin mi?")) return;
    onBusy(true);
    try {
      await adminApi.elections.deleteCandidate(id);
      if (editingCandId === id) resetCandForm();
      await onChanged();
      onOk("Aday silindi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Aday silinemedi");
    } finally {
      onBusy(false);
    }
  }

  return (
    <div className={styles.setup}>
      <section className={styles.setupCard} aria-labelledby="party-form-title">
        <h2 id="party-form-title">
          {editingPartyId ? "Parti düzenle" : "Yeni parti"}
        </h2>
        <p className={styles.setupLead}>
          Logo, renk ve ittifak — sitede satırda görünür.
        </p>
        <div className={styles.formGrid}>
          <label>
            Parti adı
            <input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Örn. A Partisi"
              aria-label="Parti adı"
            />
          </label>
          <label>
            Kısa ad
            <input
              value={partyShort}
              onChange={(e) => setPartyShort(e.target.value)}
              placeholder="Örn. A"
              aria-label="Kısa ad"
            />
          </label>
          <label className={styles.span2}>
            İttifak (hemicycle / meclis kartları)
            <select
              value={partyAllianceId}
              onChange={(e) => setPartyAllianceId(e.target.value)}
              aria-label="İttifak"
            >
              <option value="">İttifaksız / diğer</option>
              {alliances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.allianceCreate}>
          <span className={styles.fieldLabel}>Yeni ittifak</span>
          <div className={styles.logoRow}>
            <input
              value={newAllianceName}
              onChange={(e) => setNewAllianceName(e.target.value)}
              placeholder="Örn. Cumhur İttifakı"
              aria-label="İttifak adı"
            />
            <input
              type="color"
              value={newAllianceColor}
              onChange={(e) => setNewAllianceColor(e.target.value.toUpperCase())}
              aria-label="İttifak rengi"
            />
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => void saveAlliance()}
            >
              İttifak ekle
            </button>
          </div>
        </div>

        <div className={styles.colorBlock}>
          <span className={styles.fieldLabel}>Parti rengi</span>
          <div className={styles.swatches} role="listbox" aria-label="Renk paleti">
            {colorPalette.map((hex) => (
              <button
                key={hex}
                type="button"
                role="option"
                aria-selected={partyColor === hex}
                aria-label={hex}
                className={
                  partyColor === hex ? styles.swatchOn : styles.swatch
                }
                style={{ background: hex }}
                onClick={() => setPartyColor(hex)}
              />
            ))}
          </div>
          <label className={styles.hexRow}>
            Özel renk
            <input
              type="color"
              value={partyColor}
              onChange={(e) => setPartyColor(e.target.value.toUpperCase())}
              aria-label="Özel parti rengi"
            />
            <input
              value={partyColor}
              onChange={(e) => setPartyColor(e.target.value.toUpperCase())}
              pattern="^#[0-9A-Fa-f]{6}$"
              aria-label="Renk hex kodu"
            />
          </label>
        </div>

        <div className={styles.logoBlock}>
          <span className={styles.fieldLabel}>Parti logosu</span>
          <div className={styles.logoRow}>
            {partyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partyLogo} alt="" className={styles.logoPreview} />
            ) : (
              <span
                className={styles.logoFallback}
                style={{ background: partyColor }}
                aria-hidden
              />
            )}
            <label className={styles.fileBtn}>
              Logo yükle
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                  e.target.value = "";
                }}
              />
            </label>
            {partyLogo ? (
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setPartyLogo(null)}
              >
                Logoyu kaldır
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => void saveParty()}
          >
            {editingPartyId ? "Parti güncelle" : "Parti ekle"}
          </button>
          {editingPartyId ? (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={resetPartyForm}
            >
              Vazgeç
            </button>
          ) : null}
        </div>

        <ul className={styles.partyList}>
          {parties.map((p) => (
            <li key={p.id}>
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" className={styles.partyLogo} />
              ) : (
                <i style={{ background: p.color }} />
              )}
              <div>
                <strong>{p.name}</strong>
                <span>
                  {p.shortName} · {p.color}
                  {p.logoUrl ? " · logo ✓" : " · logo yok"}
                  {p.allianceId
                    ? ` · ${
                        p.alliance?.name ??
                        alliances.find((a) => a.id === p.allianceId)?.name ??
                        "ittifak"
                      }`
                    : " · ittifaksız"}
                </span>
              </div>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => startEditParty(p)}
              >
                Düzenle
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => void removeParty(p.id)}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.setupCard} aria-labelledby="cand-form-title">
        <h2 id="cand-form-title">
          {editingCandId ? "Aday düzenle" : "Yeni aday"}
        </h2>
        <p className={styles.setupLead}>
          Aday fotoğrafı ve parti bağlantısı.
        </p>
        <div className={styles.formGrid}>
          <label>
            Yarış
            <select
              value={candRaceId}
              onChange={(e) => {
                setCandRaceId(e.target.value);
                resetCandForm();
              }}
              aria-label="Yarış seç"
            >
              {races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Parti
            <select
              value={candPartyId}
              onChange={(e) => setCandPartyId(e.target.value)}
              aria-label="Parti seç"
            >
              <option value="">Bağımsız</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.span2}>
            Aday adı
            <input
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              placeholder="Ad Soyad"
              aria-label="Aday adı"
            />
          </label>
        </div>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={candStrip}
            onChange={(e) => setCandStrip(e.target.checked)}
          />
          Üst şeritte göster
        </label>
        <label>
          Sabit slot (1–2)
          <select
            value={candStripPin}
            onChange={(e) => {
              const v = e.target.value as "" | "1" | "2";
              setCandStripPin(v);
              if (v) setCandStrip(true);
            }}
            aria-label="Şerit sabit slot"
          >
            <option value="">Yok — oy sırasına göre döner</option>
            <option value="1">1. sabit</option>
            <option value="2">2. sabit</option>
          </select>
        </label>

        <div className={styles.logoBlock}>
          <span className={styles.fieldLabel}>Aday fotoğrafı (/secim)</span>
          <div className={styles.logoRow}>
            {candPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={candPhoto} alt="" className={styles.logoPreview} />
            ) : (
              <span className={styles.logoFallback} aria-hidden />
            )}
            <label className={styles.fileBtn}>
              Foto yükle
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCandPhoto(f);
                  e.target.value = "";
                }}
              />
            </label>
            {candPhoto ? (
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setCandPhoto(null)}
              >
                Kaldır
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!candRaceId}
            onClick={() => void saveCandidate()}
          >
            {editingCandId ? "Aday güncelle" : "Aday ekle"}
          </button>
          {editingCandId ? (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={resetCandForm}
            >
              Vazgeç
            </button>
          ) : null}
        </div>

        <ul className={styles.candList}>
          {raceCandidates.map((c) => (
            <li key={c.id}>
              <i style={{ background: c.party?.color ?? "#64748B" }} />
              <div>
                <strong>{c.name}</strong>
                <span>
                  {c.party?.name ?? "Bağımsız"}
                  {c.showInStrip ? " · şerit" : ""}
                  {c.stripPin === 1 || c.stripPin === 2
                    ? ` · sabit ${c.stripPin}`
                    : ""}
                </span>
              </div>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => startEditCand(c)}
              >
                Düzenle
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => void removeCandidate(c.id)}
              >
                Sil
              </button>
            </li>
          ))}
          {!raceCandidates.length ? (
            <li className={styles.listEmpty}>
              <p className={styles.muted}>Bu yarışta henüz aday yok.</p>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
