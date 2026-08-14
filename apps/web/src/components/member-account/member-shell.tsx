"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PANEL_ROLE_LABELS, type ApiUser } from "@yenihaber/shared";
import { useMemberSession } from "@/hooks/use-member-session";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import styles from "./member-shell.module.css";

const NAV = [
  { href: "/hesabim", label: "Özet", exact: true },
  { href: "/hesabim/haber-gonder", label: "Haber Gönder" },
  { href: "/hesabim/haberler", label: "Kaydettiklerim" },
  { href: "/hesabim/takip", label: "Takip" },
  { href: "/hesabim/ayarlar", label: "Ayarlar" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type MemberShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Üye paneli kabuğu — site dışı tam ekran, sol menü + içerik.
 */
export function MemberShell({ title, description, children }: MemberShellProps) {
  const { user, ready, isLoggedIn, logout } = useMemberSession();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace(`/giris?next=${encodeURIComponent(pathname || "/hesabim")}`);
    }
  }, [ready, isLoggedIn, router, pathname]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (!ready || !user) {
    return (
      <div className={styles.boot}>
        <p>Oturum kontrol ediliyor…</p>
      </div>
    );
  }

  const roleLabel = memberDisplayRole(user);

  return (
    <div className={styles.app}>
      <button
        type="button"
        className={styles.menuFab}
        aria-label={navOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((v) => !v)}
      >
        {navOpen ? "✕" : "☰"}
      </button>

      {navOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Menüyü kapat"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}
        aria-label="Üye paneli menüsü"
      >
        <div className={styles.brandBlock}>
          <BrandLogo variant="onDark" size="sm" className={styles.logo} />
          <p className={styles.brandTag}>Üye Paneli</p>
        </div>

        <div className={styles.userCard}>
          <strong>{user.name}</strong>
          <span>{roleLabel}</span>
          <em>{user.email}</em>
        </div>

        <nav className={styles.sideNav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(pathname, item.href, "exact" in item && item.exact)
                  ? styles.navActive
                  : undefined
              }
              aria-current={
                isActive(pathname, item.href, "exact" in item && item.exact)
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sideFoot}>
          <Link href="/" className={styles.siteLink}>
            ← Siteye dön
          </Link>
          <button
            type="button"
            className={styles.logout}
            onClick={() => {
              logout();
              router.push("/");
              router.refresh();
            }}
          >
            Çıkış
          </button>
        </div>
      </aside>

      <div className={styles.mainCol}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.kicker}>Hesap paneli</p>
            <h1>{title}</h1>
            {description ? <p className={styles.sub}>{description}</p> : null}
          </div>
        </header>
        <main className={styles.content} id="panel-icerik">
          {children}
        </main>
      </div>
    </div>
  );
}

export function memberDisplayRole(user: ApiUser): string {
  return PANEL_ROLE_LABELS[user.role] ?? user.role;
}
