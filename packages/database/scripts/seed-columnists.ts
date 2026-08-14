/**
 * Köşe yazarlarını ve örnek yazılarını DB’ye ekler / günceller.
 * Kullanım: pnpm exec tsx scripts/seed-columnists.ts
 * (packages/database içinde)
 */
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const columnists = [
  {
    name: "Ahmet Yılmaz",
    email: "ahmet.yilmaz@duzceradikal.local",
    slug: "ahmet-yilmaz",
    title: "Gazeteci · Yerel Politika",
    bio: "Düzce gündemini ve kurumsal reformları 15 yıldır izliyor. Güven, şeffaflık ve şehir hafızası üzerine yazar.",
    columnistOrder: 1,
  },
  {
    name: "Ayşe Demir",
    email: "ayse.demir@duzceradikal.local",
    slug: "ayse-demir",
    title: "Ekonomi Yazarı",
    bio: "Piyasalar, esnaf ve hane bütçesini sade dille aktarır. Yerel ekonominin nabzını tutar.",
    columnistOrder: 2,
  },
  {
    name: "Mehmet Kaya",
    email: "mehmet.kaya@duzceradikal.local",
    slug: "mehmet-kaya",
    title: "Gündem Yazarı",
    bio: "Haberin arkasındaki bağlamı arar. Sivil toplum, kamu politikası ve günlük yaşam kesişiminde yazar.",
    columnistOrder: 3,
  },
  {
    name: "Selin Aras",
    email: "selin.aras@duzceradikal.local",
    slug: "selin-aras",
    title: "Kültür & Yaşam",
    bio: "Kültür, bellek ve şehir hayatı. Sanat etkinliklerinden mahalle hikâyelerine uzanan köşe yazıları.",
    columnistOrder: 4,
  },
  {
    name: "Can Öztürk",
    email: "can.ozturk@duzceradikal.local",
    slug: "can-ozturk",
    title: "Spor Yazarı",
    bio: "Yerel amatörden üst lige kadar Düzce sporu. Takım kimliği, altyapı ve seyirci kültürü odağında.",
    columnistOrder: 5,
  },
] as const;

