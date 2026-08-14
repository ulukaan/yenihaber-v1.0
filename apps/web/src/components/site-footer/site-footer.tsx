import Link from "next/link";
import {
  CloudSun,
  Cross,
  Film,
  Flower2,
  Mail,
  Moon,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ApiMenuItem } from "@yenihaber/shared";
import { getCachedMenu } from "@/lib/menus";
import { getSiteSettings } from "@/lib/site-settings";
import { resolveCorporate } from "@/lib/corporate";
import { BultenFlash } from "./bulten-flash";
import { FooterBrand } from "./footer-brand";
import { SocialGlyph } from "./social-glyph";
import styles from "./site-footer.module.css";

type FooterCol = { title: string; links: { href: string; label: string }[] };
type SocialLink = { href: string; label: string; id: string };
type ServiceItem = {
  href: string;
  label: string;
  hint: string;
  icon: string;
};

const LEGAL_PATHS = new Set([
  "/kvkk",
  "/kunye",
  "/iletisim",
  "/reklam",
  "/gizlilik",
  "/cerez",
  "/cerez-politikasi",
  "/kullanim-kosullari",
  "/hakkimizda",
]);

const legalFallback = [
  { href: "/kvkk", label: "KVKK" },
  { href: "/kunye", label: "Künye" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/reklam", label: "Reklam" },
  { href: "/ilanlar", label: "Ücretli ilan" },
  { href: "/gizlilik", label: "Gizlilik" },
];

const SERVICE_ICONS: Record<string, LucideIcon> = {
  moon: Moon,
  cross: Cross,
  flower: Flower2,
  cloud: CloudSun,
  trend: TrendingUp,
  film: Film,
};

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    href: "/servis/namaz",
    label: "Namaz vakitleri",
    hint: "Düzce",
    icon: "moon",
  },
  {
    href: "/servis/nobetci-eczane",
    label: "Nöbetçi eczane",
    hint: "İl / ilçe",
    icon: "cross",
  },
  {
    href: "/servis/vefat",
    label: "Vefat ilanları",
    hint: "MEBİS",
    icon: "flower",
  },
  {
    href: "/servis/hava",
    label: "Hava durumu",
    hint: "Günlük özet",
    icon: "cloud",
  },
  {
    href: "/servis/doviz",
    label: "Döviz & piyasa",
    hint: "Kur özeti",
    icon: "trend",
  },
];

