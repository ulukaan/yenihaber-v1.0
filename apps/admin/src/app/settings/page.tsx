"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  passesContrastAA,
  THEME_PALETTES,
  type SettingsBundle,
  type SettingsGroup,
  type SettingsMap,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/public-env";
import { applyAppearanceToDocument } from "@/lib/apply-theme";
import styles from "./settings.module.css";

type Tab = SettingsGroup;

const WEB_URL = SITE_ORIGIN;

const TABS: { id: Tab; label: string }[] = [
  { id: "site", label: "Site kimliği" },
  { id: "appearance", label: "Görünüm" },
  { id: "seo", label: "SEO" },
  { id: "integrations", label: "Entegrasyonlar" },
  { id: "social", label: "Sosyal medya" },
  { id: "content", label: "İçerik" },
  { id: "email", label: "E-posta" },
  { id: "legal", label: "Yasal" },
  { id: "footer", label: "Footer" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint ? <em className={styles.hint}>{hint}</em> : null}
    </label>
  );
}

function assetUrl(raw: string | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${WEB_URL}${v}`;
  return v;
}

function LogoCard({
  label,
  value,
  onChange,
  tone = "light",
  hint,
  fallbackSrc,
  onError,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tone?: "light" | "dark";
  hint?: string;
  fallbackSrc?: string;
  onError?: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const src = assetUrl(value) ?? (fallbackSrc ? assetUrl(fallbackSrc) : null);
  const isFallback = !assetUrl(value) && Boolean(fallbackSrc);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    onError?.("");
    try {
      const res = await adminApi.media.upload(file, { kind: "marka", alt: label });
      onChange(res.url);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Logo yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.logoCard}>
      <div className={styles.logoPreview} data-tone={tone}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview
          <img src={src} alt="" style={{ opacity: isFallback ? 0.45 : 1 }} />
        ) : (
          <span>Dosya seç</span>
        )}
      </div>
      <Field
        label={label}
        hint={
          hint ??
          (isFallback ? "Varsayılan logo gösteriliyor — dosya seçerek değiştirin" : undefined)
        }
      >
        <div className={styles.coverActions}>
          <label className={styles.secondaryBtn}>
            {busy ? "Yükleniyor…" : value ? "Değiştir" : "Dosya seç"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
              hidden
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={busy}
              onClick={() => onChange("")}
            >
              Kaldır
            </button>
          ) : null}
        </div>
      </Field>
    </div>
  );
}

/**
 * Genel Ayarlar — sekmeli; her sekmenin kendi Kaydet’i
 */
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("site");
  const [forms, setForms] = useState<Record<Tab, SettingsMap> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bundle: SettingsBundle = await adminApi.settings.admin();
      setForms(bundle.byGroup);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const form = forms?.[tab] ?? {};

  function setField(key: string, value: string) {
    setForms((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [tab]: { ...prev[tab], [key]: value },
      };
    });
    setOk("");
    setError("");
  }

  const contrastWarn = useMemo(() => {
    if (tab !== "appearance") return null;
    if (form["theme.paletteId"] !== "custom") return null;
    const primary = form["theme.primary"] || "#000";
    const accent = form["theme.accent"] || "#000";
    const p = passesContrastAA(primary, "#FFFFFF");
    const a = passesContrastAA(accent, "#FFFFFF");
    const notes: string[] = [];
    if (!p.ok) notes.push(`Ana renk/beyaz: ${p.ratio}:1 (min 4.5)`);
    if (!a.ok) notes.push(`Vurgu/beyaz: ${a.ratio}:1 (min 4.5)`);
    return notes.length ? notes.join(" · ") : null;
  }, [tab, form]);

  async function saveTab() {
    if (!forms) return;
    setSaving(true);
    setError("");
    setOk("");
    try {
      await adminApi.settings.updateGroup(tab, forms[tab]);
      setOk(`${TABS.find((t) => t.id === tab)?.label ?? "Sekme"} kaydedildi`);
      if (tab === "appearance") {
        applyAppearanceToDocument(forms.appearance);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  }

  async function sendTestMail() {
    setTestMsg("");
    setError("");
    try {
      // first save email tab state if dirty
      if (forms) {
        await adminApi.settings.updateGroup("email", forms.email);
      }
      const res = await adminApi.settings.testEmail();
      setTestMsg(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test maili gönderilemedi");
    }
  }

  async function uploadDefaultCover(file: File | null | undefined) {
    if (!file) return;
    setCoverUploading(true);
    setError("");
    try {
      const res = await adminApi.media.upload(file, { kind: "marka" });
      setField("content.defaultCoverUrl", res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kapak yüklenemedi");
    } finally {
      setCoverUploading(false);
    }
  }

  const defaultCoverPreview = useMemo(() => {
    const raw = (form["content.defaultCoverUrl"] ?? "").trim();
    if (!raw) return `${WEB_URL}/brand/default-cover.svg`;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/")) return `${WEB_URL}${raw}`;
    return raw;
  }, [form]);

  function applyPalette(id: string) {
    setField("theme.paletteId", id);
    if (id === "custom") return;
    const pal = THEME_PALETTES.find((p) => p.id === id);
    if (!pal || pal.id === "custom") return;
    setForms((prev) => {
      if (!prev) return prev;
      const nextAppearance = {
        ...prev.appearance,
        "theme.paletteId": id,
        "theme.primary": pal.primary,
        "theme.accent": pal.accent,
        "theme.link": pal.link,
        "theme.breaking": pal.breaking,
        "panel.accent": pal.accent,
      };
      applyAppearanceToDocument(nextAppearance);
      return {
        ...prev,
        appearance: nextAppearance,
      };
    });
  }

  useEffect(() => {
    if (forms?.appearance) applyAppearanceToDocument(forms.appearance);
  }, [forms?.appearance]);

  return (
    <AdminShell>
      <AdminPage
        title="Genel Ayarlar"
        subtitle="Kimlik, görünüm ve entegrasyonlar — her sekme ayrı kaydedilir."
        className={styles.page}
      >
        <div className={styles.workspace}>
          <nav className={styles.sideTabs} aria-label="Ayar sekmeleri">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? styles.sideTabOn : styles.sideTab}
                onClick={() => {
                  setTab(t.id);
                  setOk("");
                  setError("");
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className={styles.mainCol}>
            {loading || !forms ? (
              <div className={styles.loadingBox}>Ayarlar yükleniyor…</div>
            ) : (
              <>
                <div className={styles.panel} role="tabpanel">
                  {tab === "site" ? (
                    <div className={styles.grid}>
                      <section className={styles.section}>
                        <div className={styles.sectionHead}>
                          <h2>Site kimliği</h2>
                          <p>Ziyaretçinin gördüğü ad, slogan ve adres.</p>
                        </div>
                        <div className={styles.row2}>
                          <Field label="Site adı">
                            <input
                              value={form["site.name"] ?? ""}
                              onChange={(e) =>
                                setField("site.name", e.target.value)
                              }
                            />
                          </Field>
                          <Field label="Slogan">
                            <input
                              value={form["site.tagline"] ?? ""}
                              onChange={(e) =>
                                setField("site.tagline", e.target.value)
                              }
                            />
                          </Field>
                        </div>
                        <Field label="Site URL">
                          <input
                            value={form["site.url"] ?? ""}
                            onChange={(e) =>
                              setField("site.url", e.target.value)
                            }
                            placeholder="https://"
                          />
                        </Field>
                      </section>

                      <section className={styles.section}>
                        <div className={styles.sectionHead}>
                          <h2>Marka görselleri</h2>
                          <p>
                            Dosya seçerek yükleyin. Önizleme anında güncellenir.
                          </p>
                        </div>
                        <div className={styles.logoGrid}>
                          <LogoCard
                            label="Logo (açık tema)"
                            value={form["site.logoLight"] ?? ""}
                            onChange={(v) => setField("site.logoLight", v)}
                            tone="light"
                            fallbackSrc="/brand/logo-color.png"
                            onError={setError}
                          />
                          <LogoCard
                            label="Logo (koyu tema)"
                            value={form["site.logoDark"] ?? ""}
                            onChange={(v) => setField("site.logoDark", v)}
                            tone="dark"
                            fallbackSrc="/brand/logo-on-dark.png"
                            onError={setError}
                          />
                          <LogoCard
                            label="Logo (mobil)"
                            value={form["site.logoMobile"] ?? ""}
                            onChange={(v) => setField("site.logoMobile", v)}
                            tone="light"
                            fallbackSrc="/brand/logo-color.png"
                            onError={setError}
                          />
                          <LogoCard
                            label="Favicon"
                            value={form["site.favicon"] ?? ""}
                            onChange={(v) => setField("site.favicon", v)}
                            tone="light"
                            fallbackSrc="/favicon.ico"
                            onError={setError}
                          />
                        </div>
                      </section>

                      <section className={styles.section}>
                        <div className={styles.sectionHead}>
                          <h2>Bölgesel & canlı</h2>
                          <p>Saat dilimi, tarih ve canlı yayın linki.</p>
                        </div>
                        <div className={styles.row2}>
                          <Field label="Saat dilimi">
                            <input
                              value={form["site.timezone"] ?? "Europe/Istanbul"}
                              onChange={(e) =>
                                setField("site.timezone", e.target.value)
                              }
                            />
                          </Field>
                          <Field label="Tarih formatı">
                            <input
                              value={form["site.dateFormat"] ?? ""}
                              onChange={(e) =>
                                setField("site.dateFormat", e.target.value)
                              }
                            />
                          </Field>
                        </div>
                        <Field label="Canlı TV (YouTube URL)">
                          <input
                            value={form.liveYouTubeUrl ?? ""}
                            onChange={(e) =>
                              setField("liveYouTubeUrl", e.target.value)
                            }
                          />
                        </Field>
                      </section>

                      <div className={styles.block}>
                        <h2>Üst bar motif</h2>
                        <p className={styles.muted}>
                          Logo şeridindeki motif. Opaklık 0–40 (hafif tutun).
                        </p>
                        <div className={styles.row2}>
                          <Field label="Desen">
                            <select
                              value={form["site.headerMotif"] ?? "seljuk"}
                              onChange={(e) =>
                                setField("site.headerMotif", e.target.value)
                              }
                            >
                              <option value="seljuk">Selçuklu yıldız</option>
                              <option value="baklava">Baklava</option>
                              <option value="rumi">Rumi yaprak</option>
                              <option value="none">Kapalı</option>
                            </select>
                          </Field>
                          <Field
                            label={`Opaklık (${form["site.headerMotifOpacity"] ?? "10"}%)`}
                          >
                            <input
                              type="range"
                              min={0}
                              max={40}
                              step={1}
                              value={form["site.headerMotifOpacity"] ?? "10"}
                              onChange={(e) =>
                                setField(
                                  "site.headerMotifOpacity",
                                  e.target.value,
                                )
                              }
                              disabled={form["site.headerMotif"] === "none"}
                            />
                          </Field>
                        </div>
                      </div>

                      <div className={styles.block}>
                        <h2>Bakım modu</h2>
                        <label className={styles.check}>
                          <input
                            type="checkbox"
                            checked={form["site.maintenanceEnabled"] === "1"}
                            onChange={(e) =>
                              setField(
                                "site.maintenanceEnabled",
                                e.target.checked ? "1" : "0",
                              )
                            }
                          />
                          Bakım modunu aç
                        </label>
                        <Field label="Bakım mesajı">
                          <textarea
                            value={
                              form["site.maintenanceMessage"] ??
                              "Site bakımda. Kısa süre içinde döneceğiz."
                            }
                            onChange={(e) =>
                              setField(
                                "site.maintenanceMessage",
                                e.target.value,
                              )
                            }
                          />
                        </Field>
                        <Field
                          label="IP beyaz listesi"
                          hint="Virgülle ayırın. Kendi IP'nizi eklemezseniz kilidi siz de yaşarsınız."
                        >
                          <input
                            value={form["site.maintenanceWhitelistIp"] ?? ""}
                            onChange={(e) =>
                              setField(
                                "site.maintenanceWhitelistIp",
                                e.target.value,
                              )
                            }
                            placeholder="1.2.3.4, ..."
                          />
                        </Field>
                      </div>
                    </div>
                  ) : null}

                  {tab === "appearance" ? (
                                <div className={styles.grid}>
                                  <div className={styles.block}>
                                    <h2>Site + panel renkleri</h2>
                                    <p className={styles.muted}>
                                      Seçtiğiniz palet hem haber sitesine hem yönetim paneline
                                      uygulanır. Kaydettikten sonra site önbelleği yenilenir.
                                    </p>
                                    <div className={styles.palettes}>
                                      {THEME_PALETTES.map((p) => (
                                        <button
                                          key={p.id}
                                          type="button"
                                          className={
                                            form["theme.paletteId"] === p.id
                                              ? styles.paletteOn
                                              : styles.palette
                                          }
                                          onClick={() => applyPalette(p.id)}
                                        >
                                          {p.id !== "custom" ? (
                                            <span className={styles.swatches}>
                                              <i style={{ background: p.primary }} />
                                              <i style={{ background: p.accent }} />
                                              <i style={{ background: p.breaking }} />
                                            </span>
                                          ) : null}
                                          {p.label}
                                        </button>
                                      ))}
                                    </div>
                                    {form["theme.paletteId"] === "custom" ? (
                                      <div className={styles.row4}>
                                        <Field label="Ana renk">
                                          <input
                                            type="color"
                                            value={form["theme.primary"] || "#2B2D42"}
                                            onChange={(e) =>
                                              setField("theme.primary", e.target.value)
                                            }
                                          />
                                        </Field>
                                        <Field label="Vurgu">
                                          <input
                                            type="color"
                                            value={form["theme.accent"] || "#EF233C"}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              setForms((prev) => {
                                                if (!prev) return prev;
                                                const next = {
                                                  ...prev.appearance,
                                                  "theme.accent": v,
                                                  "panel.accent": v,
                                                };
                                                applyAppearanceToDocument(next);
                                                return { ...prev, appearance: next };
                                              });
                                              setOk("");
                                              setError("");
                                            }}
                                          />
                                        </Field>
                                        <Field label="Link">
                                          <input
                                            type="color"
                                            value={form["theme.link"] || "#1D4ED8"}
                                            onChange={(e) =>
                                              setField("theme.link", e.target.value)
                                            }
                                          />
                                        </Field>
                                        <Field label="Son dakika">
                                          <input
                                            type="color"
                                            value={form["theme.breaking"] || "#E10600"}
                                            onChange={(e) =>
                                              setField("theme.breaking", e.target.value)
                                            }
                                          />
                                        </Field>
                                      </div>
                                    ) : null}
                                    {contrastWarn ? (
                                      <p className={styles.warn} role="alert">
                                        Kontrast uyarısı: {contrastWarn}
                                      </p>
                                    ) : null}
                                    <Field label="Yazı tipi">
                                      <select
                                        value={form["theme.font"] ?? "system"}
                                        onChange={(e) => setField("theme.font", e.target.value)}
                                      >
                                        <option value="system">Sistem</option>
                                        <option value="serif">Serif (kaynak)</option>
                                        <option value="sans">Sans</option>
                                      </select>
                                    </Field>
                                    <div className={styles.row2}>
                                      <Field label="Tema desteği">
                                        <select
                                          value={form["theme.modeSupport"] ?? "both"}
                                          onChange={(e) =>
                                            setField("theme.modeSupport", e.target.value)
                                          }
                                        >
                                          <option value="both">Açık + koyu</option>
                                          <option value="light">Yalnız açık</option>
                                          <option value="dark">Yalnız koyu</option>
                                        </select>
                                      </Field>
                                      <Field label="Varsayılan tema">
                                        <select
                                          value={form["theme.defaultMode"] ?? "light"}
                                          onChange={(e) =>
                                            setField("theme.defaultMode", e.target.value)
                                          }
                                        >
                                          <option value="light">Açık</option>
                                          <option value="dark">Koyu</option>
                                        </select>
                                      </Field>
                                    </div>
                                  </div>
                  
                                  <div className={styles.block}>
                                    <h2>Panel düzeni</h2>
                                    <p className={styles.muted}>
                                      Sidebar ve satır sıklığı. Vurgu rengi site paletiyle
                                      senkron kalır; isterseniz ayrı ayarlayın.
                                    </p>
                                    <Field label="Panel vurgu rengi">
                                      <input
                                        type="color"
                                        value={
                                          form["panel.accent"] ||
                                          form["theme.accent"] ||
                                          "#EF233C"
                                        }
                                        onChange={(e) => setField("panel.accent", e.target.value)}
                                      />
                                    </Field>
                                    <div className={styles.row2}>
                                      <Field label="Sidebar">
                                        <select
                                          value={form["panel.sidebar"] ?? "dark"}
                                          onChange={(e) =>
                                            setField("panel.sidebar", e.target.value)
                                          }
                                        >
                                          <option value="dark">Koyu</option>
                                          <option value="light">Açık</option>
                                        </select>
                                      </Field>
                                      <Field label="Satır yoğunluğu">
                                        <select
                                          value={form["panel.density"] ?? "comfortable"}
                                          onChange={(e) =>
                                            setField("panel.density", e.target.value)
                                          }
                                        >
                                          <option value="comfortable">Ferah</option>
                                          <option value="compact">Sık</option>
                                        </select>
                                      </Field>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                  
                              {tab === "seo" ? (
                                <div className={styles.grid}>
                                  <Field
                                    label="Meta başlık şablonu"
                                    hint="%s yerine sayfa başlığı gelir"
                                  >
                                    <input
                                      value={form["seo.titleTemplate"] ?? ""}
                                      onChange={(e) =>
                                        setField("seo.titleTemplate", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Varsayılan açıklama">
                                    <textarea
                                      rows={3}
                                      value={form["seo.defaultDescription"] ?? ""}
                                      onChange={(e) =>
                                        setField("seo.defaultDescription", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Varsayılan OG görseli (URL)">
                                    <input
                                      value={form["seo.defaultOgImage"] ?? ""}
                                      onChange={(e) =>
                                        setField("seo.defaultOgImage", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="robots.txt">
                                    <textarea
                                      rows={6}
                                      className={styles.mono}
                                      value={form["seo.robotsTxt"] ?? ""}
                                      onChange={(e) => setField("seo.robotsTxt", e.target.value)}
                                    />
                                  </Field>
                                  <Field label="Search Console doğrulama kodu">
                                    <input
                                      value={form["seo.searchConsoleCode"] ?? ""}
                                      onChange={(e) =>
                                        setField("seo.searchConsoleCode", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["seo.sitemapEnabled"] === "1"}
                                      onChange={(e) =>
                                        setField(
                                          "seo.sitemapEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Sitemap etkin
                                  </label>
                                </div>
                              ) : null}
                  
                              {tab === "integrations" ? (
                                <div className={styles.grid}>
                                  <Field label="Google Analytics ID">
                                    <input
                                      value={form["integrations.gaId"] ?? ""}
                                      onChange={(e) =>
                                        setField("integrations.gaId", e.target.value)
                                      }
                                      placeholder="G-XXXXXXXX"
                                    />
                                  </Field>
                                  <Field label="Tag Manager ID">
                                    <input
                                      value={form["integrations.gtmId"] ?? ""}
                                      onChange={(e) =>
                                        setField("integrations.gtmId", e.target.value)
                                      }
                                      placeholder="GTM-XXXX"
                                    />
                                  </Field>
                                  <Field
                                    label="AdSense Client ID"
                                    hint="NEXT_PUBLIC_ADSENSE_CLIENT yedeği"
                                  >
                                    <input
                                      value={form["integrations.adsenseClient"] ?? ""}
                                      onChange={(e) =>
                                        setField("integrations.adsenseClient", e.target.value)
                                      }
                                      placeholder="ca-pub-…"
                                    />
                                  </Field>
                                  <Field label="Facebook Pixel">
                                    <input
                                      value={form["integrations.facebookPixel"] ?? ""}
                                      onChange={(e) =>
                                        setField("integrations.facebookPixel", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Push bildirim public key">
                                    <input
                                      value={form["integrations.pushPublicKey"] ?? ""}
                                      onChange={(e) =>
                                        setField("integrations.pushPublicKey", e.target.value)
                                      }
                                    />
                                  </Field>
                                </div>
                              ) : null}
                  
                              {tab === "social" ? (
                                <div className={styles.grid}>
                                  {(
                                    [
                                      ["social.facebook", "Facebook"],
                                      ["social.x", "X (Twitter)"],
                                      ["social.instagram", "Instagram"],
                                      ["social.youtube", "YouTube"],
                                      ["social.whatsapp", "WhatsApp kanalı"],
                                    ] as const
                                  ).map(([key, label]) => (
                                    <Field key={key} label={label}>
                                      <input
                                        value={form[key] ?? ""}
                                        onChange={(e) => setField(key, e.target.value)}
                                        placeholder="https://"
                                      />
                                    </Field>
                                  ))}
                                </div>
                              ) : null}
                  
                              {tab === "content" ? (
                                <div className={styles.grid}>
                                  <div className={styles.row2}>
                                    <Field label="Anasayfa manşet / sürgü sayısı">
                                      <input
                                        type="number"
                                        min={1}
                                        max={24}
                                        value={form["content.homeMansetCount"] ?? "12"}
                                        onChange={(e) =>
                                          setField("content.homeMansetCount", e.target.value)
                                        }
                                      />
                                    </Field>
                                    <Field label="Sayfa başına haber">
                                      <input
                                        type="number"
                                        min={4}
                                        max={48}
                                        value={form["content.pageSize"] ?? "12"}
                                        onChange={(e) =>
                                          setField("content.pageSize", e.target.value)
                                        }
                                      />
                                    </Field>
                                  </div>
                                  <Field label="Özet karakter sınırı">
                                    <input
                                      type="number"
                                      min={40}
                                      max={400}
                                      value={form["content.excerptMaxChars"] ?? "160"}
                                      onChange={(e) =>
                                        setField("content.excerptMaxChars", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["content.commentsEnabled"] === "1"}
                                      onChange={(e) =>
                                        setField(
                                          "content.commentsEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Yorumlar açık
                                  </label>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["content.commentsAutoApprove"] === "1"}
                                      onChange={(e) =>
                                        setField(
                                          "content.commentsAutoApprove",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Yorum otomatik onay
                                  </label>
                                  <Field label="Haber kaç gün sonra yoruma kapansın">
                                    <input
                                      type="number"
                                      min={0}
                                      max={365}
                                      value={form["content.commentsCloseAfterDays"] ?? "30"}
                                      onChange={(e) =>
                                        setField(
                                          "content.commentsCloseAfterDays",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Field>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["content.breakingBandEnabled"] === "1"}
                                      onChange={(e) =>
                                        setField(
                                          "content.breakingBandEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Son dakika bandı açık
                                  </label>
                                  <Field
                                    label="Okunma sayısı eşiği"
                                    hint="Bu sayının altındaki okunmalar sitede gizlenir (öneri: 500)."
                                  >
                                    <input
                                      type="number"
                                      min={0}
                                      max={100000}
                                      value={form["content.viewCountMinShow"] ?? "500"}
                                      onChange={(e) =>
                                        setField("content.viewCountMinShow", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field
                                    label="Tepki yapılandırması (JSON)"
                                    hint='Boş bırakılırsa varsayılan 5 tepki. Örn: {"minShow":10,"items":[{"id":"kizdim","label":"Kızdım","emoji":"😡","enabled":true,"order":4}]}'
                                  >
                                    <textarea
                                      rows={5}
                                      value={form["reactions.config"] ?? ""}
                                      onChange={(e) =>
                                        setField("reactions.config", e.target.value)
                                      }
                                      placeholder="Boş = varsayılan 5 tepki"
                                      aria-label="Tepki yapılandırması JSON"
                                    />
                                  </Field>
                                  <Field
                                    label="Varsayılan haber kapağı"
                                    hint="Kapak yüklenmemiş haberlerde otomatik gösterilir. Dosya seçin."
                                  >
                                    <div className={styles.coverActions}>
                                      <input
                                        ref={coverFileRef}
                                        type="file"
                                        accept="image/*"
                                        className={styles.fileHidden}
                                        tabIndex={-1}
                                        aria-hidden
                                        onChange={(e) => {
                                          void uploadDefaultCover(e.target.files?.[0]);
                                          e.target.value = "";
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        disabled={coverUploading}
                                        onClick={() => coverFileRef.current?.click()}
                                        aria-label="Varsayılan kapak görseli yükle"
                                      >
                                        {coverUploading ? "Yükleniyor…" : "Dosya seç"}
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        onClick={() =>
                                          setField(
                                            "content.defaultCoverUrl",
                                            "/brand/default-cover.svg",
                                          )
                                        }
                                        aria-label="Site varsayılan kapağına dön"
                                      >
                                        Varsayılana dön
                                      </button>
                                    </div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={defaultCoverPreview}
                                      alt="Varsayılan kapak önizleme"
                                      className={styles.coverPreview}
                                    />
                                  </Field>
                                </div>
                              ) : null}
                  
                              {tab === "email" ? (
                                <div className={styles.grid}>
                                  <Field label="Gönderen adı">
                                    <input
                                      value={form["email.fromName"] ?? ""}
                                      onChange={(e) =>
                                        setField("email.fromName", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Gönderen adres">
                                    <input
                                      type="email"
                                      value={form["email.fromAddress"] ?? ""}
                                      onChange={(e) =>
                                        setField("email.fromAddress", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="SMTP sunucu">
                                    <input
                                      value={form["email.smtpHost"] ?? ""}
                                      onChange={(e) =>
                                        setField("email.smtpHost", e.target.value)
                                      }
                                      placeholder="smtp.ornek.com"
                                    />
                                  </Field>
                                  <div className={styles.row2}>
                                    <Field label="Port">
                                      <input
                                        value={form["email.smtpPort"] ?? "587"}
                                        onChange={(e) =>
                                          setField("email.smtpPort", e.target.value)
                                        }
                                      />
                                    </Field>
                                    <label className={styles.check}>
                                      <input
                                        type="checkbox"
                                        checked={form["email.smtpSecure"] === "1"}
                                        onChange={(e) =>
                                          setField(
                                            "email.smtpSecure",
                                            e.target.checked ? "1" : "0",
                                          )
                                        }
                                      />
                                      TLS / Secure
                                    </label>
                                  </div>
                                  <Field label="SMTP kullanıcı">
                                    <input
                                      value={form["email.smtpUser"] ?? ""}
                                      onChange={(e) =>
                                        setField("email.smtpUser", e.target.value)
                                      }
                                      autoComplete="off"
                                    />
                                  </Field>
                                  <Field
                                    label="SMTP şifre"
                                    hint="Değiştirmezseniz •••• olarak kalır"
                                  >
                                    <input
                                      type="password"
                                      value={form["email.smtpPass"] ?? ""}
                                      onChange={(e) =>
                                        setField("email.smtpPass", e.target.value)
                                      }
                                      autoComplete="new-password"
                                    />
                                  </Field>
                                  <div className={styles.testRow}>
                                    <button
                                      type="button"
                                      className={styles.secondaryBtn}
                                      onClick={() => void sendTestMail()}
                                    >
                                      Test maili gönder
                                    </button>
                                    {testMsg ? (
                                      <span className={styles.ok}>{testMsg}</span>
                                    ) : null}
                                  </div>
                                </div>
                              ) : null}
                  
                              {tab === "legal" ? (
                                <div className={styles.grid}>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["legal.cookieBannerEnabled"] === "1"}
                                      onChange={(e) =>
                                        setField(
                                          "legal.cookieBannerEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Çerez bildirimi açık
                                  </label>
                                  <Field label="Çerez metni">
                                    <textarea
                                      rows={4}
                                      value={form["legal.cookieText"] ?? ""}
                                      onChange={(e) =>
                                        setField("legal.cookieText", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Gizlilik politikası linki">
                                    <input
                                      value={form["legal.privacyUrl"] ?? ""}
                                      onChange={(e) =>
                                        setField("legal.privacyUrl", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Kullanım şartları linki">
                                    <input
                                      value={form["legal.termsUrl"] ?? ""}
                                      onChange={(e) =>
                                        setField("legal.termsUrl", e.target.value)
                                      }
                                    />
                                  </Field>
                                </div>
                              ) : null}
                  
                              {tab === "footer" ? (
                                <div className={styles.grid}>
                                  <p className={styles.muted}>
                                    Marka adı / slogan / logo →{" "}
                                    <strong>Site kimliği</strong> · Bağlantı sütunları (Bağlantılar,
                                    Kurumsal) → <strong>Menü → Footer</strong> · Sosyal ikonlar →{" "}
                                    <strong>Sosyal medya</strong>
                                  </p>
                  
                                  <Field
                                    label="Alıntı / kaynak uyarısı"
                                    hint="Footer en alt şerit"
                                  >
                                    <textarea
                                      rows={2}
                                      value={form["footer.citation"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.citation", e.target.value)
                                      }
                                    />
                                  </Field>
                  
                                  <h3 className={styles.subHead}>E-posta bülteni</h3>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["footer.newsletterEnabled"] !== "0"}
                                      onChange={(e) =>
                                        setField(
                                          "footer.newsletterEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Bülten bloğu açık
                                  </label>
                                  <Field label="Bülten üst etiket">
                                    <input
                                      value={form["footer.newsletterKicker"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.newsletterKicker", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Bülten başlık">
                                    <input
                                      value={form["footer.newsletterTitle"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.newsletterTitle", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="Bülten açıklama">
                                    <textarea
                                      rows={3}
                                      value={form["footer.newsletterPromise"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.newsletterPromise", e.target.value)
                                      }
                                    />
                                  </Field>
                  
                                  <h3 className={styles.subHead}>İhbar hattı</h3>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["footer.tipEnabled"] !== "0"}
                                      onChange={(e) =>
                                        setField(
                                          "footer.tipEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    İhbar bloğu açık
                                  </label>
                                  <Field label="İhbar üst etiket">
                                    <input
                                      value={form["footer.tipKicker"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.tipKicker", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="İhbar başlık">
                                    <input
                                      value={form["footer.tipTitle"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.tipTitle", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field label="İhbar metni">
                                    <textarea
                                      rows={3}
                                      value={form["footer.tipBody"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.tipBody", e.target.value)
                                      }
                                    />
                                  </Field>
                  
                                  <h3 className={styles.subHead}>Hızlı erişim</h3>
                                  <label className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={form["footer.servicesEnabled"] !== "0"}
                                      onChange={(e) =>
                                        setField(
                                          "footer.servicesEnabled",
                                          e.target.checked ? "1" : "0",
                                        )
                                      }
                                    />
                                    Servis şeridi açık
                                  </label>
                                  <Field label="Servis şeridi başlığı">
                                    <input
                                      value={form["footer.servicesLabel"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.servicesLabel", e.target.value)
                                      }
                                    />
                                  </Field>
                                  <Field
                                    label="Servis listesi (JSON)"
                                    hint='Örnek: [{"href":"/servis/namaz","label":"Namaz","hint":"Düzce","icon":"moon"}] — icon: moon|cross|flower|cloud|trend|film'
                                  >
                                    <textarea
                                      rows={10}
                                      value={form["footer.servicesJson"] ?? ""}
                                      onChange={(e) =>
                                        setField("footer.servicesJson", e.target.value)
                                      }
                                      spellCheck={false}
                                    />
                                  </Field>
                                </div>
                              ) : null}

                </div>

                <div className={styles.stickySave}>
                  <div className={styles.stickyMeta}>
                    <strong>
                      {TABS.find((t) => t.id === tab)?.label ?? "Sekme"}
                    </strong>
                    <span>
                      {ok
                        ? ok
                        : error
                          ? error
                          : "Değişiklikler yalnızca bu sekmeyi etkiler"}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={saving || loading || !forms}
                      onClick={() => void saveTab()}
                    >
                      {saving ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
