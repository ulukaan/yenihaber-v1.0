"use client";

import { Suspense, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import type { HaberDurumFiltre } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { HaberListTable } from "./haber-list-table";
import { useHaberList } from "./use-haber-list";
import styles from "./articles.module.css";

const TABS: { id: HaberDurumFiltre; label: string; mineLabel?: string }[] = [
  { id: "hepsi", label: "Tümü" },
  { id: "taslak", label: "Taslak", mineLabel: "Taslaklarım" },
  { id: "onayda", label: "Onayda" },
  { id: "zamanli", label: "Zamanlı" },
  { id: "yayinda", label: "Yayında" },
  { id: "arsiv", label: "Arşiv" },
];

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <div className={styles.page}>
            <p className={styles.muted}>Yükleniyor…</p>
          </div>
        </AdminShell>
      }
    >
      <ArticlesPageInner />
    </Suspense>
  );
}

function ArticlesPageInner() {
  const searchRef = useRef<HTMLInputElement>(null);
  const h = useHaberList(searchRef);

  return (
    <AdminShell>
      <AdminPage
        title="Haberler"
        subtitle="/ ara · n yeni · j/k satır · e düzenle · boşluk seç"
        wide
        className={styles.page}
        actions={
          <AdminButton variant="primary" href="/articles/new">
            <Plus size={18} aria-hidden />
            Yeni Haber
          </AdminButton>
        }
      >
        <div className={styles.filterRow}>
          <div className={styles.tabs} role="tablist" aria-label="Durum">
            {TABS.map((tab) => {
              const label =
                h.isReporter && tab.mineLabel ? tab.mineLabel : tab.label;
              const count = h.counts[tab.id] ?? 0;
              const active = h.parsed.durum === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? styles.tabActive : styles.tab}
                  onClick={() => h.pushFilter({ durum: tab.id, page: 1 })}
                >
                  {label} <span className={styles.tabCount}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.filterSide}>
            <label className={styles.srOnly} htmlFor="haber-kategori">
              Kategori
            </label>
            <select
              id="haber-kategori"
              className={styles.select}
              value={h.parsed.kategori ?? ""}
              onChange={(e) =>
                h.pushFilter({ kategori: e.target.value || null, page: 1 })
              }
            >
              <option value="">Kategori</option>
              {h.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className={styles.search}>
              <Search size={16} className={styles.searchIcon} aria-hidden />
              <input
                ref={searchRef}
                className={styles.searchInput}
                placeholder="Ara… (/)"
                value={h.qDraft}
                onChange={(e) => h.setQDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    h.pushFilter({ q: h.qDraft.trim() || null, page: 1 });
                  }
                }}
                aria-label="Haber ara"
              />
            </div>
          </div>
        </div>

        {h.selected.size > 0 && (
          <div className={styles.bulkBar} role="region" aria-label="Toplu işlem">
            <span>{h.selected.size} haber seçildi</span>
            <div className={styles.bulkActions}>
              <button
                type="button"
                className={styles.bulkBtn}
                disabled={h.bulkBusy}
                onClick={() =>
                  void h.runBulk({ action: "onayla", ids: h.selectedIds })
                }
              >
                {h.publisher ? "Onayla" : "Onaya gönder"}
              </button>
              {h.publisher && (
                <button
                  type="button"
                  className={styles.bulkBtn}
                  disabled={h.bulkBusy}
                  onClick={() =>
                    void h.runBulk({ action: "yayinla", ids: h.selectedIds })
                  }
                >
                  Yayınla
                </button>
              )}
              <label className={styles.bulkCat}>
                <span className={styles.srOnly}>Kategori değiştir</span>
                <select
                  disabled={h.bulkBusy}
                  defaultValue=""
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    if (!categoryId) return;
                    void h.runBulk({
                      action: "kategori",
                      ids: h.selectedIds,
                      categoryId,
                    });
                    e.target.value = "";
                  }}
                >
                  <option value="">Kategori değiştir</option>
                  {h.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {h.publisher && (
                <button
                  type="button"
                  className={styles.bulkBtn}
                  disabled={h.bulkBusy}
                  onClick={() =>
                    void h.runBulk({ action: "arsivle", ids: h.selectedIds })
                  }
                >
                  Arşivle / Sil
                </button>
              )}
            </div>
          </div>
        )}

        {h.error && (
          <div className={styles.error} role="alert">
            {h.error}
            <button type="button" className={styles.retry} onClick={() => void h.load()}>
              Yenile
            </button>
          </div>
        )}

        {h.loading ? (
          <p className={styles.muted}>Yükleniyor…</p>
        ) : h.items.length === 0 ? (
          <AdminEmpty
            title="Bu filtrede haber yok"
            description="Filtreyi değiştirin ya da yeni bir haber oluşturun."
            action={
              <AdminButton variant="primary" href="/articles/new">
                Yeni haber
              </AdminButton>
            }
          />
        ) : (
          <HaberListTable
            items={h.items}
            categories={h.categories}
            selected={h.selected}
            focusIdx={h.focusIdx}
            editing={h.editing}
            role={h.role}
            publisher={h.publisher}
            onFocus={h.setFocusIdx}
            onToggle={h.toggleSelect}
            onToggleAll={() => {
              if (h.items.every((i) => h.selected.has(i.id))) {
                h.setSelected(new Set());
              } else {
                h.setSelected(new Set(h.items.map((i) => i.id)));
              }
            }}
            onEdit={h.setEditing}
            onPatch={h.patchInline}
            onHardDelete={(id) => void h.hardDelete(id)}
            onArchive={(id) => {
              if (
                !window.confirm(
                  "Haber arşive taşınacak (siteden kalkar). Geri almak için Arşiv sekmesinden yayınlayabilirsiniz.",
                )
              ) {
                return;
              }
              void h.runBulk({ action: "arsivle", ids: [id] });
            }}
          />
        )}

        <footer className={styles.footer}>
          <span className={styles.muted}>Sayfa başına {h.parsed.limit}</span>
          <div className={styles.pager}>
            <span className={styles.muted}>
              {h.rangeStart}–{h.rangeEnd} / {h.total}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={h.parsed.page <= 1}
              aria-label="Önceki sayfa"
              onClick={() => h.pushFilter({ page: h.parsed.page - 1 })}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={h.parsed.page >= h.totalPages}
              aria-label="Sonraki sayfa"
              onClick={() => h.pushFilter({ page: h.parsed.page + 1 })}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>

        {h.undo && (
          <div className={styles.toast} role="status">
            <span>{h.undo.message}</span>
            <button
              type="button"
              className={styles.undoBtn}
              onClick={() => void h.undoLast()}
            >
              Geri al
            </button>
          </div>
        )}
      </AdminPage>
    </AdminShell>
  );
}
