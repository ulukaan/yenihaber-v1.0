"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  Moon,
  Search,
  Tv,
  UserRound,
} from "lucide-react";
import type { ApiMenuItem, MainNav, MainNavItem } from "@yenihaber/shared";
import { AnimatedIcon } from "@yenihaber/ui";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { ElectionStrip } from "@/components/election/election-strip";
import { CategoryStrip } from "@/components/category-strip/category-strip";
import { MobileTabBar } from "@/components/mobile-tab-bar/mobile-tab-bar";
import { MenuTrigger, SideMenu } from "@/components/side-menu/side-menu";
import { AccountMenu } from "@/components/member-account/account-menu";
import { HeaderSearch } from "./header-search";
import { NavDropdown } from "./nav-dropdown";
import styles from "./site-header.module.css";

export type SiteHeaderChromeProps = {
  /** Admin’den yönetilen üst menü */
  mainNav: MainNav;
  /** Side menu — tüm kategoriler (yedek liste) */
  categories: { name: string; slug: string }[];
  /** Admin → Menü → Yan menü */
  sideItems?: ApiMenuItem[];
  liveYouTubeUrl?: string;
  /** İkonlar menüsü — aktif refId listesi */
  iconIds?: string[];
  /** Üst bar motif — panel ayarı */
  headerMotif?: "seljuk" | "baklava" | "rumi" | "none";
  /** 0–100 */
  headerMotifOpacity?: number;
  /** Canlı seçim şeridi (Faz bayrağı) */
  showElectionStrip?: boolean;
};

type Crumb = {
  categoryName?: string;
  categorySlug?: string;
  title?: string;
};

function isArticleDetailPath(path: string): boolean {
  return /^\/haber\/[^/]+\/?$/.test(path);
}

function itemLabel(item: MainNavItem): string {
  return item.label.toLocaleUpperCase("tr-TR");
}

/**
 * Tam header + yalnızca haber detayında kaydırınca renkli bar.
 */
