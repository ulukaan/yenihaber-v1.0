"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { AnimatedIcon } from "@yenihaber/ui";
import { useMemberSession } from "@/hooks/use-member-session";
import styles from "./account-menu.module.css";

export type AccountMenuProps = {
  iconOnly?: boolean;
  /** Header util ile aynı boyut — dışarıdan class geçilebilir */
  className?: string;
};

/**
 * Üst bardaki üyelik / hesap menüsü.
 */
export function AccountMenu({
  iconOnly = false,
  className,
}: AccountMenuProps) {
  const { user, ready, logout, isLoggedIn } = useMemberSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const triggerClass = [styles.trigger, className].filter(Boolean).join(" ");

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const icon = (
    <AnimatedIcon motion="pop">
      <UserRound size={18} strokeWidth={2} aria-hidden />
    </AnimatedIcon>
  );

  if (!ready) {
    return (
      <Link href="/giris" className={triggerClass} aria-label="Giriş yap">
        {icon}
        <span>{iconOnly ? "Giriş" : "Üyelik"}</span>
      </Link>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <Link href="/giris" className={triggerClass} aria-label="Giriş yap">
        {icon}
        <span>{iconOnly ? "Giriş" : "Üyelik"}</span>
      </Link>
    );
  }

  const first = user.name.trim().split(/\s+/)[0] || "Hesap";
  const short =
    first.length > 8 ? `${first.slice(0, 7)}…` : first;

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={triggerClass}
        aria-label="Hesap menüsü"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        <span>{short}</span>
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.who}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link
            href="/hesabim"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Hesap paneli
          </Link>
          <Link
            href="/hesabim/haber-gonder"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Haber gönder
          </Link>
          <Link
            href="/hesabim/haberler"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Kaydettiklerim
          </Link>
          <Link
            href="/hesabim/takip"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Takipler
          </Link>
          <Link
            href="/hesabim/ayarlar"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Ayarlar
          </Link>
          <button
            type="button"
            className={`${styles.item} ${styles.danger}`}
            role="menuitem"
            onClick={() => {
              logout();
              setOpen(false);
              router.push("/");
              router.refresh();
            }}
          >
            Çıkış
          </button>
        </div>
      ) : null}
    </div>
  );
}
