"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Plus, Save } from "lucide-react";
import type { ApiCategory } from "@yenihaber/shared";
import {
  CATEGORY_BUCKET_LABELS,
  CATEGORY_RAIL_PALETTE,
  COLOR_DISTANCE_WARN,
  HOME_RAIL_MAX_RECOMMENDED,
  HOME_RAIL_MIN_ARTICLES,
  colorDistance,
} from "@yenihaber/shared";
import { SITE_ORIGIN } from "@/lib/public-env";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import styles from "../categories.module.css";

/**
 * Ana sayfa şeritleri — kompakt sıra tablosu.
 * Değişiklikler yalnızca Kaydet ile canlıya gider.
 */
export default function HomeRailsPage() {
  const [rows, setRows] = useState<ApiCategory[]>([]);
  const [all, setAll] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [addId, setAddId] = useState("");
  const [colorWarn, setColorWarn] = useState("");
  const [colorOpenId, setColorOpenId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [home, tree] = await Promise.all([
        adminApi.categories.list({ home: true }),
        adminApi.categories.list({ tree: true }),
      ]);
      const flat: ApiCategory[] = [];
      for (const r of tree) {
        flat.push(r);
        for (const ch of r.children ?? []) flat.push(ch);
      }
      setAll(flat);
      setRows([...home].sort((a, b) => a.homeOrder - b.homeOrder));
      setDirty(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setRows(
      arrayMove(rows, oldIndex, newIndex).map((c, i) => ({
        ...c,
        homeOrder: i + 1,
        onHome: true,
      })),
    );
    setDirty(true);
    setOk("");
    setColorOpenId(null);
  }

  function nearColor(hex: string, exceptId: string): ApiCategory | null {
    for (const c of all) {
      if (c.id === exceptId || !c.color) continue;
      if (colorDistance(c.color, hex) < COLOR_DISTANCE_WARN) return c;
    }
    return null;
  }

  function setColor(id: string, color: string) {
    const near = nearColor(color, id);
    setColorWarn(
      near
        ? `“${near.name}” ile renk çok yakın — Kaydet sonrası sitede görünür.`
        : "",
    );
    setRows((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)));
    setAll((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)));
    setDirty(true);
    setOk("");
    setColorOpenId(null);
  }

  function toggleHome(id: string, on: boolean) {
    if (!on) {
      setRows((prev) =>
        prev
          .filter((c) => c.id !== id)
          .map((c, i) => ({ ...c, homeOrder: i + 1, onHome: true })),
      );
      setAll((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, onHome: false, homeOrder: 0 } : c,
        ),
      );
    } else {
      setRows((prev) => {
        const cat =
          all.find((c) => c.id === id) ?? prev.find((c) => c.id === id);
        if (!cat) return prev;
        return [...prev, { ...cat, onHome: true, homeOrder: prev.length + 1 }];
      });
      setAll((prev) =>
        prev.map((c) => (c.id === id ? { ...c, onHome: true } : c)),
      );
    }
    setDirty(true);
    setOk("");
  }

  function addToHome() {
    if (!addId) return;
    if (rows.length >= HOME_RAIL_MAX_RECOMMENDED) {
      setError(
        `Not: ${HOME_RAIL_MAX_RECOMMENDED}+ şerit sayfayı uzatır; alt şeritler daha az görülür. Yine de ekleyebilirsiniz.`,
      );
    }
    const cat = all.find((c) => c.id === addId);
    if (!cat) return;
    const color =
      cat.color &&
      (CATEGORY_RAIL_PALETTE as readonly string[]).includes(cat.color)
        ? cat.color
        : CATEGORY_RAIL_PALETTE[rows.length % CATEGORY_RAIL_PALETTE.length]!;
    setRows((prev) => [
      ...prev,
      { ...cat, onHome: true, homeOrder: prev.length + 1, color },
    ]);
    setAll((prev) =>
      prev.map((c) =>
        c.id === addId ? { ...c, onHome: true, color } : c,
      ),
    );
    setAddId("");
    setDirty(true);
    setOk("");
  }

  async function saveAll() {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await adminApi.categories.saveHomeRails({
        items: rows.map((c, i) => ({
          id: c.id,
          onHome: true,
          homeOrder: i + 1,
          color: c.color ?? null,
        })),
      });
      setDirty(false);
      setOk("Kaydedildi — site önbelleği yenilendi");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  const candidates = useMemo(
    () => all.filter((c) => !rows.some((r) => r.id === c.id)),
    [all, rows],
  );

  const siteUrl = SITE_ORIGIN;

  return (
    <AdminShell>
      <AdminPage
        title="Ana sayfa şeritleri"
        subtitle={`Sürükle · renk · aç/kapa. En az ${HOME_RAIL_MIN_ARTICLES} haberi olmayan şerit sitede gizlenir.`}
        wide
        actions={
          <div className={styles.headActions}>
            <a
              className={styles.ghostBtn}
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} aria-hidden />
              Site
            </a>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!dirty || busy || loading}
              onClick={() => void saveAll()}
            >
              <Save size={16} aria-hidden />
              {busy ? "Kaydediliyor…" : dirty ? "Kaydet" : "Güncel"}
            </button>
          </div>
        }
      >
        {error ? (
          <p className={styles.flashErr} role="alert">
            {error}
          </p>
        ) : null}
        {colorWarn ? (
          <p className={styles.flashWarn} role="status">
            {colorWarn}
          </p>
        ) : null}
        {ok ? (
          <p className={styles.flashOk} role="status">
            {ok}
          </p>
        ) : null}
        {dirty ? (
          <p className={styles.flashWarn} role="status">
            Kaydedilmemiş değişiklik var.
          </p>
        ) : null}
        {rows.length > HOME_RAIL_MAX_RECOMMENDED ? (
          <p className={styles.flashWarn} role="status">
            {rows.length} şerit açık (önerilen {HOME_RAIL_MAX_RECOMMENDED}).
            Kayıt engellenmez.
          </p>
        ) : null}

        <div className={styles.railToolbar}>
          <span className={styles.railCount}>
            {rows.length}/{HOME_RAIL_MAX_RECOMMENDED} şerit
          </span>
          <select
            className={styles.railSelect}
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            aria-label="Kategori ekle"
          >
            <option value="">Kategori ekle…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `↳ ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!addId || busy}
            onClick={() => addToHome()}
          >
            <Plus size={16} aria-hidden />
            Ekle
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Yükleniyor…</p>
        ) : (
          <div className={styles.railTableWrap}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={rows.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className={styles.railTable}>
                  <thead>
                    <tr>
                      <th className={styles.railColDrag} />
                      <th className={styles.railColNum}>#</th>
                      <th className={styles.railColColor}>Renk</th>
                      <th>Kategori</th>
                      <th className={styles.railColPath}>Yol</th>
                      <th className={styles.railColOn}>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c, i) => (
                      <SortableRailRow
                        key={c.id}
                        category={c}
                        index={i}
                        busy={busy}
                        colorOpen={colorOpenId === c.id}
                        onToggleColor={() =>
                          setColorOpenId((prev) =>
                            prev === c.id ? null : c.id,
                          )
                        }
                        onCloseColor={() => setColorOpenId(null)}
                        onColor={(hex) => setColor(c.id, hex)}
                        onToggle={(on) => toggleHome(c.id, on)}
                      />
                    ))}
                    {!rows.length ? (
                      <tr>
                        <td colSpan={6} className={styles.railEmpty}>
                          Henüz şerit yok. Yukarıdan kategori ekleyin.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </AdminPage>
    </AdminShell>
  );
}

function SortableRailRow({
  category: c,
  index,
  busy,
  colorOpen,
  onToggleColor,
  onCloseColor,
  onColor,
  onToggle,
}: {
  category: ApiCategory;
  index: number;
  busy: boolean;
  colorOpen: boolean;
  onToggleColor: () => void;
  onCloseColor: () => void;
  onColor: (hex: string) => void;
  onToggle: (on: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: c.id });
  const popRef = useRef<HTMLDivElement>(null);
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };
  const accent = c.color || CATEGORY_RAIL_PALETTE[0]!;
  const bucket =
    CATEGORY_BUCKET_LABELS[c.bucket as keyof typeof CATEGORY_BUCKET_LABELS] ??
    c.bucket;

  useEffect(() => {
    if (!colorOpen) return;
    function onDoc(e: globalThis.MouseEvent) {
      if (!popRef.current?.contains(e.target as Node)) onCloseColor();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [colorOpen, onCloseColor]);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? styles.railTrDrag : undefined}
    >
      <td className={styles.railColDrag}>
        <button
          type="button"
          className={styles.railDrag}
          aria-label={`${c.name} sürükle`}
          disabled={busy}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} aria-hidden />
        </button>
      </td>
      <td className={styles.railColNum}>{index + 1}</td>
      <td className={styles.railColColor}>
        <div className={styles.railColorWrap} ref={popRef}>
          <button
            type="button"
            className={styles.railColorBtn}
            style={{ background: accent }}
            disabled={busy}
            aria-label={`${c.name} rengi`}
            aria-expanded={colorOpen}
            onClick={onToggleColor}
          />
          {colorOpen ? (
            <div className={styles.railColorPop} role="listbox" aria-label="Palet">
              {CATEGORY_RAIL_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  role="option"
                  aria-selected={c.color === hex}
                  className={
                    c.color === hex ? styles.railSwatchOn : styles.railSwatch
                  }
                  style={{ background: hex }}
                  onClick={() => onColor(hex)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </td>
      <td>
        <div className={styles.railName}>
          <strong>{c.name}</strong>
          <span>{bucket}</span>
        </div>
      </td>
      <td className={styles.railColPath}>/{c.slug}</td>
      <td className={styles.railColOn}>
        <button
          type="button"
          className={styles.railSwitch}
          role="switch"
          aria-checked={c.onHome}
          aria-label={`${c.name} şeridi`}
          data-on={c.onHome ? "1" : "0"}
          disabled={busy}
          onClick={() => onToggle(!c.onHome)}
        >
          <span className={styles.railSwitchKnob} aria-hidden />
          <span className={styles.railSwitchLabel}>
            {c.onHome ? "Açık" : "Kapalı"}
          </span>
        </button>
      </td>
    </tr>
  );
}
