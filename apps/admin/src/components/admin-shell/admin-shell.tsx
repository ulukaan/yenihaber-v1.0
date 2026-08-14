"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  Suspense,
  type ComponentType,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  type SVGProps,
} from "react";
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Contact,
  ExternalLink,
  FolderTree,
  Fuel,
  GalleryHorizontal,
  HeartHandshake,
  IdCard,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutList,
  LayoutGrid,
  LineChart,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Bell,
  MessageSquareText,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Tags,
  Trophy,
  Users,
  Video,
  Vote,
  X,
  Zap,
  Briefcase,
} from "lucide-react";
import type { Role } from "@yenihaber/shared";
import { useAuth } from "@/components/auth-provider/auth-provider";
import { adminApi } from "@/lib/api";
import styles from "./admin-shell.module.css";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

type NavLeaf = {
  href: string;
  label: string;
  icon?: IconComp;
  roles?: Role[];
  badgeKey?: "comments" | "messages";
  soon?: boolean;
};

type NavBranch = {
  id: string;
  label: string;
  icon: IconComp;
  roles?: Role[];
  children: NavItem[];
};

type NavItem = NavLeaf | NavBranch;

type NavGroup = {
  id: string;
  label: string | null;
  items: NavItem[];
};

function isBranch(item: NavItem): item is NavBranch {
  return "children" in item && Array.isArray(item.children);
}

