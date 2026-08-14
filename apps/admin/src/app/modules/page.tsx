"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import {
  MODULE_GROUPS,
  countByStatus,
  type ModuleStatus,
} from "./modules-data";
import styles from "./modules.module.css";

type Filter = "all" | ModuleStatus;

const STATUS_LABEL: Record<ModuleStatus, string> = {
  ready: "Hazır",
  partial: "Kısmi",
  planned: "Planlı",
};

/**
 * Rakip özellik listesi × mevcut panel — Modül Yönetimi
 */
export default function ModulesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const counts = useMemo(() => countByStatus(MODULE_GROUPS), []);

  const groups = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    return MODULE_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (filter !== "all" && item.status !== filter) return false;
        if (!needle) return true;
        return (
          item.name.toLocaleLowerCase("tr-TR").includes(needle) ||
          (item.note ?? "").toLocaleLowerCase("tr-TR").includes(needle)
        );
      }),
    })).filter((g) => g.items.length > 0);
  }, [filter, q]);

  return (
    <AdminShell>
      <AdminPage
        title="Modül Yönetimi"
        subtitle="Rakip CMS özellik listesi — bizde ne hazır, ne kısmi, ne planlı"
        wide
      >
        <div className={styles.summary} aria-label="Özet">
          <div className={styles.stat}>
            <span>Toplam</span>
            <strong>{counts.total}</strong>
          </div>
          <div className={styles.stat} data-tone="ready">
            <span>Hazır</span>
            <strong>{counts.ready}</strong>
          </div>
          <div className={styles.stat} data-tone="partial">
            <span>Kısmi</span>
            <strong>{counts.partial}</strong>
          </div>
          <div className={styles.stat} data-tone="planned">
            <span>Planlı</span>
            <strong>{counts.planned}</strong>
          </div>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className="sr-only">Ara</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Özellik ara…"
              aria-label="Özellik ara"
            />
          </label>
          <div className={styles.filters} role="tablist" aria-label="Durum">
            {(
              [
                ["all", "Tümü"],
                ["ready", "Hazır"],
                ["partial", "Kısmi"],
                ["planned", "Planlı"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={filter === id ? styles.filterOn : styles.filter}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.groups}>
          {groups.map((g) => (
            <section key={g.id} className={styles.group} aria-labelledby={`mod-${g.id}`}>
              <h2 id={`mod-${g.id}`}>
                {g.title}
                <em>{g.items.length}</em>
              </h2>
              <ul className={styles.list}>
                {g.items.map((item) => (
                  <li key={item.name} className={styles.row} data-status={item.status}>
                    <span
                      className={styles.badge}
                      data-status={item.status}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                    <div className={styles.info}>
                      <strong>{item.name}</strong>
                      {item.note ? <span>{item.note}</span> : null}
                    </div>
                    {item.href ? (
                      <Link href={item.href} className={styles.open}>
                        Aç
                      </Link>
                    ) : (
                      <span className={styles.openGhost} aria-hidden>
                        —
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!groups.length ? (
            <p className={styles.empty}>Eşleşen özellik yok.</p>
          ) : null}
        </div>
      </AdminPage>
    </AdminShell>
  );
}
