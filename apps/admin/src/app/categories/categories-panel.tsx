"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ApiCategory, CategoryBucket } from "@yenihaber/shared";
import {
  CATEGORY_BUCKET_LABELS,
  CATEGORY_PAGE_TEMPLATES,
  CATEGORY_RAIL_PALETTE,
  COLOR_DISTANCE_WARN,
  colorDistance,
  countWords,
  PARTY_COLOR_PALETTE,
  slugify,
  type CategoryPageTemplate,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { adminApi } from "@/lib/api";
import { ImageFileField } from "@/components/image-file-field/image-file-field";
import styles from "./categories.module.css";

type FormState = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  inMenu: boolean;
  onHome: boolean;
  homeOrder: number;
  commentsEnabled: boolean;
  defaultCover: string;
  color: string;
  logoUrl: string;
  pageTemplate: CategoryPageTemplate;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  description: "",
  parentId: "",
  inMenu: true,
  onHome: false,
  homeOrder: 0,
  commentsEnabled: true,
  defaultCover: "",
  color: CATEGORY_RAIL_PALETTE[0]!,
  logoUrl: "",
  pageTemplate: "magazine",
});

function flattenTree(tree: ApiCategory[]): ApiCategory[] {
  const out: ApiCategory[] = [];
  for (const r of tree) {
    out.push(r);
    for (const ch of r.children ?? []) out.push(ch);
  }
  return out;
}

export type CategoriesPanelProps = {
  bucket: CategoryBucket;
};

