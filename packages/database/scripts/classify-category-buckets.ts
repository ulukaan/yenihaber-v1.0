/**
 * Mevcut kategorileri bolge | haber | parti | kurum kovalarına otomatik ayıklar
 */
import { prisma } from "../src/index.js";

type Bucket = "bolge" | "haber" | "parti" | "kurum";

const DISTRICTS = new Set([
  "akcakoca",
  "cumayeri",
  "cilimli",
  "golyaka",
  "gumusova",
  "kaynasli",
  "yigilca",
  "ilceler",
  "duzce",
  "duzce-haberleri",
  "bolge",
  "yerel",
  "yerel-haber",
  "yerel-haberler",
  "ilce",
  "ilcelerimiz",
  "merkez",
  "duzce-merkez",
  "konuralp",
  "beykoy",
  "bogazici",
]);

const PARTY_SLUGS = new Set([
  "siyasi-partiler",
  "partiler",
  "parti",
  "akp",
  "adalet-ve-kalkinma-partisi",
  "ak-parti",
  "chp",
  "cumhuriyet-halk-partisi",
  "mhp",
  "milliyetci-hareket-partisi",
  "iyi-parti",
  "iyiparti",
  "zafer-partisi",
  "anahtar-parti",
  "dem-parti",
  "dem",
  "saadet-partisi",
  "saadet",
  "hdp",
  "ysp",
  "gelecek-partisi",
  "deva-partisi",
  "yeniden-refah-partisi",
  "memleket-partisi",
  "tip",
  "turkiye-isci-partisi",
  "vatan-partisi",
  "bbp",
  "buyuk-birlik-partisi",
  "dsp",
  "dp",
  "demokrat-parti",
]);

const KURUM_PATTERNS = [
  /belediye/,
  /kaymakaml/,
  /valilik/,
  /valiligi/,
  /emniyet/,
  /jandarma/,
  /hastane/,
  /universite/,
  /milli.?egitim/,
  /egitim.?mud/,
  /saglik.?mud/,
  /tapu/,
  /nufus/,
  /sgk/,
  /vergi.?dairesi/,
  /icra/,
  /adliye/,
  /mahkem/,
  /savcilik/,
  /barosu/,
  /odasi/,
  /ticaret/,
  /sanayi/,
  /esnaf/,
  /muftu/,
  /diyanet/,
  /afad/,
  /kizilay/,
  /tarim/,
  /orman/,
  /\bdsi\b/,
  /havaalani/,
  /liman/,
  /osb/,
  /organize/,
  /kurum/,
  /kamu/,
  /mudurlug/,
  /muduru/,
  /mudurluk/,
  /müdürl/,
  /genclik.?spor/,
  /kultur.?turizm/,
  /itfa/,
  /zabita/,
];

const PARTY_PATTERNS = [
  /parti/,
  /^akp$/,
  /^chp$/,
  /^mhp$/,
  /^hdp$/,
  /^dem$/,
  /^iyi$/,
  /siyasi/,
];

const BOLGE_PATTERNS = [
  /ilce/,
  /ilçe/,
  /belde/,
  /mahalle/,
  /bolge/,
  /bölge/,
  /duzce/,
  /düzce/,
  /akcakoca/,
  /akçakoca/,
  /cumayeri/,
  /cilimli/,
  /çilimli/,
  /golyaka/,
  /gölyaka/,
  /gumusova/,
  /gümüşova/,
  /kaynasli/,
  /kaynaşlı/,
  /yigilca/,
  /yığılca/,
  /yerel/,
  /konuralp/,
];

function norm(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .trim();
}

function slugKey(slug: string) {
  return norm(slug).replace(/\s+/g, "-");
}

function textBlob(name: string, slug: string) {
  return `${norm(name)} ${slugKey(slug)}`;
}

function classify(name: string, slug: string): Bucket {
  const s = slugKey(slug);
  const n = norm(name);
  const blob = textBlob(name, slug);

  // 1) Parti (önce — «parti» kelimesi net)
  if (PARTY_SLUGS.has(s) || PARTY_PATTERNS.some((re) => re.test(s) || re.test(n))) {
    return "parti";
  }

  // 2) Kurum — «Düzce Belediyesi» vb. bölge kalıbından önce
  if (KURUM_PATTERNS.some((re) => re.test(s) || re.test(n) || re.test(blob))) {
    return "kurum";
  }

  // 3) Bölge / ilçe
  if (
    DISTRICTS.has(s) ||
    BOLGE_PATTERNS.some((re) => re.test(s) || re.test(n) || re.test(blob))
  ) {
    return "bolge";
  }

  return "haber";
}

async function main() {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      bucket: true,
      parentId: true,
    },
    orderBy: { name: "asc" },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));
  let changed = 0;
  const summary: Record<Bucket, string[]> = {
    bolge: [],
    haber: [],
    parti: [],
    kurum: [],
  };

  // 1) Doğrudan sınıflandır
  const assigned = new Map<string, Bucket>();
  for (const row of rows) {
    assigned.set(row.id, classify(row.name, row.slug));
  }

  // 2) Üst ebeveyn kovası: ebeveyn parti/bolge/kurum ise çocuklar aynı (haber ebeveyn ezmez)
  for (const row of rows) {
    if (!row.parentId) continue;
    const parent = byId.get(row.parentId);
    if (!parent) continue;
    const pb = assigned.get(parent.id) ?? classify(parent.name, parent.slug);
    if (pb === "parti" || pb === "bolge" || pb === "kurum") {
      assigned.set(row.id, pb);
    }
  }

  // 3) Yaz
  for (const row of rows) {
    const next = assigned.get(row.id) ?? "haber";
    summary[next].push(row.name);
    if (row.bucket === next) continue;
    await prisma.category.update({
      where: { id: row.id },
      data: { bucket: next },
    });
    changed += 1;
    console.log(`  ${row.bucket} → ${next}: ${row.name} (${row.slug})`);
  }

  console.log("\nÖzet:");
  for (const b of ["bolge", "haber", "parti", "kurum"] as Bucket[]) {
    console.log(`  ${b}: ${summary[b].length} — ${summary[b].join(", ") || "—"}`);
  }
  console.log(`\nGüncellenen: ${changed} / ${rows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
