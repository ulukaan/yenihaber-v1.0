"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { MenuItemType } from "@yenihaber/shared";
import styles from "./menu.module.css";

const OPTIONS: { type: MenuItemType; label: string; hint: string }[] = [
  { type: "category", label: "Kategori", hint: "Haber kategorisi" },
  { type: "page", label: "Sayfa", hint: "Sabit sayfa" },
  { type: "link", label: "Bağlantı", hint: "Özel adres" },
  { type: "heading", label: "Başlık", hint: "Grup etiketi" },
  { type: "tag", label: "Etiket", hint: "Etiket sayfası" },
];

export function AddItemRow({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd: (type: MenuItemType) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className={styles.addWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.addBtn}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus size={16} aria-hidden /> Öğe ekle
      </button>
      {open ? (
        <ul className={styles.addMenu} role="menu">
          {OPTIONS.map((opt) => (
            <li key={opt.type}>
              <button
                type="button"
                role="menuitem"
                className={styles.addOption}
                onClick={() => {
                  onAdd(opt.type);
                  setOpen(false);
                }}
              >
                <strong>{opt.label}</strong>
                <span>{opt.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
