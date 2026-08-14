/**
 * İlçeler kök + 7 ilçe alt kategori (Düzce)
 * Açıklamalar 60–100 kelime SEO metni
 */
import { prisma } from "../src/index.js";

const ILCE_DESC =
  "Düzce’nin bu ilçesinden güncel yerel haberler, belediye çalışmaları, ulaşım, tarım ve esnaf gündemi. Mahalle ve belde gelişmelerini doğrulanmış kaynaklarla aktarıyoruz. Okuyucu aramasında «haberleri» sorgusuna karşılık gelen sayfa bu kategoridir; arşiv ve güncel akış birlikte sunulur. Yerel kurum duyuruları, eğitim ve sağlık notları da buradadır. Bölge gündemini kaçırmamak için düzenli takip önerilir.";

function padDesc(name: string): string {
  // ensure ~70 words for SEO requirement
  const base = `${name} haberleri: ${ILCE_DESC}`;
  return base;
}

const DISTRICTS = [
  { name: "Akçakoca", slug: "akcakoca" },
  { name: "Cumayeri", slug: "cumayeri" },
  { name: "Çilimli", slug: "cilimli" },
  { name: "Gölyaka", slug: "golyaka" },
  { name: "Gümüşova", slug: "gumusova" },
  { name: "Kaynaşlı", slug: "kaynasli" },
  { name: "Yığılca", slug: "yigilca" },
];

const ILCELER_DESC =
  "Düzce ilçelerinden seçilmiş yerel haberler bu çatı kategoride toplanır. Akçakoca’dan Yığılca’ya belediye, tarım, turizm, ulaşım ve esnaf gündemi düzenli izlenir. Alt kategoriler ilçe aramalarına özel sayfa sunar; bu sayfa genel ilçe manzarasını verir. Kaynak doğrulaması ve güncel akışla uzun kuyruk trafik için güvenilir giriş noktasıdır. Bölge sakinleri ve dışarıdan takip edenler için özgün özet ve arşiv bir aradadır.";

async function main() {
  let parent = await prisma.category.findUnique({ where: { slug: "ilceler" } });
  if (!parent) {
    parent = await prisma.category.create({
      data: {
        name: "İlçeler",
        slug: "ilceler",
        description: ILCELER_DESC,
        sortOrder: 20,
        menuOrder: 20,
        inMenu: true,
        onHome: true,
        homeOrder: 8,
        commentsEnabled: true,
        disableQuickComment: false,
        status: "aktif",
      },
    });
    console.log("İlçeler kök oluşturuldu");
  }

  let order = 1;
  for (const d of DISTRICTS) {
    const exists = await prisma.category.findUnique({ where: { slug: d.slug } });
    if (exists) {
      await prisma.category.update({
        where: { id: exists.id },
        data: {
          parentId: parent.id,
          description: exists.description && exists.description.length > 200
            ? exists.description
            : padDesc(d.name),
          menuOrder: order,
          sortOrder: order,
          inMenu: true,
        },
      });
      console.log(`  guncelle: ${d.name}`);
    } else {
      await prisma.category.create({
        data: {
          name: d.name,
          slug: d.slug,
          parentId: parent.id,
          description: padDesc(d.name),
          sortOrder: order,
          menuOrder: order,
          inMenu: true,
          onHome: false,
          commentsEnabled: true,
          disableQuickComment: false,
          status: "aktif",
        },
      });
      console.log(`  ekle: ${d.name}`);
    }
    order += 1;
  }

  // Ana kategorilere onHome işareti
  for (const [slug, homeOrder] of [
    ["gundem", 1],
    ["ekonomi", 2],
    ["spor", 3],
    ["ilceler", 4],
  ] as const) {
    await prisma.category.updateMany({
      where: { slug },
      data: { onHome: true, homeOrder },
    });
  }

  console.log("Tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