const pieces: Array<{
  authorSlug: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  hoursAgo: number;
}> = [
  {
    authorSlug: "ahmet-yilmaz",
    title: "Düzce’de güven, tabloda değil sahada aranır",
    slug: "duzce-de-guven-tabloda-degil-sahada-aranir",
    excerpt:
      "Sloganlarla şehir yönetilmez. Hesap verebilirlik ve açık takvim olmadan güven birikmez.",
    content:
      "<p>Yerel siyasette en değerli varlık güvendir. Güven de gecikmeli projelerle değil, ölçülebilir adımlarla birikir.</p><p>Düzce’nin önündeki fırsat; şeffaf ihale, net takvim ve mahalle ölçeğinde dinleme zemini kurmaktır.</p>",
    categorySlug: "gundem",
    hoursAgo: 6,
  },
  {
    authorSlug: "ahmet-yilmaz",
    title: "Katılım olmadan meclis tutanağı yetmez",
    slug: "katilim-olmadan-meclis-tutanagi-yetmez",
    excerpt:
      "Karar alma süreçleri şehrin sakinlerine de dokunmalı; yoksa tutanaklar raflarda kalır.",
    content:
      "<p>Demokrasinin sahası sandıkla sınırlı değildir. Gündelik katılım kanalları, belediyeyi ve kamu kurumlarını vatandaşa yaklaştırır.</p>",
    categorySlug: "siyaset",
    hoursAgo: 30,
  },
  {
    authorSlug: "ayse-demir",
    title: "Vitrin fiyatı ile bilanço arasında mesafe",
    slug: "vitrin-fiyati-ile-bilanco-arasinda-mesafe",
    excerpt:
      "Rakamlar sakin görünürken tezgâh başka hikâye anlatıyor. Esnaf nakit döngüsünü bozmadan ayakta kalmaya çalışıyor.",
    content:
      "<p>Enflasyon endeksi ile sokak fiyatı arasındaki fark, hane bütçesini zorluyor. Esnaf için stok ve nakit; tüketicinin tercihi ise ertelemek.</p>",
    categorySlug: "ekonomi",
    hoursAgo: 10,
  },
  {
    authorSlug: "ayse-demir",
    title: "Kredi kartı ekstrelerinin gizli yükü",
    slug: "kredi-karti-ekstrelerinin-gizli-yuku",
    excerpt:
      "Aylık asgari ödeme alışkanlığı, uzun vadede faizin gölgesinde büyür.",
    content:
      "<p>Kısa vadeli rahatlama, uzun vadeli yük olabilir. Hane maliyesinde sıra: zorunlu gider, borç servisi, sonra istekler.</p>",
    categorySlug: "ekonomi",
    hoursAgo: 48,
  },
  {
    authorSlug: "mehmet-kaya",
    title: "Gündem hızlanırken bağlam kaybolmasın",
    slug: "gundem-hizlanirken-baglam-kaybolmasin",
    excerpt:
      "Anlık başlıklar önemli; ama nedenler ve sonuçlar olmadan okuyucu birikim yapamaz.",
    content:
      "<p>Haber akışı hızlandıkça bağlam zayıflar. Köşenin işi; okuyucuya “neden bize de dokunuyor?” sorusunu hatırlatmaktır.</p>",
    categorySlug: "gundem",
    hoursAgo: 14,
  },
  {
    authorSlug: "mehmet-kaya",
    title: "Mahalle dernekleri sessiz motor",
    slug: "mahalle-dernekleri-sessiz-motor",
    excerpt:
      "Sivil toplum raporlarda yer bulmasa da sokakta çözümlerin taşıyıcısı olabiliyor.",
    content:
      "<p>Dernekler, yardımlaşmadan kültürel üretime kadar şehrin görünmeyen iskeletidir. Desteklenmezse boşluk başka aktörlerle doldurulur.</p>",
    categorySlug: "duzce",
    hoursAgo: 55,
  },
  {
    authorSlug: "selin-aras",
    title: "Kültürel hafıza bir şehir parkıdır",
    slug: "kulturel-hafiza-bir-sehir-parkidir",
    excerpt:
      "Kütüphane, salon ve açık alan; bellek mekânları olmadan kimlik incelir.",
    content:
      "<p>Kültür bütçesi lüks değildir. Hafıza mekânları, gençlerin şehirle kurduğu bağı güçlendirir.</p>",
    categorySlug: "gundem",
    hoursAgo: 20,
  },
  {
    authorSlug: "selin-aras",
    title: "Sahnede Düzce: Yerel üretim, ulusal ritim",
    slug: "sahnede-duzce-yerel-uretim-ulusal-ritim",
    excerpt:
      "Yerel sanatın ihtiyaç duyduğu şey büyük bütçe kadar süreklilik ve görünürlüktür.",
    content:
      "<p>Festival bir gece değildir; yıl boyu prova, salon ve yayın partnerliği ister.</p>",
    categorySlug: "magazin",
    hoursAgo: 72,
  },
  {
    authorSlug: "can-ozturk",
    title: "Altyapı kulüpleri şehrin gizli stokudur",
    slug: "altyapi-kulupleri-sehirin-gizli-stokudur",
    excerpt:
      "Amatör ligden gelen oyuncu, yalnızca skor değil kimlik de taşır.",
    content:
      "<p>Sahalar betonlaştıkça çocuklar saha bulamamaya başladı. Spor politikası yeşil alan kadar tesis takvimi demektir.</p>",
    categorySlug: "spor",
    hoursAgo: 8,
  },
  {
    authorSlug: "can-ozturk",
    title: "Tribün kültürü: Tezahürat mı, gerilim mi?",
    slug: "tribun-kulturu-tezahurat-mi-gerilim-mi",
    excerpt:
      "Destek ile şiddet arasındaki çizgi, kulüp iletişiminden başlar.",
    content:
      "<p>Seyirci deneyimi güvenle büyür. Aile tribünü, erken uyarı ve saha içi disiplin aynı pakettir.</p>",
    categorySlug: "spor",
    hoursAgo: 40,
  },
];

async function main() {
  const password = await hash("Yazar123!", 10);

  const users = [];
  for (const c of columnists) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        slug: c.slug,
        title: c.title,
        bio: c.bio,
        role: "YAZAR",
        isColumnist: true,
        columnistOrder: c.columnistOrder,
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=111111&textColor=ffffff`,
      },
      create: {
        email: c.email,
        password,
        name: c.name,
        slug: c.slug,
        title: c.title,
        bio: c.bio,
        role: "YAZAR",
        isColumnist: true,
        columnistOrder: c.columnistOrder,
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=111111&textColor=ffffff`,
      },
    });
    users.push(user);
  }

  const cats = await prisma.category.findMany();
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));
  const fallbackCat =
    catBySlug.get("gundem") ?? cats[0] ?? (await prisma.category.create({
      data: { name: "Gündem", slug: "gundem", sortOrder: 1 },
    }));

  let created = 0;
  for (const piece of pieces) {
    const author = users.find((u) => u.slug === piece.authorSlug);
    if (!author) continue;
    const category =
      catBySlug.get(piece.categorySlug) ?? fallbackCat;
    const publishedAt = new Date(Date.now() - piece.hoursAgo * 3600_000);

    const existing = await prisma.article.findUnique({
      where: { slug: piece.slug },
    });
    if (existing) {
      await prisma.article.update({
        where: { id: existing.id },
        data: {
          authorId: author.id,
          status: "YAYINDA",
          publishedAt: existing.publishedAt ?? publishedAt,
        },
      });
      continue;
    }

    await prisma.article.create({
      data: {
        title: piece.title,
        slug: piece.slug,
        excerpt: piece.excerpt,
        content: piece.content,
        status: "YAYINDA",
        publishedAt,
        authorId: author.id,
        categoryId: category.id,
        metaTitle: piece.title,
        metaDescription: piece.excerpt.slice(0, 150),
      },
    });
    created += 1;
  }

  console.log(
    `Köşe yazarları: ${users.length}, yeni yazı: ${created}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