export function SiteHeaderChrome({
  mainNav,
  categories,
  sideItems = [],
  liveYouTubeUrl = "",
  iconIds = ["search", "theme"],
  headerMotif = "seljuk",
  headerMotifOpacity = 10,
  showElectionStrip = false,
}: SiteHeaderChromeProps) {
  const showSearch = iconIds.includes("search");
  const showTheme = iconIds.includes("theme");
  const showSocial = iconIds.includes("social");
  void showSocial;
  const pathname = usePathname() || "";
  const onArticlePage = isArticleDetailPath(pathname);
  const motifOn = headerMotif !== "none" && headerMotifOpacity > 0;
  const motifOpacity = Math.min(40, Math.max(0, headerMotifOpacity)) / 100;

  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [crumb, setCrumb] = useState<Crumb>({});
  const liveUrl = liveYouTubeUrl.trim();

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const stored = localStorage.getItem("yh-theme");
    const next = stored === "dark";
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("yh-theme", next ? "dark" : "light");
  }

  const refreshCrumb = useCallback(() => {
    if (!isArticleDetailPath(window.location.pathname)) {
      setCrumb({});
      return;
    }

    const articles = Array.from(
      document.querySelectorAll<HTMLElement>("[data-article-slug]"),
    );
    if (!articles.length) {
      setCrumb({});
      return;
    }
    let best: HTMLElement | null = null;
    let bestScore = -1;
    const mid = window.innerHeight * 0.28;
    for (const el of articles) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 60 || r.top > window.innerHeight) continue;
      const score =
        Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (score > bestScore) {
        bestScore = score;
        best = el;
      } else if (score === bestScore && r.top <= mid) {
        best = el;
      }
    }
    const el = best ?? articles[0]!;
    setCrumb({
      categoryName: el.getAttribute("data-category-name") || undefined,
      categorySlug: el.getAttribute("data-category-slug") || undefined,
      title: el.getAttribute("data-article-title") || undefined,
    });
  }, []);

  useEffect(() => {
    if (!onArticlePage) {
      setCompact(false);
      setCrumb({});
      return;
    }

    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      setCompact(y > 96);
      refreshCrumb();
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("popstate", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("popstate", onScroll);
    };
  }, [onArticlePage, refreshCrumb]);

  const showCompactBar = onArticlePage && compact;

  useEffect(() => {
    document.documentElement.classList.toggle(
      "yh-compact-header",
      showCompactBar,
    );
    document.documentElement.style.setProperty(
      "--yh-scroll-bar-h",
      showCompactBar ? "48px" : "0px",
    );
    return () => {
      document.documentElement.classList.remove("yh-compact-header");
      document.documentElement.style.removeProperty("--yh-scroll-bar-h");
    };
  }, [showCompactBar]);

  return (
    <>
      <HeaderSearch open={searchOpen} onClose={closeSearch} />

      <header
        className={`${styles.header} ${showCompactBar ? styles.headerHidden : ""}`}
      >
        <div className={styles.mast}>
          {motifOn ? (
            <span
              className={[
                styles.mastPattern,
                headerMotif === "baklava"
                  ? styles.motifBaklava
                  : headerMotif === "rumi"
                    ? styles.motifRumi
                    : styles.motifSeljuk,
              ].join(" ")}
              style={
                {
                  ["--header-motif-opacity" as string]: String(motifOpacity),
                } as CSSProperties
              }
              aria-hidden
            />
          ) : null}
          {showElectionStrip ? (
            <div className={`yh-container ${styles.electionWrap}`}>
              <ElectionStrip />
            </div>
          ) : null}
          <div className={`yh-container ${styles.top}`}>
            <BrandLogo
              variant="color"
              size="md"
              priority
              className={styles.logo}
            />
            <div className={styles.utils}>
              {showSearch ? (
                <button
                  type="button"
                  className={styles.util}
                  aria-label="Ara"
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen(true)}
                >
                  <AnimatedIcon motion="pop">
                    <Search size={18} strokeWidth={2} aria-hidden />
                  </AnimatedIcon>
                  <span>Ara</span>
                </button>
              ) : null}
              {liveUrl ? (
                <a
                  href={liveUrl}
                  className={styles.util}
                  aria-label="Canlı TV"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AnimatedIcon motion="pulse">
                    <Tv size={18} strokeWidth={2} aria-hidden />
                  </AnimatedIcon>
                  <span>Canlı TV</span>
                </a>
              ) : null}
              {showTheme ? (
                <button
                  type="button"
                  className={styles.util}
                  onClick={toggleTheme}
                  aria-label={dark ? "Açık tema" : "Koyu tema"}
                >
                  <AnimatedIcon motion="float">
                    <Moon size={18} strokeWidth={2} aria-hidden />
                  </AnimatedIcon>
                  <span>Tema</span>
                </button>
              ) : null}
              <AccountMenu iconOnly className={styles.util} />
              <MenuTrigger
                open={menuOpen}
                onToggle={() => setMenuOpen((v) => !v)}
                className={styles.menuMobile}
              />
            </div>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Ana menü">
          <div className={`yh-container ${styles.navInner}`}>
            <div className={styles.navLinks}>
              {mainNav.map((item) => {
                const children = item.children ?? [];
                if (children.length > 0) {
                  return (
                    <NavDropdown
                      key={item.id}
                      href={item.href}
                      label={itemLabel(item)}
                      items={children.map((c) => ({
                        href: c.href,
                        label: c.label,
                      }))}
                    />
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      item.accent ? styles.navBreaking : styles.navItem
                    }
                  >
                    {itemLabel(item)}
                  </Link>
                );
              })}
            </div>
            <MenuTrigger
              open={menuOpen}
              onToggle={() => setMenuOpen((v) => !v)}
              className={styles.menuDesktop}
            />
          </div>
        </nav>
        <CategoryStrip items={mainNav} />
      </header>

      <SideMenu
        categories={categories}
        mainNav={mainNav}
        sideItems={sideItems}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        showTrigger={false}
      />

      <MobileTabBar
        moreOpen={menuOpen}
        onMore={() => setMenuOpen((v) => !v)}
      />

      <div
        className={`${styles.scrollBar} ${showCompactBar ? styles.scrollBarShow : ""}`}
        role="navigation"
        aria-label="Hızlı konum"
        aria-hidden={!showCompactBar}
      >
        <div className={`yh-container ${styles.scrollBarInner}`}>
          <nav className={styles.crumb} aria-label="Konum">
            <Link href="/" className={styles.crumbHome}>
              Anasayfa
            </Link>
            {crumb.categoryName ? (
              <>
                <span className={styles.crumbSep} aria-hidden>
                  /
                </span>
                <Link
                  href={
                    crumb.categorySlug
                      ? `/kategori/${crumb.categorySlug}`
                      : "/"
                  }
                  className={styles.crumbCat}
                >
                  {crumb.categoryName.toLocaleUpperCase("tr-TR")}
                </Link>
              </>
            ) : null}
            {crumb.title ? (
              <>
                <span className={styles.crumbSep} aria-hidden>
                  /
                </span>
                <span className={styles.crumbTitle} title={crumb.title}>
                  {crumb.title}
                </span>
              </>
            ) : null}
          </nav>

          <div className={styles.scrollActions}>
            <MenuTrigger
              open={menuOpen}
              onToggle={() => setMenuOpen((v) => !v)}
              tone="onAccent"
              label={false}
            />
            <button
              type="button"
              className={styles.scrollIcon}
              aria-label="Ara"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={18} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.scrollIcon}
              onClick={toggleTheme}
              aria-label={dark ? "Açık tema" : "Koyu tema"}
            >
              <Moon size={18} strokeWidth={2} aria-hidden />
            </button>
            <Link
              href="/hesabim"
              className={styles.scrollIcon}
              aria-label="Hesap paneli"
            >
              <UserRound size={18} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
