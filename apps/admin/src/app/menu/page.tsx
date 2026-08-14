"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
import { GripVertical, Trash2 } from "lucide-react";
import type {
  ApiCategory,
  ApiMenu,
  ApiMenuItem,
  MenuItemType,
  MenuLocation,
} from "@yenihaber/shared";
import {
  MENU_ICON_PRESETS,
  MENU_LOCATION_META,
  MENU_STATIC_PAGES,
} from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { adminApi } from "@/lib/api";
import { AddItemRow } from "./menu-add-row";
import { MenuLivePreview } from "./menu-preview";
import styles from "./menu.module.css";

const TABS: MenuLocation[] = ["header", "footer", "sidebar", "icons"];

const TYPE_LABEL: Record<string, string> = {
  category: "Kategori",
  page: "Sayfa",
  tag: "Etiket",
  link: "Bağlantı",
  heading: "Başlık",
  icon: "İkon",
};

export default function MenuAdminPage() {
  const [location, setLocation] = useState<MenuLocation>("header");
  const [menu, setMenu] = useState<ApiMenu | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const meta = MENU_LOCATION_META[location];
  const selected = useMemo(() => {
    if (!menu || !selectedId) return null;
    for (const r of menu.items) {
      if (r.id === selectedId) return r;
      for (const c of r.children) if (c.id === selectedId) return c;
    }
    return null;
  }, [menu, selectedId]);

  const load = useCallback(async (loc: MenuLocation, keepId?: string | null) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.menus.admin(loc);
      setMenu(res.menu);
      const items = res.menu?.items ?? [];
      const keep =
        keepId &&
        items.some(
          (r) => r.id === keepId || r.children.some((c) => c.id === keepId),
        );
      setSelectedId(keep ? keepId! : (items[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(location);
  }, [location, load]);

  useEffect(() => {
    void adminApi.categories.list().then(setCategories).catch(() => undefined);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function onDragEnd(e: DragEndEvent) {
    if (!menu || !e.over || e.active.id === e.over.id) return;
    const ids = menu.items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(e.active.id));
    const newIndex = ids.indexOf(String(e.over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextItems = arrayMove(menu.items, oldIndex, newIndex);
    setMenu({ ...menu, items: nextItems });
    try {
      await adminApi.menus.reorder(location, {
        orderedIds: nextItems.map((i) => i.id),
        parentId: null,
      });
      setOk("Sıra kaydedildi");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sıra kaydedilemedi");
      void load(location, selectedId);
    }
  }

  async function saveSelected(patch: Record<string, unknown>) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.menus.updateItem(selected.id, patch);
      await load(location, selected.id);
      setOk("Kaydedildi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string, label: string) {
    const okDel = window.confirm(
      `«${label}» kalıcı olarak silinsin mi? Alt öğeler de silinir.`,
    );
    if (!okDel) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.menus.remove(id);
      await load(location, selectedId === id ? null : selectedId);
      setOk("Öğe silindi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function deactivateSelected() {
    if (!selected) return;
    setBusy(true);
    try {
      await adminApi.menus.deactivate(selected.id);
      await load(location, selected.id);
      setOk("Öğe pasifleştirildi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function addItem(type: MenuItemType) {
    setBusy(true);
    try {
      const body =
        type === "icon"
          ? {
              type: "icon" as const,
              refId:
                MENU_ICON_PRESETS.find(
                  (p) => !menu?.items.some((i) => i.refId === p.id),
                )?.id ?? "theme",
              icon: "Share2",
              isActive: true,
            }
          : type === "heading"
            ? {
                type: "heading" as const,
                label: "Başlık",
                isActive: true,
              }
            : type === "link"
              ? {
                  type: "link" as const,
                  label: "Bağlantı",
                  url: "/",
                  isActive: true,
                }
              : type === "page"
                ? {
                    type: "page" as const,
                    refId: MENU_STATIC_PAGES[0]?.id ?? "iletisim",
                    isActive: true,
                  }
                : {
                    type,
                    refId: categories[0]?.id ?? null,
                    isActive: true,
                  };
      await adminApi.menus.createItem(location, body);
      await load(location);
      setOk("Öğe eklendi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function copyHeader() {
    setBusy(true);
    try {
      const res = await adminApi.menus.copyHeaderToSidebar();
      setMenu(res.menu);
      setLocation("sidebar");
      setOk("Üst menü yan menüye eklendi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kopyalanamadı");
    } finally {
      setBusy(false);
    }
  }

  const itemCount = menu?.items.length ?? 0;

  return (
    <AdminShell>
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <h1>Menü yönetimi</h1>
            <p>
              {meta.label} · {itemCount} öğe
              {menu?.updatedAt
                ? ` · son kayıt ${new Date(menu.updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
          </div>
          {location === "sidebar" ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={busy}
              onClick={() => void copyHeader()}
            >
              Üst menüyü kopyala
            </button>
          ) : null}
        </header>

        <nav className={styles.tabs} aria-label="Menü lokasyonu">
          {TABS.map((t) => {
            const on = location === t;
            return (
              <button
                key={t}
                type="button"
                className={on ? styles.tabOn : styles.tab}
                onClick={() => setLocation(t)}
                aria-current={on ? "page" : undefined}
              >
                {MENU_LOCATION_META[t].label}
              </button>
            );
          })}
        </nav>

        <div className={styles.toastRow}>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          {ok ? <p className={styles.ok}>{ok}</p> : null}
        </div>

        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        {!loading && location === "icons" ? (
          <IconsPanel
            items={menu?.items ?? []}
            busy={busy}
            onReorder={async (orderedIds) => {
              if (!menu) return;
              const map = new Map(menu.items.map((i) => [i.id, i]));
              setMenu({
                ...menu,
                items: orderedIds.map((id) => map.get(id)!).filter(Boolean),
              });
              await adminApi.menus.reorder("icons", {
                orderedIds,
                parentId: null,
              });
            }}
            onToggle={async (id, isActive) => {
              await adminApi.menus.updateItem(id, { isActive });
              await load("icons");
            }}
            onRemove={(id, label) => void removeItem(id, label)}
          />
        ) : null}

        {!loading && location !== "icons" && menu ? (
          <div className={styles.workspace}>
            <section className={styles.tree} aria-label="Menü öğeleri">
              <div className={styles.panelHead}>
                <h2>{meta.label}</h2>
                <span>
                  {itemCount} / {meta.maxRoots} öğe
                </span>
              </div>
              <div className={styles.treeBody}>
                {menu.items.length === 0 ? (
                  <p className={styles.emptyList}>Henüz öğe yok</p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => void onDragEnd(e)}
                  >
                    <SortableContext
                      items={menu.items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className={styles.list}>
                        {menu.items.map((item) => (
                          <SortableRow
                            key={item.id}
                            item={item}
                            selectedId={selectedId}
                            busy={busy}
                            onSelect={setSelectedId}
                            onRemove={removeItem}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
              <AddItemRow
                disabled={busy || itemCount >= meta.maxRoots}
                onAdd={(type) => void addItem(type)}
              />
            </section>

            <ItemEditor
              item={selected}
              items={menu.items}
              categories={categories}
              location={location}
              busy={busy}
              onSave={(p) => void saveSelected(p)}
              onDeactivate={() => void deactivateSelected()}
              onRemove={() =>
                selected
                  ? void removeItem(selected.id, selected.resolvedLabel)
                  : undefined
              }
            />
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}

function SortableRow({
  item,
  selectedId,
  busy,
  onSelect,
  onRemove,
}: {
  item: ApiMenuItem;
  selectedId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string, label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li ref={setNodeRef} style={style} className={styles.rowWrap}>
      <div
        className={[
          styles.row,
          item.type === "heading" ? styles.rowHead : "",
          selectedId === item.id ? styles.rowOn : "",
          !item.isActive ? styles.rowPassive : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={styles.rowMain}
          onClick={() => onSelect(item.id)}
        >
          <span className={styles.grip} {...attributes} {...listeners}>
            <GripVertical size={16} aria-hidden />
          </span>
          <span className={styles.rowBody}>
            <strong>{item.resolvedLabel}</strong>
          </span>
          {item.badgeText ? (
            <span
              className={styles.badge}
              style={{ background: item.badgeColor ?? "#E10600" }}
            >
              {item.badgeText}
            </span>
          ) : null}
        </button>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            disabled={busy}
            aria-label={`${item.resolvedLabel} öğesini sil`}
            onClick={() => onRemove(item.id, item.resolvedLabel)}
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      </div>
      {item.children.length ? (
        <ul className={styles.sub}>
          {item.children.map((ch) => (
            <li key={ch.id} className={styles.subRow}>
              <button
                type="button"
                className={
                  selectedId === ch.id ? styles.subOn : styles.subBtn
                }
                onClick={() => onSelect(ch.id)}
              >
                {ch.resolvedLabel}
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                disabled={busy}
                aria-label={`${ch.resolvedLabel} öğesini sil`}
                onClick={() => onRemove(ch.id, ch.resolvedLabel)}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function IconsPanel({
  items,
  busy,
  onReorder,
  onToggle,
  onRemove,
}: {
  items: ApiMenuItem[];
  busy: boolean;
  onReorder: (ids: string[]) => Promise<void>;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onRemove: (id: string, label: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  return (
    <div className={styles.iconsBox}>
      <div className={styles.panelHead}>
        <h2>İkonlar</h2>
        <span>Mobilde ilk 3 görünür</span>
      </div>
      <div className={styles.iconsBody}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => {
            if (!e.over || e.active.id === e.over.id) return;
            const ids = items.map((i) => i.id);
            const oldIndex = ids.indexOf(String(e.active.id));
            const newIndex = ids.indexOf(String(e.over.id));
            if (oldIndex < 0 || newIndex < 0) return;
            void onReorder(arrayMove(ids, oldIndex, newIndex));
          }}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={styles.iconList}>
              {items.map((item) => (
                <IconRow
                  key={item.id}
                  item={item}
                  locked={item.refId === "search"}
                  busy={busy}
                  onToggle={onToggle}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function IconRow({
  item,
  locked,
  busy,
  onToggle,
  onRemove,
}: {
  item: ApiMenuItem;
  locked: boolean;
  busy: boolean;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onRemove: (id: string, label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const preset = MENU_ICON_PRESETS.find((p) => p.id === item.refId);
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={styles.iconRow}
    >
      <button
        type="button"
        className={styles.grip}
        aria-label="Sürükle"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <span className={styles.iconPh} aria-hidden />
      <div>
        <strong>{item.resolvedLabel}</strong>
        <em>{preset?.hint ?? item.refId}</em>
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={item.isActive}
          disabled={locked || busy}
          onChange={(e) => void onToggle(item.id, e.target.checked)}
          aria-label="Aktif"
        />
      </label>
      <button
        type="button"
        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
        disabled={locked || busy}
        aria-label={`${item.resolvedLabel} ikonunu sil`}
        onClick={() => onRemove(item.id, item.resolvedLabel)}
      >
        <Trash2 size={15} aria-hidden />
      </button>
    </li>
  );
}

function ItemEditor({
  item,
  items,
  categories,
  location,
  busy,
  onSave,
  onDeactivate,
  onRemove,
}: {
  item: ApiMenuItem | null;
  items: ApiMenuItem[];
  categories: ApiCategory[];
  location: MenuLocation;
  busy: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onDeactivate: () => void;
  onRemove: () => void;
}) {
  const [form, setForm] = useState({
    label: "",
    type: "category" as MenuItemType,
    refId: "",
    url: "",
    icon: "",
    badgeText: "",
    badgeColor: "#E10600",
    dropdownType: "simple",
    hasDropdown: true,
    device: "all",
    targetBlank: false,
    isActive: true,
    startAt: "",
    endAt: "",
  });

  useEffect(() => {
    if (!item) return;
    setForm({
      label: item.label ?? "",
      type: item.type,
      refId: item.refId ?? "",
      url: item.url ?? "",
      icon: item.icon ?? "",
      badgeText: item.badgeText ?? "",
      badgeColor: item.badgeColor ?? "#E10600",
      dropdownType: item.dropdownType,
      hasDropdown: item.children.length > 0 || item.dropdownType === "mega",
      device: item.device,
      targetBlank: item.targetBlank,
      isActive: item.isActive,
      startAt: item.startAt ? toLocal(item.startAt) : "",
      endAt: item.endAt ? toLocal(item.endAt) : "",
    });
  }, [item]);

  if (!item) {
    return (
      <section className={styles.editor}>
        <div className={styles.editorEmpty}>
          <strong>Öğe seçin</strong>
          <p className={styles.muted}>
            Soldaki listeden düzenlemek istediğiniz menü öğesini seçin.
          </p>
        </div>
        <MenuLivePreview items={items} />
      </section>
    );
  }

  return (
    <section className={styles.editor} aria-label="Öğe düzenle">
      <div className={styles.panelHead}>
        <h2>Düzenle</h2>
        <span>{TYPE_LABEL[item.type] ?? item.type}</span>
      </div>
      <div className={styles.editorBody}>
        <div className={styles.editorTitle}>
          <div>
            <h2>{item.resolvedLabel}</h2>
            <p className={styles.editorMeta}>
              {TYPE_LABEL[item.type] ?? item.type}
              {item.href ? ` · ${item.href}` : ""}
            </p>
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <label>
            Görünen ad
            <input
              value={form.label}
              placeholder="Boşsa hedefin adı"
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
            />
          </label>
          <label>
            İkon
            <input
              value={form.icon}
              placeholder="map-pin"
              onChange={(e) =>
                setForm((f) => ({ ...f, icon: e.target.value }))
              }
            />
          </label>
          <label>
            Cihaz
            <select
              value={form.device}
              onChange={(e) =>
                setForm((f) => ({ ...f, device: e.target.value }))
              }
            >
              <option value="all">Hepsi</option>
              <option value="desktop">Masaüstü</option>
              <option value="mobile">Mobil</option>
            </select>
          </label>
          <label>
            Bağlantı tipi
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as MenuItemType,
                }))
              }
            >
              <option value="category">Kategori</option>
              <option value="page">Sayfa</option>
              <option value="tag">Etiket</option>
              <option value="link">Özel bağlantı</option>
              <option value="heading">Başlık</option>
            </select>
          </label>
          {form.type === "category" ? (
            <label>
              Kategori
              <select
                value={form.refId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, refId: e.target.value }))
                }
              >
                <option value="">Seçin…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {form.type === "page" ? (
            <label>
              Sayfa
              <select
                value={form.refId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, refId: e.target.value }))
                }
              >
                {MENU_STATIC_PAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {form.type === "link" ? (
            <label>
              Adres
              <input
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                placeholder="/secim"
              />
            </label>
          ) : null}
          <div className={styles.row2}>
            <label>
              Rozet
              <input
                value={form.badgeText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, badgeText: e.target.value }))
                }
                placeholder="Canlı"
              />
            </label>
            <label>
              Renk
              <input
                type="color"
                value={form.badgeColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, badgeColor: e.target.value }))
                }
              />
            </label>
          </div>
          {location === "header" && !item.parentId ? (
            <label>
              Açılış tipi
              <select
                value={form.dropdownType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dropdownType: e.target.value }))
                }
              >
                <option value="simple">Basit liste</option>
                <option value="mega">Mega menü</option>
              </select>
            </label>
          ) : null}
          <label className={styles.switchLine}>
            <input
              type="checkbox"
              checked={form.hasDropdown}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  hasDropdown: e.target.checked,
                  dropdownType: e.target.checked
                    ? f.dropdownType === "mega"
                      ? "mega"
                      : "simple"
                    : "simple",
                }))
              }
            />
            Alt menüsü açılabilir
          </label>
          <label className={styles.switchLine}>
            <input
              type="checkbox"
              checked={form.targetBlank}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetBlank: e.target.checked }))
              }
            />
            Yeni sekmede aç
          </label>
          <div className={styles.row2}>
            <label>
              Başlangıç
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startAt: e.target.value }))
                }
              />
            </label>
            <label>
              Bitiş
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endAt: e.target.value }))
                }
              />
            </label>
          </div>
          <label className={styles.switchLine}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            Aktif
          </label>
        </div>

        <MenuLivePreview items={items} />

        <div className={styles.editorActions}>
          <button
            type="button"
            className={styles.dangerSolid}
            disabled={busy}
            onClick={onRemove}
          >
            <Trash2 size={15} aria-hidden /> Sil
          </button>
          <div className={styles.editorActionsRight}>
            <button
              type="button"
              className={styles.ghostBtn}
              disabled={busy || !item.isActive}
              onClick={onDeactivate}
            >
              Pasif et
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={busy}
              onClick={() =>
                onSave({
                  label: form.label || null,
                  type: form.type,
                  refId: form.refId || null,
                  url: form.url || null,
                  icon: form.icon || null,
                  badgeText: form.badgeText || null,
                  badgeColor: form.badgeText ? form.badgeColor : null,
                  dropdownType: form.dropdownType,
                  device: form.device,
                  targetBlank: form.targetBlank,
                  isActive: form.isActive,
                  startAt: form.startAt
                    ? new Date(form.startAt).toISOString()
                    : null,
                  endAt: form.endAt
                    ? new Date(form.endAt).toISOString()
                    : null,
                })
              }
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function toLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
