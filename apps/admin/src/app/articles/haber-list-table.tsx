"use client";

import Link from "next/link";
import type { ApiArticle, ApiCategory, Role } from "@yenihaber/shared";
import type { HaberInlineUpdate } from "@yenihaber/shared";
import { Eye } from "lucide-react";
import styles from "./articles.module.css";
import {
  formatViews,
  formatWhenFull,
  fromDatetimeLocal,
  toDatetimeLocal,
  type InlineEdit,
} from "./haber-list-utils";
import {
  FlagToggle,
  IconFacebook,
  IconWhatsApp,
  IconX,
  IslemlerMenu,
  ShareInstagramButton,
} from "./haber-list-row-widgets";

const WEB_URL = (
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

type Props = {
  items: ApiArticle[];
  categories: ApiCategory[];
  selected: Set<string>;
  focusIdx: number;
  editing: InlineEdit | null;
  role: Role;
  publisher: boolean;
  onFocus: (idx: number) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (edit: InlineEdit | null) => void;
  onPatch: (id: string, body: HaberInlineUpdate) => void;
  onHardDelete: (id: string) => void;
  onArchive?: (id: string) => void;
};

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

/**
 * Haber listesi — ID, başlık+tarih+etiket, hit, M/SM/ÖÇ, paylaş, işlemler
 */
export function HaberListTable({
  items,
  categories,
  selected,
  focusIdx,
  editing,
  role,
  publisher,
  onFocus,
  onToggle,
  onToggleAll,
  onEdit,
  onPatch,
  onHardDelete,
  onArchive,
}: Props) {
  const allSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colCheck}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Tümünü seç"
              />
            </th>
            <th className={styles.colId}>ID</th>
            <th>Başlık</th>
            <th className={styles.colHit}>Hit</th>
            <th className={styles.colFlags} title="Manşet · Sürmanşet · Öne çıkan">
              <span className={styles.flagHeads}>
                <span className={styles.headM}>M</span>
                <span className={styles.headSm}>SM</span>
                <span className={styles.headOc}>ÖÇ</span>
              </span>
            </th>
            <th className={styles.colShare}>Paylaş</th>
            <th className={styles.colOps}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => {
            const focused = idx === focusIdx;
            const isEditingTitle =
              editing?.id === row.id && editing.field === "title";
            const isEditingCat =
              editing?.id === row.id && editing.field === "category";
            const isEditingTime =
              editing?.id === row.id && editing.field === "time";
            const publicUrl = `${WEB_URL}/haber/${row.slug}`;
            const enc = encodeURIComponent(publicUrl);
            const encTitle = encodeURIComponent(row.title);
            const live = row.status === "YAYINDA";

            return (
              <tr
                key={row.id}
                className={focused ? styles.rowFocus : undefined}
                onClick={() => onFocus(idx)}
              >
                <td className={styles.colCheck}>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => onToggle(row.id)}
                    aria-label={`${row.title} seç`}
                  />
                </td>
                <td className={styles.colId} title={row.id}>
                  {shortId(row.id)}
                </td>
                <td>
                  <div className={styles.titleCell}>
                    {isEditingTitle ? (
                      <input
                        className={styles.inlineInput}
                        defaultValue={row.title}
                        autoFocus
                        aria-label="Başlık"
                        onBlur={(e) => {
                          const title = e.target.value.trim();
                          if (title && title !== row.title)
                            onPatch(row.id, { title });
                          else onEdit(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") onEdit(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className={styles.titleBtn}
                        onDoubleClick={() =>
                          onEdit({ id: row.id, field: "title" })
                        }
                      >
                        {row.title}
                      </button>
                    )}
                    <div className={styles.titleMeta}>
                      {isEditingTime ? (
                        <input
                          type="datetime-local"
                          className={styles.inlineInputSm}
                          defaultValue={toDatetimeLocal(
                            row.scheduledAt ?? row.publishedAt,
                          )}
                          autoFocus
                          aria-label="Yayın saati"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const iso = fromDatetimeLocal(e.target.value);
                            if (row.status === "ZAMANLANMIS") {
                              onPatch(row.id, { scheduledAt: iso });
                            } else {
                              onPatch(row.id, { publishedAt: iso });
                            }
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className={styles.dateChip}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit({ id: row.id, field: "time" });
                          }}
                        >
                          {formatWhenFull(
                            row.publishedAt ??
                              row.scheduledAt ??
                              row.createdAt,
                          )}
                        </button>
                      )}
                      {isEditingCat ? (
                        <select
                          className={styles.inlineSelect}
                          defaultValue={row.category.id}
                          autoFocus
                          aria-label="Kategori"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onPatch(row.id, { categoryId: e.target.value })
                          }
                          onBlur={() => onEdit(null)}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          className={styles.tagPill}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit({ id: row.id, field: "category" });
                          }}
                        >
                          {row.category.name}
                        </button>
                      )}
                      {row.tags?.slice(0, 4).map((t) => (
                        <span key={t.id} className={styles.tagPillMuted}>
                          {t.name}
                        </span>
                      ))}
                      {row.status !== "YAYINDA" ? (
                        <span className={styles.statusPill}>
                          {row.status === "TASLAK"
                            ? "Taslak"
                            : row.status === "ONAYDA"
                              ? "Onayda"
                              : row.status === "ZAMANLANMIS"
                                ? "Zamanlı"
                                : "Arşiv"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className={styles.colHit}>
                  {formatViews(row.viewCount ?? 0)}
                </td>
                <td className={styles.colFlags}>
                  <div className={styles.flagRow}>
                    <FlagToggle
                      title="Manşet"
                      tone="m"
                      on={row.isFeatured}
                      disabled={!publisher}
                      onClick={() =>
                        onPatch(row.id, { isFeatured: !row.isFeatured })
                      }
                    />
                    <FlagToggle
                      title="Sürmanşet"
                      tone="sm"
                      on={row.isSideManset}
                      disabled={!publisher}
                      onClick={() =>
                        onPatch(row.id, { isSideManset: !row.isSideManset })
                      }
                    />
                    <FlagToggle
                      title="Öne çıkan (ana sayfa seçki)"
                      tone="oc"
                      on={Boolean(row.isSpotlight)}
                      disabled={!publisher}
                      onClick={() =>
                        onPatch(row.id, { isSpotlight: !row.isSpotlight })
                      }
                    />
                  </div>
                </td>
                <td className={styles.colShare}>
                  <div className={styles.shareRow}>
                    {live ? (
                      <a
                        className={styles.shareEye}
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Görüntüle"
                        aria-label="Sitede görüntüle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={15} aria-hidden />
                      </a>
                    ) : (
                      <Link
                        className={styles.shareEye}
                        href={`/articles/${row.id}`}
                        title="Düzenle"
                        aria-label="Düzenle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={15} aria-hidden />
                      </Link>
                    )}
                    <a
                      className={styles.shareFb}
                      href={
                        live
                          ? `https://www.facebook.com/sharer/sharer.php?u=${enc}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      title="Facebook"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!live) e.preventDefault();
                      }}
                      data-disabled={!live || undefined}
                    >
                      <IconFacebook />
                    </a>
                    <a
                      className={styles.shareX}
                      href={
                        live
                          ? `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="X"
                      title="X"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!live) e.preventDefault();
                      }}
                      data-disabled={!live || undefined}
                    >
                      <IconX />
                    </a>
                    <a
                      className={styles.shareWa}
                      href={
                        live
                          ? `https://wa.me/?text=${encodeURIComponent(`${row.title} ${publicUrl}`)}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      title="WhatsApp"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!live) e.preventDefault();
                      }}
                      data-disabled={!live || undefined}
                    >
                      <IconWhatsApp />
                    </a>
                    <ShareInstagramButton url={publicUrl} disabled={!live} />
                  </div>
                </td>
                <td className={styles.colOps}>
                  <IslemlerMenu
                    row={row}
                    role={role}
                    publisher={publisher}
                    onHardDelete={onHardDelete}
                    onArchive={onArchive}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