function parseServices(raw: string | undefined): ServiceItem[] {
  if (!raw?.trim()) return DEFAULT_SERVICES;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_SERVICES;
    const out: ServiceItem[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const href = String(r.href ?? "").trim();
      const label = String(r.label ?? "").trim();
      if (!href || !label) continue;
      out.push({
        href,
        label,
        hint: String(r.hint ?? "").trim(),
        icon: String(r.icon ?? "moon").trim() || "moon",
      });
    }
    return out.length ? out : DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

function footerColumnsFromMenu(items: ApiMenuItem[]): FooterCol[] {
  const cols: FooterCol[] = [];
  let current: FooterCol | null = null;
  for (const item of items) {
    if (item.type === "heading") {
      current = { title: item.resolvedLabel, links: [] };
      cols.push(current);
      continue;
    }
    if (!item.href) continue;
    if (!current) {
      current = { title: "Bağlantılar", links: [] };
      cols.push(current);
    }
    current.links.push({ href: item.href, label: item.resolvedLabel });
  }
  return cols.filter((c) => c.links.length > 0);
}

/** Kurumsal sütun veya bilinen yasal path’ler */
function pickLegalLinks(columns: FooterCol[]) {
  const kurumsal = columns.find((c) =>
    /kurumsal|yasal|bilgi/i.test(c.title),
  );
  if (kurumsal?.links.length) return kurumsal.links;

  const matched = columns
    .flatMap((c) => c.links)
    .filter((l) => {
      const path = l.href.split("?")[0]?.replace(/\/$/, "") || l.href;
      return LEGAL_PATHS.has(path);
    });
  return matched.length ? matched : legalFallback;
}

function digitsPhone(raw: string | undefined | null): string {
  return (raw ?? "").replace(/\D/g, "");
}

function normalizeTrPhone(digits: string): {
  e164: string;
  wa: string;
  display: string;
} {
  let d = digits;
  if (!d) d = "905551112233";
  if (d.startsWith("0")) d = `90${d.slice(1)}`;
  if (!d.startsWith("90")) d = `90${d}`;
  const e164 = `+${d}`;
  const local = d.replace(/^90/, "0");
  const display = local.replace(/(\d{4})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
  return { e164, wa: d, display };
}

function socialFromSettings(s: Record<string, string>): SocialLink[] {
  const rows: Array<{ id: string; key: string; label: string }> = [
    { id: "facebook", key: "social.facebook", label: "Facebook" },
    { id: "x", key: "social.x", label: "X" },
    { id: "instagram", key: "social.instagram", label: "Instagram" },
    { id: "youtube", key: "social.youtube", label: "YouTube" },
    { id: "whatsapp", key: "social.whatsapp", label: "WhatsApp" },
  ];
  return rows
    .map((r) => {
      const href = (s[r.key] ?? "").trim();
      return href ? { id: r.id, href, label: r.label } : null;
    })
    .filter((x): x is SocialLink => Boolean(x));
}

function on(s: Record<string, string>, key: string, fallback = true): boolean {
  const v = (s[key] ?? "").trim();
  if (!v) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

/**
 * Footer — ayarlar + menü + sosyal + servisler
 */
export async function SiteFooter() {
  const [settings, menu] = await Promise.all([
    getSiteSettings().catch(() => ({}) as Record<string, string>),
    getCachedMenu("footer").catch(() => null),
  ]);

  let columns: FooterCol[] = [];
  if (menu?.items?.length) {
    columns = footerColumnsFromMenu(menu.items);
  }
  if (!columns.length) {
    columns = [
      {
        title: "Bölümler",
        links: [
          { href: "/son-dakika", label: "Son dakika" },
          { href: "/yazarlar", label: "Yazarlar" },
          { href: "/video", label: "Video" },
          { href: "/galeri", label: "Galeri" },
        ],
      },
      { title: "Kurumsal", links: legalFallback },
    ];
  }

  const corporate = resolveCorporate(settings);
  const siteName = corporate.siteName;
  const tagline = corporate.tagline;
  const contactEmail = corporate.contactEmail || null;
  const socials = socialFromSettings(settings);

  const tipDigits =
    digitsPhone(process.env.NEXT_PUBLIC_TIP_PHONE) ||
    digitsPhone(corporate.whatsappTip) ||
    digitsPhone(settings["social.whatsapp"]) ||
    "";
  const tip = normalizeTrPhone(tipDigits);
  const tipWa = `https://wa.me/${tip.wa}?text=${encodeURIComponent(
    `Merhaba, ${siteName} ihbar hattına yazıyorum. Konu: `,
  )}`;

  const year = new Date().getFullYear();
  const legal = pickLegalLinks(columns);
  const linkCols = columns.slice(0, 4);

  const showNewsletter = on(settings, "footer.newsletterEnabled");
  const showTip = on(settings, "footer.tipEnabled");
  const showServices = on(settings, "footer.servicesEnabled");
  const services = parseServices(settings["footer.servicesJson"]);
  const servicesLabel =
    settings["footer.servicesLabel"]?.trim() || "Hızlı erişim";
  const citation =
    settings["footer.citation"]?.trim() ||
    "Bu sitedeki içerikler kaynak gösterilmeden alıntılanamaz.";
  const newsletterKicker =
    settings["footer.newsletterKicker"]?.trim() || "E-posta bülteni";
  const newsletterTitle =
    settings["footer.newsletterTitle"]?.trim() ||
    "Günün manşetleri sabah kutunuzda";
  const newsletterPromise =
    settings["footer.newsletterPromise"]?.trim() ||
    "Günde tek e-posta, reklam yok. Abonelik e-postanızdaki onay linkiyle tamamlanır.";
  const tipKicker = settings["footer.tipKicker"]?.trim() || "Haber ihbarı";
  const tipTitle = settings["footer.tipTitle"]?.trim() || "İhbar hattı";
  const tipBody =
    settings["footer.tipBody"]?.trim() ||
    "Olay, belge veya yerel haber ipucu için yazın. Kaynağınız isterseniz gizli tutulur.";

  return (
    <footer className={styles.footer} id="kunye-footer">
      <div className={styles.accent} aria-hidden />

      {showNewsletter || showTip ? (
        <div className={styles.layerAction}>
          <div className={`yh-container ${styles.actionGrid}`}>
            {showNewsletter ? (
              <section
                className={styles.newsletter}
                id="bulten"
                aria-labelledby="bulten-title"
              >
                <p className={styles.kicker}>{newsletterKicker}</p>
                <h2 id="bulten-title">{newsletterTitle}</h2>
                <p className={styles.promise}>{newsletterPromise}</p>
                <BultenFlash />
                <form className={styles.form} action="/api/bulten" method="post">
                  <div className={styles.formRow}>
                    <label className="yh-sr-only" htmlFor="footer-email">
                      E-posta adresiniz
                    </label>
                    <input
                      id="footer-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="E-posta adresiniz"
                    />
                    <button type="submit">Kayıt ol</button>
                  </div>
                  <label className={styles.consent}>
                    <input type="checkbox" name="consent" value="on" required />
                    <span>
                      <Link href="/kvkk" className={styles.consentLink}>
                        Aydınlatma metnini
                      </Link>{" "}
                      okudum, e-posta gönderilmesine izin veriyorum.
                    </span>
                  </label>
                </form>
              </section>
            ) : null}

            {showTip ? (
              <section
                className={styles.tip}
                id="ihbar"
                aria-labelledby="ihbar-title"
              >
                <p className={styles.kicker}>{tipKicker}</p>
                <h2 id="ihbar-title">{tipTitle}</h2>
                <p>{tipBody}</p>
                <div className={styles.tipActions}>
                  <Link href="/ihbar" className={styles.wa}>
                    İhbar formu
                  </Link>
                  <a
                    href={tipWa}
                    className={styles.phone}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp · {tip.display}
                  </a>
                </div>
                {contactEmail ? (
                  <a
                    href={`mailto:${contactEmail}`}
                    className={styles.mailLink}
                    aria-label={`E-posta: ${contactEmail}`}
                  >
                    <Mail size={16} aria-hidden />
                    {contactEmail}
                  </a>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {showServices ? (
        <div className={styles.layerServices}>
          <div className={`yh-container ${styles.servicesInner}`}>
            <h2 className={styles.layerLabel}>{servicesLabel}</h2>
            <ul className={styles.serviceGrid}>
              {services.map((s) => {
                const Icon = SERVICE_ICONS[s.icon] ?? Moon;
                return (
                  <li key={s.href + s.label}>
                    <Link href={s.href} className={styles.serviceCard}>
                      <span className={styles.serviceIcon} aria-hidden>
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <span className={styles.serviceText}>
                        <strong>{s.label}</strong>
                        {s.hint ? <span>{s.hint}</span> : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <div className={styles.layerLinks}>
        <div
          className={`yh-container ${styles.linksGrid}`}
          style={{ ["--footer-cols" as string]: String(linkCols.length) }}
        >
          <div className={styles.brand}>
            <FooterBrand siteName={siteName} />
            <p className={styles.tagline}>{tagline}</p>
            {socials.length ? (
              <ul className={styles.social} aria-label="Sosyal medya">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      aria-label={s.label}
                      title={s.label}
                    >
                      <SocialGlyph id={s.id} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {linkCols.map((col) => (
            <nav key={col.title} className={styles.col} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className={styles.layerLegal}>
        <div className={`yh-container ${styles.legalInner}`}>
          <p className={styles.citation}>{citation}</p>
          <div className={styles.legalRow}>
            <p className={styles.copy}>
              © {year} {siteName}
            </p>
            <nav className={styles.legal} aria-label="Yasal bağlantılar">
              {legal.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <a href="#icerik" className={styles.toTop}>
              Yukarı ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
