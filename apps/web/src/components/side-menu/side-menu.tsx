"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { LogIn, Megaphone, UserRound, X } from "lucide-react";
import type { ApiMenuItem, MainNav } from "@yenihaber/shared";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { useMemberSession } from "@/hooks/use-member-session";
import styles from "./side-menu.module.css";

export type SideMenuCategory = {
  name: string;
  slug: string;
};

export type SideMenuProps = {
  categories: SideMenuCategory[];
  mainNav?: MainNav;
  sideItems?: ApiMenuItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerClassName?: string;
  tone?: "default" | "onAccent";
};

export type MenuTriggerProps = {
  open: boolean;
  onToggle: () => void;
  panelId?: string;
  tone?: "default" | "onAccent";
  className?: string;
  label?: boolean;
};

export function MenuTrigger({
  open,
  onToggle,
  panelId,
  tone = "default",
  className,
  label = false,
}: MenuTriggerProps) {
  return (
    <button
      type="button"
      className={[
        styles.menuBtn,
        tone === "onAccent" ? styles.menuBtnOnAccent : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <span className={open ? styles.burgerOpen : styles.burger} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      {label ? <span className={styles.menuLabel}>Menü</span> : null}
    </button>
  );
}

function SideMenuFromItems({
  items,
  onNavigate,
}: {
  items: ApiMenuItem[];
  onNavigate: () => void;
}) {
  return (
    <nav className={styles.nav} aria-label="Yan menü">
      {items.map((item) => {
        if (item.type === "heading") {
          return (
            <p key={item.id} className={styles.sectionLabel}>
              {item.resolvedLabel}
            </p>
          );
        }

        if (!item.href) return null;

        return (
          <div key={item.id} className={styles.group}>
            <Link
              href={item.href}
              className={styles.link}
              onClick={onNavigate}
            >
              <span>{item.resolvedLabel}</span>
              {item.badgeText ? (
                <span className={styles.badge}>{item.badgeText}</span>
              ) : null}
            </Link>
            {item.children?.length ? (
              <div className={styles.sub}>
                {item.children.map((ch) =>
                  ch.href ? (
                    <Link
                      key={ch.id}
                      href={ch.href}
                      className={styles.subLink}
                      onClick={onNavigate}
                    >
                      {ch.resolvedLabel}
                    </Link>
                  ) : null,
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function MenuActions({ onNavigate }: { onNavigate: () => void }) {
  const { user, ready, isLoggedIn } = useMemberSession();
  const logged = ready && isLoggedIn && user;

  return (
    <div className={styles.actions}>
      {logged ? (
        <Link
          href="/hesabim"
          className={styles.actionPrimary}
          onClick={onNavigate}
        >
          <UserRound size={18} strokeWidth={2} aria-hidden />
          Hesabım
        </Link>
      ) : (
        <Link
          href="/giris"
          className={styles.actionPrimary}
          onClick={onNavigate}
        >
          <LogIn size={18} strokeWidth={2} aria-hidden />
          Giriş yap
        </Link>
      )}
      <Link
        href="/ihbar"
        className={styles.actionSecondary}
        onClick={onNavigate}
      >
        <Megaphone size={18} strokeWidth={2} aria-hidden />
        İhbar
      </Link>
    </div>
  );
}

/** Sağ hamburger panel — sade mobil menü */
export function SideMenu({
  categories,
  mainNav = [],
  sideItems = [],
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerClassName,
  tone = "default",
}: SideMenuProps) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? Boolean(openProp) : uncontrolled;
  const titleId = useId();
  const panelId = useId();

  const setOpen = useCallback(
    (next: boolean | ((v: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(open) : next;
      if (!controlled) setUncontrolled(value);
      onOpenChange?.(value);
    },
    [controlled, onOpenChange, open],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  function close() {
    setOpen(false);
  }

  const managed = sideItems.filter((i) => i.isActive !== false);
  const useManaged = managed.length > 0;

  const usedHrefs = new Set(
    mainNav.flatMap((n) => [
      n.href,
      ...(n.children ?? []).map((c) => c.href),
    ]),
  );
  const extraCats = categories.filter(
    (c) => !usedHrefs.has(`/kategori/${c.slug}`),
  );

  return (
    <>
      {showTrigger ? (
        <MenuTrigger
          open={open}
          onToggle={() => setOpen((v) => !v)}
          panelId={panelId}
          tone={tone}
          className={triggerClassName}
        />
      ) : null}

      <button
        type="button"
        className={open ? styles.overlayOpen : styles.overlay}
        onClick={close}
        tabIndex={-1}
        aria-label="Menüyü kapat"
        aria-hidden={!open}
      />

      <aside
        id={panelId}
        className={open ? styles.panelOpen : styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <div className={styles.head}>
          <BrandLogo
            variant="color"
            size="sm"
            className={styles.logo}
            onClick={close}
          />
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label="Kapat"
          >
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={styles.body}>
          <h2 id={titleId} className={styles.srOnly}>
            Menü
          </h2>

          <MenuActions onNavigate={close} />

          <div className={styles.divider} aria-hidden />

          {useManaged ? (
            <SideMenuFromItems items={managed} onNavigate={close} />
          ) : (
            <>
              <nav className={styles.nav} aria-label="Ana menü">
                <Link href="/" className={styles.link} onClick={close}>
                  <span>Ana Sayfa</span>
                </Link>
                {mainNav.map((item) => (
                  <div key={item.id} className={styles.group}>
                    <Link
                      href={item.href}
                      className={styles.link}
                      onClick={close}
                    >
                      <span>{item.label}</span>
                    </Link>
                    {(item.children?.length ?? 0) > 0 ? (
                      <div className={styles.sub}>
                        {item.children!.map((ch) => (
                          <Link
                            key={ch.id}
                            href={ch.href}
                            className={styles.subLink}
                            onClick={close}
                          >
                            {ch.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </nav>

              {extraCats.length > 0 ? (
                <>
                  <p className={styles.sectionLabel}>Kategoriler</p>
                  <nav className={styles.nav} aria-label="Kategoriler">
                    {extraCats.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/kategori/${cat.slug}`}
                        className={styles.link}
                        onClick={close}
                      >
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </nav>
                </>
              ) : null}
            </>
          )}
        </div>

        <div className={styles.foot}>
          <Link href="/servis" className={styles.footLink} onClick={close}>
            Servisler
          </Link>
          <Link href="/ara" className={styles.footLink} onClick={close}>
            Ara
          </Link>
          <Link href="/iletisim" className={styles.footLink} onClick={close}>
            İletişim
          </Link>
          <Link href="/kayit" className={styles.footLink} onClick={close}>
            Kayıt ol
          </Link>
        </div>
      </aside>
    </>
  );
}