/** Kategori paneli — bucket (bölge / haber / parti / kurum) */
export function CategoriesPanel({ bucket }: CategoriesPanelProps) {
  const title = CATEGORY_BUCKET_LABELS[bucket];
  const [tree, setTree] = useState<ApiCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");
  const [loading, setLoading] = useState(true);

  const flat = useMemo(() => flattenTree(tree), [tree]);
  const selected = flat.find((c) => c.id === selectedId) ?? null;
  const words = countWords(form.description);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminApi.categories.list({ tree: true, bucket });
      setTree(rows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  useEffect(() => {
    setSelectedId(null);
    setIsNew(false);
    setForm(emptyForm());
    setOk("");
    void load();
  }, [load]);

  function selectCategory(c: ApiCategory) {
    setIsNew(false);
    setSelectedId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      parentId: c.parentId ?? "",
      inMenu: c.inMenu ?? true,
      onHome: c.onHome ?? false,
      homeOrder: c.homeOrder ?? 0,
      commentsEnabled: c.commentsEnabled ?? true,
      defaultCover: c.defaultCover ?? "",
      color: c.color ?? (bucket === "parti" ? PARTY_COLOR_PALETTE[0]! : CATEGORY_RAIL_PALETTE[0]!),
      logoUrl: c.logoUrl ?? "",
      pageTemplate: c.pageTemplate ?? "magazine",
    });
    setOk("");
    setError("");
  }

  const nearColorCat = useMemo(() => {
    if (!form.color) return null;
    return (
      flat.find(
        (p) =>
          p.id !== selectedId &&
          p.color &&
          colorDistance(p.color, form.color) < COLOR_DISTANCE_WARN,
      ) ?? null
    );
  }, [flat, form.color, selectedId]);

  function startNew() {
    setIsNew(true);
    setSelectedId(null);
    setForm(emptyForm());
    setOk("");
    setError("");
  }

  async function save(forceColor = false) {
    if (bucket === "parti" && !form.color) {
      setError("Parti için renk zorunlu");
      return;
    }
    if (nearColorCat && !forceColor) {
      setError(
        `“${nearColorCat.name}” ile renk çok yakın. Yine de kaydetmek için uyarıyı onaylayın.`,
      );
      return;
    }
    setBusy(true);
    setError("");
    setOk("");
    try {
      const colorPayload = {
        color: form.color || null,
        ...(bucket === "parti"
          ? { logoUrl: form.logoUrl || null, forceColor }
          : {}),
      };
      if (isNew) {
        const created = await adminApi.categories.create({
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          description: form.description.trim(),
          parentId: form.parentId || null,
          inMenu: form.inMenu,
          onHome: form.onHome,
          homeOrder: form.onHome ? form.homeOrder || flat.length + 1 : 0,
          commentsEnabled: form.commentsEnabled,
          defaultCover: form.defaultCover || null,
          sortOrder: flat.length + 1,
          menuOrder: flat.length + 1,
          bucket,
          status: "aktif",
          pageTemplate: form.pageTemplate,
          ...colorPayload,
        });
        await load();
        setIsNew(false);
        setSelectedId(created.id);
        setOk("Kategori oluşturuldu");
      } else if (selected) {
        await adminApi.categories.update(selected.id, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          parentId: form.parentId || null,
          inMenu: form.inMenu,
          onHome: form.onHome,
          homeOrder: form.onHome ? form.homeOrder : 0,
          commentsEnabled: form.commentsEnabled,
          defaultCover: form.defaultCover || null,
          bucket,
          pageTemplate: form.pageTemplate,
          ...colorPayload,
        });
        await load();
        setOk(
          form.slug !== selected.slug
            ? "Kaydedildi · eski slug için 301 yazıldı"
            : "Kaydedildi",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function moveArticles() {
    if (!selected || !moveTarget) return;
    setBusy(true);
    setError("");
    try {
      const res = await adminApi.categories.moveArticles(
        selected.id,
        moveTarget,
      );
      setOk(`${res.moved} haber taşındı`);
      setMoveTarget("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Taşıma başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function removeEmpty() {
    if (!selected) return;
    if ((selected.articleCount ?? 0) > 0) {
      setError("Önce haberleri taşıyın — silme düğmesi yok");
      return;
    }
    if (!window.confirm(`«${selected.name}» silinsin mi? Eski URL → anasayfa 301`))
      return;
    setBusy(true);
    try {
      await adminApi.categories.remove(selected.id);
      setSelectedId(null);
      setForm(emptyForm());
      await load();
      setOk("Kategori silindi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  const roots = tree;

  return (
    <AdminShell>
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <p className={styles.crumb}>
              <Link href="/dashboard">Başlangıç</Link>
              <span aria-hidden>/</span>
              <span>Kategoriler</span>
              <span aria-hidden>/</span>
              <span>{title}</span>
            </p>
            <h1>{title}</h1>
            <p>Haber › {title} · en fazla 2 seviye · aynı kovadaki alt ağaç</p>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={startNew}>
            <Plus size={18} aria-hidden />
            Yeni kategori
          </button>
        </header>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        <div className={styles.workspace}>
          <section className={styles.tree} aria-label="Sıra ve yapı">
            <h2 className={styles.colTitle}>Sıra ve yapı</h2>
            <ul className={styles.treeList}>
              {roots.map((root) => (
                <li key={root.id}>
                  <button
                    type="button"
                    className={
                      selectedId === root.id ? styles.treeItemOn : styles.treeItem
                    }
                    onClick={() => selectCategory(root)}
                  >
                    {root.color ? (
                      <i
                        className={styles.swatch}
                        style={{ background: root.color }}
                        aria-hidden
                      />
                    ) : null}
                    <span>{root.name}</span>
                    {root.onHome ? (
                      <span className={styles.homeBadge} title="Ana sayfa şeridi">
                        Ana
                      </span>
                    ) : null}
                    <span className={styles.count}>
                      {root.articleCount ?? 0}
                    </span>
                  </button>
                  {(root.children?.length ?? 0) > 0 ? (
                    <ul className={styles.subList}>
                      {root.children!.map((ch) => (
                        <li key={ch.id}>
                          <button
                            type="button"
                            className={
                              selectedId === ch.id
                                ? styles.treeItemOn
                                : styles.treeItem
                            }
                            onClick={() => selectCategory(ch)}
                          >
                            <span>{ch.name}</span>
                            <span className={styles.count}>
                              {ch.articleCount ?? 0}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
              {!roots.length && !loading ? (
                <li className={styles.muted}>Henüz kategori yok</li>
              ) : null}
            </ul>
          </section>

          <section className={styles.editor} aria-label="Kategori düzenle">
            {!selected && !isNew ? (
              <p className={styles.muted}>
                Soldan kategori seçin veya yeni ekleyin.
              </p>
            ) : (
              <>
                <div className={styles.fieldRow}>
                  <label>
                    Ad
                    <input
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({
                          ...f,
                          name,
                          slug: isNew ? slugify(name) : f.slug,
                        }));
                      }}
                    />
                  </label>
                <label>
                  Bağlantı adresi
                  <div className={styles.slugField}>
                    <span>/kategori/</span>
                    <input
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        }))
                      }
                    />
                  </div>
                </label>
                <label>
                  Sayfa şablonu
                  <select
                    value={form.pageTemplate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        pageTemplate: e.target.value as CategoryPageTemplate,
                      }))
                    }
                    aria-label="Kategori sayfa şablonu"
                  >
                    {CATEGORY_PAGE_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <em className={styles.templateHint}>
                    {CATEGORY_PAGE_TEMPLATES.find((t) => t.id === form.pageTemplate)
                      ?.hint ?? ""}
                  </em>
                </label>
                </div>

                <label className={styles.blockLabel}>
                  Açıklama
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="SEO metni — 60–100 kelime, özgün"
                  />
                  <span
                    className={
                      words >= 60 && words <= 100
                        ? styles.wordOk
                        : styles.wordBad
                    }
                  >
                    {words} / 100 kelime
                    {words < 60 ? " (en az 60)" : ""}
                  </span>
                </label>

                <div className={styles.toggles}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={form.inMenu}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, inMenu: e.target.checked }))
                      }
                    />
                    Menüde göster
                  </label>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={form.onHome}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          onHome: e.target.checked,
                          homeOrder:
                            e.target.checked && !f.homeOrder
                              ? flat.filter((x) => x.onHome).length + 1
                              : f.homeOrder,
                        }))
                      }
                    />
                    Ana sayfada şerit
                  </label>
                  {form.onHome ? (
                    <label className={styles.homeOrderLabel}>
                      Şerit sırası
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={form.homeOrder}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            homeOrder: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                  ) : null}
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={!form.commentsEnabled}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          commentsEnabled: !e.target.checked,
                        }))
                      }
                    />
                    Yorumlara kapalı
                  </label>
                </div>

                <div className={styles.fieldRow}>
                  <label>
                    Üst kategori
                    <select
                      value={form.parentId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, parentId: e.target.value }))
                      }
                      disabled={
                        Boolean(selected?.children?.length) && !isNew
                      }
                    >
                      <option value="">Yok (ana kategori)</option>
                      {tree
                        .filter((r) => r.id !== selectedId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <ImageFileField
                    label="Varsayılan kapak"
                    value={form.defaultCover}
                    onChange={(url) =>
                      setForm((f) => ({ ...f, defaultCover: url }))
                    }
                    kind="haber"
                    hint="Haberde görsel yoksa bu kapak kullanılır"
                    onError={setError}
                  />
                </div>

                <div className={styles.partyColorBox}>
                  <p className={styles.partyColorLabel}>
                    {bucket === "parti"
                      ? "Parti rengi (zorunlu) — koltuk, bar ve etiket"
                      : "Şerit aksanı — yalnız başlık altı çizgi + kart etiketi (zemin boyanmaz)"}
                  </p>
                  <div className={styles.palette}>
                    {(bucket === "parti"
                      ? PARTY_COLOR_PALETTE
                      : CATEGORY_RAIL_PALETTE
                    ).map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className={
                          form.color === hex
                            ? styles.paletteOn
                            : styles.paletteBtn
                        }
                        style={{ background: hex }}
                        aria-label={`Renk ${hex}`}
                        aria-pressed={form.color === hex}
                        onClick={() =>
                          setForm((f) => ({ ...f, color: hex }))
                        }
                      />
                    ))}
                  </div>
                  {nearColorCat ? (
                    <p className={styles.colorWarn} role="alert">
                      “{nearColorCat.name}” ile renk çok yakın.
                      <button
                        type="button"
                        className={styles.linkBtn}
                        disabled={busy}
                        onClick={() => void save(true)}
                      >
                        Yine de kaydet
                      </button>
                    </p>
                  ) : null}
                  {bucket === "parti" ? (
                    <ImageFileField
                      label="Parti logosu"
                      value={form.logoUrl}
                      onChange={(url) =>
                        setForm((f) => ({ ...f, logoUrl: url }))
                      }
                      kind="genel"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onError={setError}
                    />
                  ) : null}
                </div>

                {selected && (selected.articleCount ?? 0) > 0 ? (
                  <div className={styles.moveBox}>
                    <p>
                      {selected.articleCount} haber · Silmek için önce taşıyın
                    </p>
                    <div className={styles.moveRow}>
                      <select
                        value={moveTarget}
                        onChange={(e) => setMoveTarget(e.target.value)}
                        aria-label="Hedef kategori"
                      >
                        <option value="">Hedef kategori…</option>
                        {flat
                          .filter((c) => c.id !== selected.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.parentId ? `↳ ${c.name}` : c.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={!moveTarget || busy}
                        onClick={() => void moveArticles()}
                      >
                        Haberleri taşı
                      </button>
                    </div>
                  </div>
                ) : null}

                <footer className={styles.formFoot}>
                  <span className={styles.muted}>
                    {selected
                      ? `${selected.articleCount ?? 0} haber · ${selected.childCount ?? 0} alt`
                      : "Yeni kayıt"}
                  </span>
                  <div className={styles.footActions}>
                    {selected &&
                    (selected.articleCount ?? 0) === 0 &&
                    (selected.childCount ?? 0) === 0 ? (
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={busy}
                        onClick={() => void removeEmpty()}
                      >
                        Sil
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={
                        busy ||
                        words < 60 ||
                        words > 100 ||
                        (bucket === "parti" && !form.color)
                      }
                      onClick={() => void save(false)}
                    >
                      Kaydet
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