/** Mantıksal menü: içerik · kurum · etkileşim · servis · sistem */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "content",
    label: "İçerik",
    items: [
      { href: "/articles", label: "Haberler", icon: Newspaper },
      { href: "/manset", label: "Manşet & Son Dakika", icon: Zap },
      {
        href: "/reactions",
        label: "Tepki nabzı",
        icon: Activity,
        roles: ["ADMIN", "EDITOR"],
      },
      {
        id: "kategoriler",
        label: "Kategoriler",
        icon: FolderTree,
        children: [
          { href: "/categories/home", label: "Ana sayfa şeritleri" },
          { href: "/categories/bolge", label: "Bölge" },
          { href: "/categories/haber", label: "Haber" },
          { href: "/categories/parti", label: "Parti" },
          { href: "/categories/kurum", label: "Kurum" },
        ],
      },
      { href: "/tags", label: "Etiketler", icon: Tags },
      {
        id: "medya-varliklari",
        label: "Medya",
        icon: ImageIcon,
        children: [
          { href: "/videos", label: "Video", icon: Video },
          { href: "/galleries", label: "Foto Galeri", icon: GalleryHorizontal },
          { href: "/stories", label: "Hikayeler", icon: Sparkles },
          { href: "/media", label: "Medya Kütüphanesi", icon: ImageIcon },
        ],
      },
    ],
  },
  {
    id: "people",
    label: "Kişiler",
    items: [
      {
        id: "kisiler",
        label: "Kişiler",
        icon: Users,
        roles: ["ADMIN", "EDITOR"],
        children: [
          {
            href: "/users?tab=authors",
            label: "Yazarlar",
            roles: ["ADMIN", "EDITOR"],
          },
          {
            href: "/users?tab=users",
            label: "Kullanıcılar",
            roles: ["ADMIN", "EDITOR"],
          },
          {
            href: "/users?tab=invites",
            label: "Davetler",
            roles: ["ADMIN"],
          },
        ],
      },
    ],
  },
  {
    id: "engage",
    label: "Etkileşim",
    items: [
      {
        href: "/messages",
        label: "Mesajlar",
        icon: Mail,
        badgeKey: "messages",
        roles: ["ADMIN", "EDITOR", "MODERATOR"],
      },
      {
        href: "/comments",
        label: "Yorumlar",
        icon: MessageSquareText,
        badgeKey: "comments",
      },
      { href: "/polls", label: "Anketler", icon: Vote },
      {
        href: "/elections",
        label: "Seçim",
        icon: Trophy,
        roles: ["ADMIN", "EDITOR"],
      },
      {
        id: "reklam-kampanyalari",
        label: "Reklamlar",
        icon: Megaphone,
        roles: ["ADMIN"],
        children: [
          { href: "/ads", label: "Aktif kampanyalar", roles: ["ADMIN"] },
          { href: "/ads/arsiv", label: "Arşiv", roles: ["ADMIN"] },
        ],
      },
      {
        href: "/ilanlar",
        label: "Ücretli ilanlar",
        icon: ScrollText,
        roles: ["ADMIN", "EDITOR"],
      },
    ],
  },
  {
    id: "corporate",
    label: "Kurumsal",
    items: [
      {
        id: "kurumsal-ayarlar",
        label: "Kurumsal Ayarlar",
        icon: Briefcase,
        roles: ["ADMIN"],
        children: [
          {
            href: "/kurumsal/ticari",
            label: "Ticari Bilgiler",
            icon: Building2,
            roles: ["ADMIN"],
          },
          {
            href: "/kurumsal/iletisim",
            label: "İletişim",
            icon: Contact,
            roles: ["ADMIN"],
          },
          {
            href: "/kurumsal/kunye",
            label: "Künye",
            icon: IdCard,
            roles: ["ADMIN"],
          },
          {
            href: "/reports/bik",
            label: "BİK raporu",
            icon: LineChart,
            roles: ["ADMIN", "EDITOR"],
          },
        ],
      },
    ],
  },
  {
    id: "services",
    label: "Servisler",
    items: [
      {
        id: "servisler",
        label: "Site Servisleri",
        icon: HeartHandshake,
        children: [
          { href: "/services#skor", label: "Canlı Skor", icon: Trophy },
          { href: "/services#namaz", label: "Namaz Vakitleri", icon: Moon },
          { href: "/services#hava", label: "Hava Durumu", icon: CloudSun },
          { href: "/services#piyasa", label: "Piyasalar", icon: LineChart },
          { href: "/services#akaryakit", label: "Akaryakıt", icon: Fuel },
          { href: "/services", label: "Tüm servisler" },
        ],
      },
    ],
  },
  {
    id: "system",
    label: "Sistem",
    items: [
      {
        href: "/menu",
        label: "Menü",
        icon: LayoutList,
        roles: ["ADMIN", "EDITOR"],
      },
      {
        href: "/settings",
        label: "Genel Ayarlar",
        icon: Settings,
        roles: ["ADMIN"],
      },
      {
        href: "/modules",
        label: "Modül Yönetimi",
        icon: LayoutGrid,
        roles: ["ADMIN"],
      },
      { href: "/logs", label: "Loglar", icon: ScrollText, roles: ["ADMIN"] },
    ],
  },
];

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
const LS_COLLAPSED = "yh_admin_sidebar_collapsed";

