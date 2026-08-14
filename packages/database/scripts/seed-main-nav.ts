import { PrismaClient } from "@prisma/client";

const parties = [
  { id: "akp", label: "AK Parti", href: "/kategori/adalet-ve-kalkinma-partisi" },
  { id: "chp", label: "CHP", href: "/kategori/cumhuriyet-halk-partisi" },
  { id: "mhp", label: "MHP", href: "/kategori/milliyetci-hareket-partisi" },
  { id: "iyi", label: "İYİ Parti", href: "/kategori/iyi-parti" },
  { id: "zafer", label: "Zafer Partisi", href: "/kategori/zafer-partisi" },
  { id: "anahtar", label: "Anahtar Parti", href: "/kategori/anahtar-parti" },
  { id: "dem", label: "DEM Parti", href: "/kategori/dem-parti" },
  { id: "saadet", label: "Saadet Partisi", href: "/kategori/saadet-partisi" },
];

const nav = [
  { id: "son-dakika", label: "Son Dakika", href: "/son-dakika", accent: true, children: [] },
  { id: "yazarlar", label: "Yazarlar", href: "/yazarlar", accent: false, children: [] },
  { id: "gundem", label: "Gündem", href: "/kategori/gundem", accent: false, children: [] },
  { id: "duzce", label: "Düzce", href: "/kategori/duzce", accent: false, children: [] },
  { id: "ekonomi", label: "Ekonomi", href: "/kategori/ekonomi", accent: false, children: [] },
  { id: "spor", label: "Spor", href: "/kategori/spor", accent: false, children: [] },
  { id: "dunya", label: "Dünya", href: "/kategori/dunya", accent: false, children: [] },
  { id: "saglik", label: "Sağlık", href: "/kategori/saglik", accent: false, children: [] },
  { id: "teknoloji", label: "Teknoloji", href: "/kategori/teknoloji", accent: false, children: [] },
  { id: "turkiye", label: "Türkiye", href: "/kategori/turkiye", accent: false, children: [] },
  { id: "siyaset", label: "Siyaset", href: "/kategori/siyaset", accent: false, children: [] },
  {
    id: "siyasi-partiler",
    label: "Siyasi Partiler",
    href: "/kategori/siyasi-partiler",
    accent: false,
    children: parties,
  },
  { id: "magazin", label: "Magazin", href: "/kategori/magazin", accent: false, children: [] },
];

const p = new PrismaClient();
const value = JSON.stringify(nav);
await p.setting.upsert({
  where: { key: "mainNav" },
  create: { key: "mainNav", value },
  update: { value },
});
console.log("OK children:", parties.map((x) => x.label).join(", "));
await p.$disconnect();
