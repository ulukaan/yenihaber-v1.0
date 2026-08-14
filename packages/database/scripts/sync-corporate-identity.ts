/**
 * Kurumsal kimlik tutarlılığı — site adı / e-posta / SEO şablonu.
 * Çalıştır: npx tsx packages/database/scripts/sync-corporate-identity.ts
 */
import { prisma } from "../src/index.ts";

const PATCH: Record<string, string> = {
  "site.name": "Düzce Radikal",
  siteName: "Düzce Radikal",
  displayName: "Düzce Radikal",
  "site.tagline": "Düzce ve bölgeden gündem",
  siteTagline: "Düzce ve bölgeden gündem",
  "seo.titleTemplate": "%s | Düzce Radikal",
  contactEmail: "iletisim@duzceradikal.com",
  "email.fromName": "Düzce Radikal",
  "email.fromAddress": "iletisim@duzceradikal.com",
  legalName: "Düzce Radikal",
  contactCity: "Düzce",
};

async function main() {
  for (const [key, value] of Object.entries(PATCH)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    console.log("ok", key, "=", value);
  }

  const existing = await prisma.setting.findUnique({
    where: { key: "kunyeEntries" },
  });
  if (!existing?.value || existing.value === "[]") {
    const rows = [
      {
        id: "k-yayinci",
        detail: "Düzce Radikal",
        department: "Yayıncı",
        email: "iletisim@duzceradikal.com",
        sortOrder: 1,
      },
      {
        id: "k-gym",
        detail: "Haber Merkezi",
        department: "Genel Yayın Yönetimi",
        email: "editor@duzceradikal.com",
        sortOrder: 2,
      },
      {
        id: "k-temsilci",
        detail: "Belirtilecek",
        department: "Tüzel Kişi Temsilcisi",
        email: "",
        sortOrder: 3,
      },
    ];
    await prisma.setting.upsert({
      where: { key: "kunyeEntries" },
      create: { key: "kunyeEntries", value: JSON.stringify(rows) },
      update: { value: JSON.stringify(rows) },
    });
    console.log("ok kunyeEntries seeded");
  } else {
    console.log("kunyeEntries already set — skipped");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