function pathActive(
  pathname: string,
  href: string,
  search = "",
): boolean {
  const withoutHash = href.split("#")[0]!;
  const [base, qs] = withoutHash.split("?");
  if (!base) return false;

  if (base === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  // /users?tab=authors | users | invites — menü satırını sekme ile eşle
  if (base === "/users") {
    if (pathname !== "/users" && !pathname.startsWith("/users/")) return false;
    const want = new URLSearchParams(qs || "").get("tab") || "users";
    const have = new URLSearchParams(search.replace(/^\?/, "")).get("tab") || "users";
    return want === have;
  }

  if (base === "/services") {
    return pathname === "/services" || pathname.startsWith("/services/");
  }
  if (base.startsWith("/kurumsal")) {
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  if (base === "/ads") {
    return pathname === "/ads";
  }
  if (base === "/ads/arsiv") {
    return pathname === "/ads/arsiv" || pathname.startsWith("/ads/arsiv/");
  }
  if (base.startsWith("/categories/")) {
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  if (base === "/categories") {
    return pathname === "/categories" || pathname.startsWith("/categories/");
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

function branchActive(
  pathname: string,
  branch: NavBranch,
  search = "",
): boolean {
  return branch.children.some((child) =>
    isBranch(child)
      ? branchActive(pathname, child, search)
      : pathActive(pathname, child.href, search),
  );
}

function roleLabel(role: Role): string {
  if (role === "ADMIN") return "Yönetici";
  if (role === "EDITOR") return "Editör";
  if (role === "MUHABIR") return "Muhabir";
  if (role === "MODERATOR") return "Moderatör";
  if (role === "YAZAR") return "Yazar";
  return "Üye";
}

function pageTitleFromPath(pathname: string, search = ""): string {
  if (pathname.startsWith("/articles")) return "Haberler";
  if (pathname.startsWith("/manset")) return "Manşet";
  if (pathname.startsWith("/categories")) return "Kategoriler";
  if (pathname.startsWith("/tags")) return "Etiketler";
  if (pathname.startsWith("/videos")) return "Video";
  if (pathname.startsWith("/galleries")) return "Galeri";
  if (pathname.startsWith("/media")) return "Medya";
  if (pathname.startsWith("/users")) {
    const t = new URLSearchParams(search).get("tab");
    if (t === "authors") return "Yazarlar";
    if (t === "invites") return "Davetler";
    return "Kullanıcılar";
  }
  if (pathname.startsWith("/comments")) return "Yorumlar";
  if (pathname.startsWith("/messages")) return "Mesajlar";
  if (pathname.startsWith("/polls")) return "Anketler";
  if (pathname.startsWith("/elections")) return "Seçim";
  if (pathname.startsWith("/modules")) return "Modül Yönetimi";
  if (pathname.startsWith("/ads")) return "Reklamlar";
  if (pathname.startsWith("/ilanlar")) return "Ücretli ilanlar";
  if (pathname.startsWith("/kurumsal")) return "Kurumsal";
  if (pathname.startsWith("/services")) return "Servisler";
  if (pathname.startsWith("/settings")) return "Ayarlar";
  if (pathname.startsWith("/logs")) return "Loglar";
  if (pathname.startsWith("/menu")) return "Menü";
  if (pathname.startsWith("/dashboard") || pathname === "/") return "Dashboard";
  return "Yönetim";
}

function NavIcon({ icon: Icon }: { icon: IconComp }) {
  return (
    <span className={styles.navIconWrap} aria-hidden>
      <Icon width={18} height={18} strokeWidth={1.75} className={styles.navIcon} />
    </span>
  );
}

function filterItem(item: NavItem, role: Role | undefined): NavItem | null {
  if (item.roles && role && !item.roles.includes(role)) return null;
  if (!isBranch(item)) return item;
  const children = item.children
    .map((c) => filterItem(c, role))
    .filter((x): x is NavItem => Boolean(x));
  if (!children.length) return null;
  return { ...item, children };
}

function collectActiveBranchIds(
  items: NavItem[],
  pathname: string,
  search: string,
  acc: string[] = [],
): string[] {
  for (const item of items) {
    if (!isBranch(item)) continue;
    if (branchActive(pathname, item, search)) {
      acc.push(item.id);
      collectActiveBranchIds(item.children, pathname, search, acc);
    }
  }
  return acc;
}

function NavNode({
  item,
  pathname,
  search,
  depth,
  openBranches,
  setOpenBranches,
  collapsed,
  commentBadge,
  messageBadge,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  search: string;
  depth: number;
  openBranches: Record<string, boolean>;
  setOpenBranches: Dispatch<SetStateAction<Record<string, boolean>>>;
  collapsed: boolean;
  commentBadge: number;
  messageBadge: number;
  onNavigate?: () => void;
}) {
  if (isBranch(item)) {
    const open = !collapsed && (openBranches[item.id] ?? branchActive(pathname, item, search));
    const parentOn = branchActive(pathname, item, search);
    return (
      <div className={styles.navBranch}>
        <button
          type="button"
          className={`${styles.navLink} ${styles.navParent}${
            parentOn ? ` ${styles.navLinkActive}` : ""
          }`}
          aria-expanded={open}
          title={collapsed ? item.label : undefined}
          onClick={() => {
            if (collapsed) {
              setOpenBranches((prev) => ({ ...prev, [item.id]: true }));
              return;
            }
            setOpenBranches((prev) => ({
              ...prev,
              [item.id]: !open,
            }));
          }}
        >
          <NavIcon icon={item.icon} />
          {!collapsed ? (
            <>
              <span className={styles.navLabel}>{item.label}</span>
              <ChevronDown
                size={15}
                className={`${styles.navChevron}${open ? ` ${styles.navChevronOpen}` : ""}`}
                aria-hidden
              />
            </>
          ) : null}
        </button>
        {open ? (
          <div className={styles.navChildren}>
            {item.children.map((child) => (
              <NavNode
                key={isBranch(child) ? child.id : child.href}
                item={child}
                pathname={pathname}
                search={search}
                depth={depth + 1}
                openBranches={openBranches}
                setOpenBranches={setOpenBranches}
                collapsed={false}
                commentBadge={commentBadge}
                messageBadge={messageBadge}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const active = pathActive(pathname, item.href, search);
  const badge =
    item.badgeKey === "comments" && commentBadge > 0
      ? commentBadge
      : item.badgeKey === "messages" && messageBadge > 0
        ? messageBadge
        : 0;

  if (depth > 0) {
    return (
      <Link
        href={item.soon ? "#" : item.href}
        className={`${styles.navChild}${active ? ` ${styles.navChildActive}` : ""}`}
        aria-current={active ? "page" : undefined}
        title={item.label}
        onClick={(e) => {
          if (item.soon) e.preventDefault();
          else onNavigate?.();
        }}
      >
        <span className={styles.navDot} aria-hidden />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.soon ? "#" : item.href}
      className={`${styles.navLink}${active ? ` ${styles.navLinkActive}` : ""}${
        item.soon ? ` ${styles.navLinkSoon}` : ""
      }`}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : item.soon ? "Yakında" : undefined}
      onClick={(e) => {
        if (item.soon) e.preventDefault();
        else onNavigate?.();
      }}
    >
      {item.icon ? (
        <NavIcon icon={item.icon} />
      ) : (
        <span className={styles.navIconWrap} aria-hidden />
      )}
      {!collapsed ? (
        <>
          <span className={styles.navLabel}>{item.label}</span>
          {item.soon ? <span className={styles.soonBadge}>Yakında</span> : null}
          {badge > 0 ? (
            <span className={styles.navBadge} aria-label={`${badge} bekleyen`}>
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </>
      ) : badge > 0 ? (
        <span className={styles.navBadgeDot} aria-label={`${badge} bekleyen`} />
      ) : null}
    </Link>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className={styles.root}>
          <div className={styles.mainCol}>
            <main className={styles.main}>{children}</main>
          </div>
        </div>
      }
    >
      <AdminShellInner>{children}</AdminShellInner>
    </Suspense>
  );
}

function AdminShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [commentBadge, setCommentBadge] = useState(0);
  const [messageBadge, setMessageBadge] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [clock, setClock] = useState("");
  const [userMenu, setUserMenu] = useState(false);
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({
    "kurumsal-ayarlar": false,
    kategoriler: false,
    "reklam-kampanyalari": false,
    servisler: false,
    "medya-varliklari": false,
    kisiler: false,
  });

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(LS_COLLAPSED);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
    setBellOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!bellOpen && !userMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-bell-menu]") || t.closest("[data-user-menu]")) return;
      setBellOpen(false);
      setUserMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        setUserMenu(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [bellOpen, userMenu]);

  useEffect(() => {
    const ids = NAV_GROUPS.flatMap((g) =>
      collectActiveBranchIds(g.items, pathname, search),
    );
    if (!ids.length) return;
    setOpenBranches((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of ids) {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, search]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user) {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("yh_admin_token")
          : null;
      if (!token) router.replace("/login");
    }
  }, [mounted, loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadBadges() {
      try {
        const n = await adminApi.dashboard.notifications();
        if (cancelled) return;
        setCommentBadge(n.commentsPending ?? 0);
        setMessageBadge(n.messagesNew ?? 0);
      } catch {
        if (cancelled) return;
        setCommentBadge(0);
        setMessageBadge(0);
      }
    }
    void loadBadges();
    const id = window.setInterval(loadBadges, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user, pathname]);

  useEffect(() => {
    function tick() {
      setClock(
        new Intl.DateTimeFormat("tr-TR", {
          timeZone: "Europe/Istanbul",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
          day: "numeric",
          month: "short",
        }).format(new Date()),
      );
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(LS_COLLAPSED, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function handleLogout() {
    logout();
    router.replace("/login");
    router.refresh();
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    if (!q) {
      router.push("/articles");
      return;
    }
    router.push(`/articles?q=${encodeURIComponent(q)}`);
  }

  const initials = user
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items
          .map((item) => filterItem(item, user?.role))
          .filter((x): x is NavItem => Boolean(x)),
      })).filter((g) => g.items.length > 0),
    [user?.role],
  );

  const title = pageTitleFromPath(pathname, search);
  const sidebarCollapsed = collapsed && !mobileOpen;

  return (
    <div
      className={`${styles.root}${sidebarCollapsed ? ` ${styles.rootCollapsed}` : ""}`}
      suppressHydrationWarning
    >
      {mobileOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar}${mobileOpen ? ` ${styles.sidebarOpen}` : ""}${
          sidebarCollapsed ? ` ${styles.sidebarCollapsed}` : ""
        }`}
        aria-label="Yönetim menüsü"
      >
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            DR
          </span>
          {!sidebarCollapsed ? (
            <div className={styles.brandText}>
              <strong>Yönetim</strong>
              <span>Düzce Radikal</span>
            </div>
          ) : null}
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            title={collapsed ? "Genişlet" : "Daralt"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className={styles.nav} aria-label="Ana menü">
          {groups.map((group) => (
            <div key={group.id} className={styles.navGroup}>
              {group.label && !sidebarCollapsed ? (
                <p className={styles.navGroupLabel}>{group.label}</p>
              ) : null}
              {group.items.map((item) => (
                <NavNode
                  key={
                    isBranch(item)
                      ? item.id
                      : `${group.id}-${item.href}-${item.label}`
                  }
                  item={item}
                  pathname={pathname}
                  search={search}
                  depth={0}
                  openBranches={openBranches}
                  setOpenBranches={setOpenBranches}
                  collapsed={sidebarCollapsed}
                  commentBadge={commentBadge}
                  messageBadge={messageBadge}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {!sidebarCollapsed ? (
            <a
              className={styles.siteLink}
              href={WEB_URL}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} aria-hidden />
              Siteyi aç
            </a>
          ) : (
            <a
              className={styles.siteLinkIcon}
              href={WEB_URL}
              target="_blank"
              rel="noreferrer"
              title="Siteyi aç"
              aria-label="Siteyi aç"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </aside>

      <div className={styles.mainCol}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <button
              type="button"
              className={styles.desktopCollapse}
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className={styles.crumb}>
              <span className={styles.crumbMute}>Panel</span>
              <span className={styles.crumbSep} aria-hidden>
                /
              </span>
              <strong>{title}</strong>
            </div>
          </div>

          <form className={styles.search} onSubmit={onSearch} role="search">
            <Search size={16} aria-hidden className={styles.searchIcon} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Haber ara…"
              aria-label="Haber ara"
            />
            <kbd className={styles.searchHint}>Enter</kbd>
          </form>

          <div className={styles.topbarEnd}>
            {clock ? (
              <time className={styles.clock} dateTime={new Date().toISOString()}>
                {clock}
              </time>
            ) : null}

            <a
              className={styles.iconBtn}
              href={WEB_URL}
              target="_blank"
              rel="noreferrer"
              title="Siteyi yeni sekmede aç"
              aria-label="Siteyi aç"
            >
              <ExternalLink size={16} />
            </a>

            <div className={styles.bellWrap} data-bell-menu>
              <button
                type="button"
                className={styles.iconBtn}
                title="Gelen kutusu"
                aria-label={
                  commentBadge + messageBadge > 0
                    ? `Gelen kutusu, ${commentBadge + messageBadge} bildirim`
                    : "Gelen kutusu"
                }
                aria-expanded={bellOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setBellOpen((v) => !v);
                  setUserMenu(false);
                }}
              >
                <Bell size={16} />
                {commentBadge + messageBadge > 0 ? (
                  <span className={styles.topBadge}>
                    {commentBadge + messageBadge > 99
                      ? "99+"
                      : commentBadge + messageBadge}
                  </span>
                ) : null}
              </button>
              {bellOpen ? (
                <div className={styles.bellDropdown} role="menu">
                  <div className={styles.bellHead}>
                    <strong>Gelen kutusu</strong>
                    <span>
                      {commentBadge + messageBadge > 0
                        ? `${commentBadge + messageBadge} bekleyen`
                        : "Yeni bildirim yok"}
                    </span>
                  </div>
                  <Link
                    href="/messages"
                    role="menuitem"
                    className={styles.bellItem}
                    onClick={() => setBellOpen(false)}
                  >
                    <span className={styles.bellItemIcon} aria-hidden>
                      <Mail size={16} />
                    </span>
                    <span className={styles.bellItemText}>
                      <strong>Mesajlar</strong>
                      <em>İletişim formu</em>
                    </span>
                    {messageBadge > 0 ? (
                      <span className={styles.bellCount}>
                        {messageBadge > 99 ? "99+" : messageBadge}
                      </span>
                    ) : (
                      <span className={styles.bellCountMuted}>0</span>
                    )}
                  </Link>
                  <Link
                    href="/comments"
                    role="menuitem"
                    className={styles.bellItem}
                    onClick={() => setBellOpen(false)}
                  >
                    <span className={styles.bellItemIcon} aria-hidden>
                      <MessageSquareText size={16} />
                    </span>
                    <span className={styles.bellItemText}>
                      <strong>Yorumlar</strong>
                      <em>Onay bekleyen</em>
                    </span>
                    {commentBadge > 0 ? (
                      <span className={styles.bellCount}>
                        {commentBadge > 99 ? "99+" : commentBadge}
                      </span>
                    ) : (
                      <span className={styles.bellCountMuted}>0</span>
                    )}
                  </Link>
                </div>
              ) : null}
            </div>

            <Link href="/articles/new" className={styles.cta} title="Yeni haber">
              <Plus size={16} aria-hidden />
              <span>Yeni haber</span>
            </Link>

            <div className={styles.userMenuWrap} data-user-menu>
              <button
                type="button"
                className={styles.userBtn}
                aria-expanded={userMenu}
                aria-haspopup="menu"
                onClick={() => {
                  setUserMenu((v) => !v);
                  setBellOpen(false);
                }}
              >
                <span className={styles.userAvatar} aria-hidden>
                  {initials}
                </span>
                <span className={styles.userBtnMeta}>
                  <strong>{user?.name ?? "…"}</strong>
                  {user ? (
                    <em
                      className={`${styles.roleBadge} ${styles[`role_${user.role}`] ?? ""}`}
                    >
                      {roleLabel(user.role)}
                    </em>
                  ) : null}
                </span>
              </button>
              {userMenu ? (
                <div className={styles.userDropdown} role="menu">
                  <div className={styles.userDropdownHead}>
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <Link
                    href="/settings"
                    role="menuitem"
                    className={styles.userDropdownItem}
                    onClick={() => setUserMenu(false)}
                  >
                    <Settings size={14} aria-hidden />
                    Ayarlar
                  </Link>
                  <a
                    href={WEB_URL}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                    className={styles.userDropdownItem}
                  >
                    <ExternalLink size={14} aria-hidden />
                    Siteye git
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.userDropdownItem} ${styles.userDropdownDanger}`}
                    onClick={handleLogout}
                  >
                    <LogOut size={14} aria-hidden />
                    Çıkış yap
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
