/**
 * Kurumsal demo reklamlar — tüm AD_SLOTS alanlarına dağıtılır.
 * Önceki "[Demo]" kayıtlarını siler, yeniden üretir.
 */
import { prisma } from "../src/index.ts";
import { AD_SLOTS, type AdSlotCode } from "@yenihaber/shared";

type Brand = {
  name: string;
  advertiser: string;
  tagline: string;
  cta: string;
  bg: string;
  fg: string;
  accent: string;
  url: string;
};

const BRANDS: Brand[] = [
  {
    name: "Anadolu Bankası",
    advertiser: "Anadolu Bankası A.Ş.",
    tagline: "Kurumsal bankacılıkta güvenilir çözüm ortağı",
    cta: "Hemen Başvurun",
    bg: "#0B1F33",
    fg: "#F5F7FA",
    accent: "#C9A227",
    url: "https://example.com/anadolu-bankasi",
  },
  {
    name: "Karadeniz Sigorta",
    advertiser: "Karadeniz Sigorta",
    tagline: "İşletmenizi ve ailenizi güvence altına alın",
    cta: "Teklif Alın",
    bg: "#102A43",
    fg: "#FFFFFF",
    accent: "#38BDF8",
    url: "https://example.com/karadeniz-sigorta",
  },
  {
    name: "Marmara Enerji",
    advertiser: "Marmara Enerji Holding",
    tagline: "Sürdürülebilir enerji, sürdürülebilir büyüme",
    cta: "Keşfedin",
    bg: "#052E16",
    fg: "#ECFDF5",
    accent: "#4ADE80",
    url: "https://example.com/marmara-enerji",
  },
  {
    name: "Boğaziçi Holding",
    advertiser: "Boğaziçi Holding",
    tagline: "Sanayi · Lojistik · Gayrimenkul",
    cta: "Kurumsal",
    bg: "#1C1917",
    fg: "#FAFAF9",
    accent: "#F59E0B",
    url: "https://example.com/bogazici-holding",
  },
  {
    name: "Ege Telekom",
    advertiser: "Ege Telekom",
    tagline: "Kurumsal fiber ve bulut altyapısı",
    cta: "Paketleri İnceleyin",
    bg: "#1E1B4B",
    fg: "#EEF2FF",
    accent: "#818CF8",
    url: "https://example.com/ege-telekom",
  },
  {
    name: "Sakarya Yapı",
    advertiser: "Sakarya Yapı A.Ş.",
    tagline: "Endüstriyel tesis ve ofis projeleri",
    cta: "Projeler",
    bg: "#292524",
    fg: "#F5F5F4",
    accent: "#FB923C",
    url: "https://example.com/sakarya-yapi",
  },
  {
    name: "Trakya Lojistik",
    advertiser: "Trakya Lojistik",
    tagline: "Avrupa koridorunda zamanında teslimat",
    cta: "Teklif İsteyin",
    bg: "#0F172A",
    fg: "#F8FAFC",
    accent: "#22D3EE",
    url: "https://example.com/trakya-lojistik",
  },
  {
    name: "Akdeniz Sağlık",
    advertiser: "Akdeniz Sağlık Grubu",
    tagline: "Kurumsal sağlık anlaşmaları",
    cta: "Bilgi Alın",
    bg: "#134E4A",
    fg: "#F0FDFA",
    accent: "#2DD4BF",
    url: "https://example.com/akdeniz-saglik",
  },
];

type Format = "billboard" | "leaderboard" | "mpu" | "halfpage" | "sky" | "sticky" | "footer" | "native";

function formatForSlot(code: AdSlotCode): Format {
  switch (code) {
    case "masthead":
    case "home-inline-1":
    case "home-inline-2":
    case "article-top":
    case "article-bottom":
    case "category-top":
    case "category-inline":
    case "gallery-slide":
      return "leaderboard";
    case "home-billboard":
    case "footer":
      return "footer";
    case "home-sidebar-1":
    case "article-sidebar-1":
    case "article-inline":
    case "interstitial":
      return "mpu";
    case "home-sidebar-sticky":
    case "article-sidebar-sticky":
      return "halfpage";
    case "rail-left":
    case "rail-right":
      return "sky";
    case "sticky-bottom":
      return "sticky";
    case "home-native":
      return "native";
    case "video-preroll":
      return "mpu";
    default:
      return "leaderboard";
  }
}

