"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { adminApi } from "@/lib/api";
import styles from "./elections.module.css";

type Props = {
  electionId: string | null;
  electionName: string;
  onElectionNameSaved: (name: string) => void;
  onBusy: (v: boolean) => void;
  onError: (msg: string) => void;
  onOk: (msg: string) => void;
};

/**
 * /secim: seçim adı (h1) + kırmızı bar logo/yazılar
 */
export function ElectionBrandPanel({
  electionId,
  electionName,
  onElectionNameSaved,
  onBusy,
  onError,
  onOk,
}: Props) {
  const [title, setTitle] = useState(electionName);
  const [brandName, setBrandName] = useState("");
  const [label, setLabel] = useState("");
  const [logo, setLogo] = useState("");
  const [siteLogoDark, setSiteLogoDark] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle(electionName);
  }, [electionName, electionId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const bundle = await adminApi.settings.admin();
        const c = bundle.byGroup.content ?? {};
        const s = bundle.byGroup.site ?? {};
        if (cancelled) return;
        setBrandName(c["content.electionCenterName"] ?? "");
        setLabel(c["content.electionCenterLabel"] ?? "");
        setLogo(c["content.electionCenterLogo"] ?? "");
        setSiteLogoDark(s["site.logoDark"] ?? "");
      } catch (e) {
        if (!cancelled) {
          onError(
            e instanceof Error ? e.message : "Marka ayarları yüklenemedi",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  async function uploadLogo(file: File) {
    onBusy(true);
    onError("");
    try {
      const res = await adminApi.media.upload(file, {
        kind: "genel",
        alt: "Seçim Merkezi logo",
      });
      setLogo(res.url);
      onOk("Logo yüklendi — kaydetmeyi unutmayın");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Logo yüklenemedi");
    } finally {
      onBusy(false);
    }
  }

  async function save() {
    if (!electionId) {
      onError("Önce sol listeden bir seçim seçin");
      return;
    }
    const nextTitle = title.trim();
    if (nextTitle.length < 3) {
      onError("Seçim adı en az 3 karakter olmalı");
      return;
    }
    onBusy(true);
    onError("");
    try {
      await adminApi.elections.update(electionId, { name: nextTitle });
      await adminApi.settings.updateGroup("content", {
        "content.electionCenterName": brandName.trim(),
        "content.electionCenterLabel": label.trim(),
        "content.electionCenterLogo": logo.trim(),
      });
      await adminApi.elections.refreshStrip(electionId);
      onElectionNameSaved(nextTitle);
      onOk("Kaydedildi — /secim başlığı ve marka güncellendi");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      onBusy(false);
    }
  }

  const previewBrand = brandName.trim();
  const previewLabel = label.trim();
  const previewLogo =
    logo.trim() || siteLogoDark || "/brand/logo-on-dark.png";

  if (loading) {
    return <p className={styles.muted}>Marka ayarları yükleniyor…</p>;
  }

  return (
    <div className={styles.brandPanel}>
      <p className={styles.setupLead}>
        <strong>Seçim adı</strong> /secim’deki kırmızı başlığın altındaki{" "}
        <code>h1</code> metnidir (şu an demo adı seed’den). Logo satırı
        isteğe bağlıdır — boş yazılar basılmaz.
      </p>

      <label className={styles.electionTitleField}>
        Seçim adı (sayfa başlığı)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. 31 Mart 2024 Yerel Seçimleri"
          aria-label="Seçim adı"
          disabled={!electionId}
        />
        <em className={styles.fieldHint}>
          /secim → sonuç ekranı üstündeki büyük başlık
        </em>
      </label>

      <div className={styles.brandPreview} aria-label="Kırmızı bar önizleme">
        <div className={styles.brandPreviewInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewLogo} alt="" className={styles.brandPreviewLogo} />
          {previewBrand || previewLabel ? (
            <div>
              {previewBrand ? <strong>{previewBrand}</strong> : null}
              {previewLabel ? <em>{previewLabel}</em> : null}
            </div>
          ) : (
            <span className={styles.brandPreviewHint}>
              Yazı yok — sadece logo
            </span>
          )}
        </div>
        {title.trim() ? (
          <p className={styles.brandTitlePreview}>
            Sayfa başlığı: <strong>{title.trim()}</strong>
          </p>
        ) : null}
      </div>

      <div className={styles.formGrid}>
        <label className={styles.span2}>
          Marka adı (kalın yazı)
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Boş bırakırsan sitede yazılmaz"
            aria-label="Seçim Merkezi marka adı"
          />
        </label>
        <label className={styles.span2}>
          Alt başlık
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Boş bırakırsan sitede yazılmaz"
            aria-label="Seçim Merkezi alt başlık"
          />
        </label>
      </div>

      <div className={styles.logoBlock}>
        <span className={styles.fieldLabel}>Logo (kırmızı bar)</span>
        <div className={styles.logoRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewLogo}
            alt=""
            className={styles.logoPreview}
            style={{ background: "#e10600", objectFit: "contain", padding: 4 }}
          />
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
          {logo ? (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setLogo("")}
            >
              Varsayılana dön
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!electionId}
          onClick={() => void save()}
        >
          <Save size={16} aria-hidden />
          Kaydet
        </button>
      </div>
    </div>
  );
}
