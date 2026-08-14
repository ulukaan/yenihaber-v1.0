"use client";

import { useState, type ReactNode } from "react";
import styles from "./rich-text-editor.module.css";

export function ToolBtn({
  title,
  onClick,
  children,
  disabled,
  active,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={active ? styles.toolOn : styles.tool}
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

type MenuItem = { label: string; action: () => void; danger?: boolean };

/** Menü çubuğu açılır menü */
export function MenuDrop({
  label,
  items,
  disabled,
}: {
  label: string;
  items: MenuItem[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.menuItem}>
      <button
        type="button"
        className={styles.menuBtn}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        {label}
      </button>
      {open ? (
        <ul className={styles.menuList} role="menu">
          {items.map((it) => (
            <li key={it.label} role="none">
              <button
                type="button"
                role="menuitem"
                className={it.danger ? styles.menuDanger : styles.menuOption}
                onMouseDown={(e) => {
                  e.preventDefault();
                  it.action();
                  setOpen(false);
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