function dims(format: Format): { w: number; h: number } {
  switch (format) {
    case "billboard":
      return { w: 970, h: 90 };
    case "leaderboard":
      return { w: 728, h: 90 };
    case "mpu":
      return { w: 300, h: 250 };
    case "halfpage":
      return { w: 300, h: 600 };
    case "sky":
      return { w: 160, h: 600 };
    case "sticky":
      return { w: 320, h: 50 };
    case "footer":
      return { w: 970, h: 250 };
    case "native":
      return { w: 640, h: 120 };
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function creativeHtml(brand: Brand, format: Format): string {
  const { w, h } = dims(format);
  const name = escapeXml(brand.name);
  const tag = escapeXml(brand.tagline);
  const cta = escapeXml(brand.cta);
  const url = escapeXml(brand.url);

  if (format === "native") {
    return `<a href="${url}" target="_blank" rel="nofollow sponsored noopener" style="display:flex;gap:16px;align-items:center;padding:14px 16px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;text-decoration:none;color:#111;max-width:640px;font-family:system-ui,Segoe UI,sans-serif">
  <span style="flex:0 0 72px;height:72px;border-radius:8px;background:${brand.bg};display:flex;align-items:center;justify-content:center;color:${brand.accent};font-weight:800;font-size:13px;letter-spacing:.04em">SPONSOR</span>
  <span style="min-width:0">
    <span style="display:block;font-size:11px;font-weight:700;letter-spacing:.08em;color:#6b7280;margin-bottom:4px">SPONSORLU İÇERİK</span>
    <span style="display:block;font-size:16px;font-weight:700;line-height:1.3;margin-bottom:4px">${name}</span>
    <span style="display:block;font-size:13px;color:#4b5563;line-height:1.4">${tag}</span>
  </span>
</a>`;
  }

  if (format === "sticky") {
    return `<a href="${url}" target="_blank" rel="nofollow sponsored noopener" style="display:block;max-width:100%">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="${name}">
  <rect width="${w}" height="${h}" fill="${brand.bg}"/>
  <rect x="0" y="0" width="4" height="${h}" fill="${brand.accent}"/>
  <text x="16" y="32" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="14" font-weight="700">${name}</text>
  <text x="200" y="32" fill="${brand.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="12" font-weight="600">${cta} →</text>
</svg></a>`;
  }

  if (format === "sky") {
    return `<a href="${url}" target="_blank" rel="nofollow sponsored noopener" style="display:block;width:160px">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="160" height="600" role="img" aria-label="${name}">
  <rect width="${w}" height="${h}" fill="${brand.bg}"/>
  <rect x="0" y="0" width="${w}" height="6" fill="${brand.accent}"/>
  <text x="20" y="80" fill="${brand.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">KURUMSAL</text>
  <text x="20" y="130" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="22" font-weight="800">
    <tspan x="20" dy="0">${escapeXml(brand.name.split(" ")[0] ?? brand.name)}</tspan>
    <tspan x="20" dy="28">${escapeXml(brand.name.split(" ").slice(1).join(" ") || "")}</tspan>
  </text>
  <text x="20" y="220" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="13" opacity="0.85">
    <tspan x="20" dy="0">${escapeXml(brand.tagline.slice(0, 28))}</tspan>
    <tspan x="20" dy="18">${escapeXml(brand.tagline.slice(28, 56))}</tspan>
  </text>
  <rect x="20" y="520" width="120" height="40" rx="4" fill="${brand.accent}"/>
  <text x="80" y="545" text-anchor="middle" fill="${brand.bg}" font-family="system-ui,Segoe UI,sans-serif" font-size="12" font-weight="700">${cta}</text>
</svg></a>`;
  }

  if (format === "mpu" || format === "halfpage") {
    const titleSize = format === "halfpage" ? 28 : 22;
    const tagY = format === "halfpage" ? 280 : 140;
    const ctaY = h - 56;
    return `<a href="${url}" target="_blank" rel="nofollow sponsored noopener" style="display:block;max-width:${w}px;margin:0 auto">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;height:auto" role="img" aria-label="${name}">
  <rect width="${w}" height="${h}" fill="${brand.bg}"/>
  <rect x="0" y="0" width="${w}" height="5" fill="${brand.accent}"/>
  <text x="24" y="40" fill="${brand.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="11" font-weight="700" letter-spacing="2">KURUMSAL ÇÖZÜM</text>
  <text x="24" y="90" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="${titleSize}" font-weight="800">${name}</text>
  <text x="24" y="${tagY}" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="14" opacity="0.9">
    <tspan x="24" dy="0">${escapeXml(brand.tagline.slice(0, 34))}</tspan>
    <tspan x="24" dy="20">${escapeXml(brand.tagline.slice(34))}</tspan>
  </text>
  <rect x="24" y="${ctaY}" width="140" height="36" rx="4" fill="${brand.accent}"/>
  <text x="94" y="${ctaY + 23}" text-anchor="middle" fill="${brand.bg}" font-family="system-ui,Segoe UI,sans-serif" font-size="13" font-weight="700">${cta}</text>
</svg></a>`;
  }

  // leaderboard / footer / billboard
  const isTall = format === "footer";
  const titleY = isTall ? 90 : 38;
  const tagY = isTall ? 130 : 68;
  const ctaX = w - 160;
  const ctaY = isTall ? h - 70 : 26;
  return `<a href="${url}" target="_blank" rel="nofollow sponsored noopener" style="display:block;max-width:100%">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;height:auto;display:block;margin:0 auto" role="img" aria-label="${name}">
  <rect width="${w}" height="${h}" fill="${brand.bg}"/>
  <rect x="0" y="0" width="6" height="${h}" fill="${brand.accent}"/>
  <text x="28" y="${isTall ? 48 : 28}" fill="${brand.accent}" font-family="system-ui,Segoe UI,sans-serif" font-size="11" font-weight="700" letter-spacing="2">KURUMSAL</text>
  <text x="28" y="${titleY}" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="${isTall ? 32 : 22}" font-weight="800">${name}</text>
  <text x="28" y="${tagY}" fill="${brand.fg}" font-family="system-ui,Segoe UI,sans-serif" font-size="${isTall ? 16 : 13}" opacity="0.88">${tag}</text>
  <rect x="${ctaX}" y="${ctaY}" width="140" height="36" rx="4" fill="${brand.accent}"/>
  <text x="${ctaX + 70}" y="${ctaY + 23}" text-anchor="middle" fill="${brand.bg}" font-family="system-ui,Segoe UI,sans-serif" font-size="13" font-weight="700">${cta}</text>
</svg></a>`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

async function main() {
  // Önceki demo + boş alanları temizle; kurumsal set ile yeniden doldur
  const deleted = await prisma.ad.deleteMany({});

  const slots = Object.keys(AD_SLOTS) as AdSlotCode[];
  const brands = shuffle(BRANDS);
  let created = 0;

  for (let i = 0; i < slots.length; i++) {
    const code = slots[i]!;
    const slot = AD_SLOTS[code];
    const brand = brands[i % brands.length]!;
    const format = formatForSlot(code);
    const extra =
      slot.rotate && Math.random() > 0.45
        ? brands[(i + 3) % brands.length]!
        : null;

    const rows = [brand, ...(extra ? [extra] : [])];
    for (let r = 0; r < rows.length; r++) {
      const b = rows[r]!;
      await prisma.ad.create({
        data: {
          slotCode: code,
          name: `[Demo] ${b.name} — ${slot.name}`,
          advertiser: b.advertiser,
          type: "html",
          htmlCode: creativeHtml(b, format),
          targetUrl: b.url,
          device: slot.device,
          status: "active",
          weight: r === 0 ? 3 : 1,
        },
      });
      created += 1;
    }
  }

  console.log(
    JSON.stringify({ deleted: deleted.count, created, slots: slots.length }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
