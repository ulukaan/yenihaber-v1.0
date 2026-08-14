"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./nav-dropdown.module.css";

export type NavDropdownItem = {
  href: string;
  label: string;
};

export type NavDropdownProps = {
  href: string;
  label: string;
  items: NavDropdownItem[];
};

/**
 * Hover / focus / tıklama ile açılan alt menü.
 * Position fixed — üst bar overflow kesmesin.
 */
export function NavDropdown({ href, label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }

  function openMenu() {
    clearTimer();
    setOpen(true);
  }

  function updatePos() {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuWidth = 240;
    let left = r.left;
    if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 8);
    }
    setPos({ top: r.bottom - 1, left });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onWin() {
      updatePos();
    }
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        const menu = document.getElementById(menuId);
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      clearTimer();
    };
  }, [menuId]);

  if (!items.length) {
    return (
      <Link href={href} className={styles.trigger}>
        {label}
      </Link>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${open ? styles.open : ""}`}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        href={href}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onFocus={openMenu}
        onClick={(e) => {
          if (window.matchMedia("(max-width: 900px)").matches && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <span className={styles.triggerLabel}>{label}</span>
        <span className={styles.caret} aria-hidden>
          <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
            <path
              d="M1.25 1.5L5.5 5.5L9.75 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>

      {open ? (
        <ul
          id={menuId}
          className={styles.menu}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {items.map((item) => (
            <li key={`${item.href}-${item.label}`} role="none">
              <Link
                href={item.href}
                role="menuitem"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
