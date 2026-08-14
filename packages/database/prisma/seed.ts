import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Gündem", slug: "gundem", sortOrder: 1, description: "Düzce ve yerel gündem" },
  { name: "Spor", slug: "spor", sortOrder: 2, description: "Futbol, basketbol ve diğer sporlar" },
  { name: "Ekonomi", slug: "ekonomi", sortOrder: 3, description: "Piyasalar ve ekonomi" },
  { name: "Dünya", slug: "dunya", sortOrder: 4, description: "Uluslararası gelişmeler" },
  { name: "Teknoloji", slug: "teknoloji", sortOrder: 5, description: "Teknoloji ve bilim" },
  { name: "Sağlık", slug: "saglik", sortOrder: 6, description: "Sağlık ve yaşam" },
];

type SeedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
  tags: string[];
  hoursAgo?: number;
  authorSlug?: string;
  sourceAgency?: string;
};

type ColumnistSeed = {
  name: string;
  email: string;
  slug: string;
  title: string;
  bio: string;
  columnistOrder: number;
  avatarSeed: string;
};

const columnists: ColumnistSeed[] = [
  {
    name: "Ahmet Yılmaz",
    email: "ahmet.yilmaz@yenihaber.local",
    slug: "ahmet-yilmaz",
    title: "Gazeteci / Köşe Yazarı",
    bio: "Yerel politika ve şehir gündemini 15 yıldır izliyor. Düzce’nin sosyal dokusu ve kurumsal reformları üzerine yazar.",
    columnistOrder: 1,
    avatarSeed: "ahmet-yilmaz",
  },
  {
    name: "Ayşe Demir",
    email: "ayse.demir@yenihaber.local",
    slug: "ayse-demir",
    title: "Ekonomi Yazarı",
    bio: "Piyasalar, esnaf ve hane bütçesini sade dil ile yazıyor. Finansal okuryazarlık ve yereldeki ekonomik dönüşüm odağında.",
    columnistOrder: 2,
    avatarSeed: "ayse-demir",
  },
  {
    name: "Mehmet Kaya",
    email: "mehmet.kaya@yenihaber.local",
    slug: "mehmet-kaya",
    title: "Gündem Yazarı",
    bio: "Haberin arkasındaki bağlamı arar. Gündelik yaşam, sivil toplum ve kamu politikası kesişimini takip eder.",
    columnistOrder: 3,
    avatarSeed: "mehmet-kaya",
  },
  {
    name: "Selin Aras",
    email: "selin.aras@yenihaber.local",
    slug: "selin-aras",
    title: "Kültür & Yaşam",
    bio: "Kültür, bellek ve şehir hayatı. Sanat etkinliklerinden mahalle hikâyelerine uzanan köşe yazıları.",
    columnistOrder: 4,
    avatarSeed: "selin-aras",
  },
];

const columnPieces: SeedArticle[] = [
  {
    title: "Düzce’de yeni dönem: Güven ve şeffaflık olmadan olmaz",
    slug: "duzce-de-yeni-donem-guven-ve-seffafik",
    excerpt:
      "Şehrin geleceğini tarif ederken slogan yetmez; hesap verebilirlik ve ölçülebilir adımlar gerekir.",
    content:
      "<p>Yerel yönetimde başarılı olan şehirler, vaadi değil ölçümü merkeze alır. Vatandaşın güveni gecikmeli projelerle değil, açık takvim ve net sorumlulukla inşa edilir.</p><p>Bu yazıda Düzce’nin önündeki fırsat alanlarını ve atılması gereken üç somut adımı tartışıyorum.</p>",
    categorySlug: "gundem",
    authorSlug: "ahmet-yilmaz",
    tags: ["köşe", "düzce"],
    hoursAgo: 2,
  },
  {
    title: "Fiyatlar, faiz ve esnafın sabrı",
    slug: "fiyatlar-faiz-ve-esnafin-sabri",
    excerpt:
      "Rakamlar tabloda sakin görünürken vitrinde farklı bir hikâye anlatılıyor.",
    content:
      "<p>Enflasyon rakamı ile tezgâh fiyatı arasındaki mesafe, hane bütçesini zorluyor. Esnaf için nakit döngüsü bozulduğunda zincir hızla yayılıyor.</p>",
    categorySlug: "ekonomi",
    authorSlug: "ayse-demir",
    tags: ["köşe", "ekonomi"],
    hoursAgo: 5,
  },
  {
    title: "Gündemin gölgesinde kalan mahalle sesi",
    slug: "gundemin-golgesinde-kalan-mahalle-sesi",
    excerpt:
      "Manşetler büyük tartışırken asıl yaşam mahallede kuruluyor.",
    content:
      "<p>Bir şehri anlamak için sadece meclis salonuna değil, mahalle kahvesine de bakmak gerekir. Orada duyulan endişeler genelde politikanın ham maddesidir.</p>",
    categorySlug: "gundem",
    authorSlug: "mehmet-kaya",
    tags: ["köşe", "gündem"],
    hoursAgo: 8,
  },
  {
    title: "Kültürü lüks değil, kamu hizmeti saymak",
    slug: "kulturu-luks-degil-kamu-hizmeti-saymak",
    excerpt:
      "Salonlar doluysa şehir nefes alıyordur. Boş salonlar ise uyarıdır.",
    content:
      "<p>Kültür yatırımı lüks bütçe kalemi değil, sosyal dokunun bağ dokusudur. Yerel sahneler, kütüphaneler ve açık alan etkinlikleri şehri canlı tutar.</p>",
    categorySlug: "gundem",
    authorSlug: "selin-aras",
    tags: ["köşe", "kültür"],
    hoursAgo: 12,
  },
];

const sampleArticles: SeedArticle[] = [
  {
    title: "Şehir merkezinde yeni yeşil alan projesi onaylandı",
    slug: "sehir-merkezinde-yeni-yesil-alan-projesi",
    excerpt: "Belediye meclisi, park ve yeşil koridor planını oybirliğiyle kabul etti.",
    content:
      "<p>Yerel yönetim, şehir merkezinde yaklaşık 12 bin metrekarelik bir yeşil alan projesini onayladı. Proje kapsamında yürüyüş yolları, çocuk oyun alanları ve bisiklet güzergahları yer alacak.</p><p>Yetkililer, inşaatın bu yılın son çeyreğinde başlamasının planlandığını belirtti. Vatandaşlar projeye olumlu yaklaşırken, ulaşım güzergahlarının da gözden geçirileceğini ifade etti.</p><p>Proje bütçesinin kısmen merkezi hibelere bağlandığı, kalan kısmın belediye özkaynaklarından karşılanacağı kaydedildi.</p>",
    categorySlug: "gundem",
    isFeatured: true,
    isBreaking: true,
    tags: ["belediye", "şehir"],
    hoursAgo: 1,
  },
  {
    title: "Otogar çevresinde trafik düzenlemesi gündemde",
    slug: "otogar-cevresinde-trafik-duzenlemesi",
    excerpt: "Yoğun saatlerdeki kuyrukları azaltmak için tek yön ve yeni cep parkı planı hazırlandı.",
    content:
      "<p>Ulaşım birimi, otogar çevresinde yeni bir sirkülasyon planı üzerinde çalışıyor. Plan hayata geçerse hizmet araçlarına ayrı şerit tahsis edilecek.</p><p>Esnaf temsilcileri öneriyi desteklerken, geçiş sürelerinin kamuoyu ile paylaşılmasını talep etti.</p>",
    categorySlug: "gundem",
    isFeatured: true,
    tags: ["trafik", "ulaşım"],
    hoursAgo: 3,
  },
  {
    title: "Üniversitede inovasyon günleri başladı",
    slug: "universitede-inovasyon-gunleri",
    excerpt: "Öğrenci ekipleri 48 saatlik hackathon ve demoda fikirlerini sergiliyor.",
    content:
      "<p>Kampüste bu yıl üçüncüsü düzenlenen inovasyon günleri yoğun katılımla açıldı. Finale kalan projeler arasında tarım teknolojileri ve afet iletişimi çözümleri öne çıkıyor.</p>",
    categorySlug: "gundem",
    tags: ["eğitim", "inovasyon"],
    hoursAgo: 6,
  },
  {
    title: "Derbi öncesi antrenmanlar yoğun tempoda devam ediyor",
    slug: "derbi-oncesi-antrenmanlar-yogun-tempoda",
    excerpt: "İki büyük takım, hafta sonu oynanacak maç için kamplarını tamamladı.",
    content:
      "<p>Takımlar derbi hazırlıklarını kamuya kapalı şekilde sürdürdü. Teknik ekipler forma adayları hakkında net bir açıklama yapmazken, taraftarlar bilet satışlarının rekor seviyeye ulaştığını duyurdu.</p><p>Güvenlik birimleri de stadyum çevresinde geniş önlem planı açıkladı.</p>",
    categorySlug: "spor",
    isFeatured: true,
    isBreaking: true,
    tags: ["futbol", "derbi"],
    hoursAgo: 2,
  },
  {
    title: "Basketbol liginde play-off tablosu netleşti",
    slug: "basketbol-liginde-play-off-tablosu",
    excerpt: "Son hafta sonuçları sonrası sıralama hareketlendi, kritik eşleşmeler belli oldu.",
    content:
      "<p>Sezonun en çekişmeli haftalarından biri geride kaldı. Üst sıradaki dört takım avantajlı seribaşı hakkı kazandı.</p>",
    categorySlug: "spor",
    isFeatured: true,
    tags: ["basketbol", "lig"],
    hoursAgo: 5,
  },
  {
    title: "Genç atletler bölge şampiyonasında madalya topladı",
    slug: "genc-atletler-bolge-sampiyonasi",
    excerpt: "Yerel kulüpler, kısa mesafe ve atlama branşlarında birinciliklere imza attı.",
    content:
      "<p>Antrenörler, altyapı yatırımlarının sonuç vermeye başladığını söyledi. Bir sonraki hedef ulusal elemeler olarak açıklandı.</p>",
    categorySlug: "spor",
    tags: ["atletizm"],
    hoursAgo: 12,
  },
  {
    title: "Merkez bankası faiz kararını açıkladı",
    slug: "merkez-bankasi-faiz-kararini-acikladi",
    excerpt: "Piyasaların yakından izlediği faiz kararı beklentilerle uyumlu geldi.",
    content:
      "<p>Para politikası kurulu, politika faizini sabit tuttu. Açıklamada enflasyon görünümünün yakından izlendiği ve gerekli adımların zamanında atılacağı vurgulandı.</p><p>Analistler, kararın döviz ve borsada sınırlı etki yarattığını belirtti.</p>",
    categorySlug: "ekonomi",
    isFeatured: true,
    isBreaking: true,
    tags: ["faiz", "piyasa"],
    hoursAgo: 4,
    sourceAgency: "AA",
  },
  {
    title: "Esnaf destek paketinin detayları paylaşıldı",
    slug: "esnaf-destek-paketinin-detaylari",
    excerpt: "Kredi garantisi ve vergi ertelemesi başlıkları paket kapsamına alındı.",
    content:
      "<p>Küçük işletmeler için hazırlanan paket, başvuru süreçlerini dijital portala taşıyor. İlk etapta esnaf odaları üzerinden bilgilendirme yapılacak.</p>",
    categorySlug: "ekonomi",
    tags: ["esnaf", "kredi"],
    hoursAgo: 8,
  },
  {
    title: "Konut fiyatlarında yaz dönemi dengelenmesi",
    slug: "konut-fiyatlarinda-yaz-donemi",
    excerpt: "Satışlar yavaşlarken kiralık ilanlarında arz artışı gözleniyor.",
    content:
      "<p>Emlak ofisleri, talep baskısının bir miktar gevşediğini bildiriyor. Uzmanlar, faiz görünümünün fiyat oluşumunda belirleyici olmaya devam edeceğini söyledi.</p>",
    categorySlug: "ekonomi",
    isFeatured: true,
    tags: ["konut", "emlak"],
    hoursAgo: 15,
  },
  {
    title: "Uluslararası zirvede iklim maddesi imzalandı",
    slug: "uluslararasi-zirvede-iklim-maddesi",
    excerpt: "Ülkeler, emisyon azaltım hedeflerini güncelleyen yeni çerçeveyi kabul etti.",
    content:
      "<p>Zirve sonuç bildirgesinde iklim finansmanı ve teknoloji transferi maddeleri öne çıktı. Gözlemciler, uygulamada taahhütlerin takibinin kritik olacağını belirtti.</p>",
    categorySlug: "dunya",
    isFeatured: true,
    tags: ["iklim", "diplomasi"],
    hoursAgo: 7,
    sourceAgency: "DHA",
  },
  {
    title: "Sınır ötesi ticaret koridorunda yeni hat açıldı",
    slug: "sinir-otesi-ticaret-koridoru",
    excerpt: "Lojistik sürelerini kısaltmayı hedefleyen hat ilk seferini gerçekleştirdi.",
    content:
      "<p>Yetkililer, demiryolu ve karayolu entegrasyonunun ihracatçı firmalara rekabet avantajı sağlayacağını ifade etti.</p>",
    categorySlug: "dunya",
    isBreaking: true,
    tags: ["ticaret", "lojistik"],
    hoursAgo: 9,
    sourceAgency: "İHA",
  },
  {
    title: "Göç politikaları zirvesi sonuç bildirgesi yayımlandı",
    slug: "goc-politikalari-zirvesi",
    excerpt: "Ortak koordinasyon ve insan hakları standartları metinde ayrı başlıklar halinde yer aldı.",
    content:
      "<p>Katılımcı ülkeler, acil durum mekanizmasını güçlendirme ve veri paylaşımını artırma sözü verdi.</p>",
    categorySlug: "dunya",
    tags: ["goc", "politika"],
    hoursAgo: 20,
    sourceAgency: "AA",
  },
  {
    title: "Yapay zeka destekli haber özetleme araçları gündemde",
    slug: "yapay-zeka-destekli-haber-ozetleme",
    excerpt: "Editörler, üretken yapay zeka araçlarının redaksiyon sürecine etkisini tartışıyor.",
    content:
      "<p>Medya kuruluşları, hızlı doğruluk denetimi ve özetleme için yapay zeka araçlarını deniyor. Uzmanlar, insan denetiminin vazgeçilmez olduğunu hatırlattı.</p>",
    categorySlug: "teknoloji",
    isFeatured: true,
    tags: ["yapay-zeka", "medya"],
    hoursAgo: 5,
  },
  {
    title: "Yerel girişim elektronik atığı geri dönüşüme dönüştürüyor",
    slug: "elektronik-atik-geri-donusum",
    excerpt: "Toplanan cihazlar sökülüp yeniden değerlendirilirken istihdam da artıyor.",
    content:
      "<p>Proje, belediye ve teknokent iş birliğiyle genişletilecek. Hedef yıllık 400 ton elektronik atığı dönüştürmek.</p>",
    categorySlug: "teknoloji",
    tags: ["geri-dönüşüm", "startup"],
    hoursAgo: 11,
  },
  {
    title: "5G kapsamı sanayi bölgesine uzandı",
    slug: "5g-kapsami-sanayi-bolgesi",
    excerpt: "Operatör yatırımları üretim hatlarında düşük gecikmeli iletişim vadediyor.",
    content:
      "<p>Fabrikalar, uzaktan bakım ve sensör telemetrisi senaryolarını test etmeye başladı.</p>",
    categorySlug: "teknoloji",
    isFeatured: true,
    isBreaking: true,
    tags: ["5g", "sanayi"],
    hoursAgo: 14,
  },
  {
    title: "Mevsimsel hastalıklar için erken uyarı",
    slug: "mevsimsel-hastaliklar-icin-erken-uyari",
    excerpt: "Sağlık yetkilileri grip ve soğuk algınlığı vakalarında artışa karşı uyardı.",
    content:
      "<p>Uzmanlar el hijyeni, havalandırma ve risk grubu aşılarını önerdi. Yoğun bakım doluluk oranlarının şimdilik stabil olduğu bildirildi.</p>",
    categorySlug: "saglik",
    isFeatured: true,
    tags: ["sağlık", "grip"],
    hoursAgo: 6,
  },
  {
    title: "Yürüyüş ve bisiklet parkurları sağlıklı yaşamı teşvik ediyor",
    slug: "yuruyus-ve-bisiklet-parkurlari",
    excerpt: "Açık alan kullanımı artarken belediye yeni güzergâhlar için etüt yaptırıyor.",
    content:
      "<p>Halk sağlığı ekipleri, düzenli hareketin kronik hastalık riskini azaltabileceğini hatırlattı.</p>",
    categorySlug: "saglik",
    tags: ["spor", "yaşam"],
    hoursAgo: 16,
  },
  {
    title: "Aile hekimliği randevu sisteminde yeni randevu dilimleri",
    slug: "aile-hekimligi-randevu-sistemi",
    excerpt: "Yoğun saatlerin rahatlatılması için akşam dilimleri devreye alındı.",
    content:
      "<p>Uygulama iki aylık pilot süreçle izlenecek. Vatandaş geribildirimleri panel üzerinden toplanacak.</p>",
    categorySlug: "saglik",
    isBreaking: true,
    tags: ["randevu", "aile-hekimligi"],
    hoursAgo: 10,
    sourceAgency: "Haber Merkezi",
  },
];

async function main() {
  console.log("Seed başlıyor...");

  await prisma.comment.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.author.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const password = await hash("Admin123!", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Site Yöneticisi",
      email: "admin@yenihaber.local",
      password,
      role: "ADMIN",
      slug: "site-yoneticisi",
      title: "Yönetici",
    },
  });

  const editor = await prisma.user.create({
    data: {
      name: "Baş Editör",
      email: "editor@yenihaber.local",
      password: await hash("Editor123!", 10),
      role: "EDITOR",
      slug: "bas-editor",
      title: "Haber Merkezi",
      isColumnist: false,
    },
  });

  const editorAuthor = await prisma.author.create({
    data: {
      userId: editor.id,
      displayName: editor.name,
      slug: editor.slug ?? "bas-editor",
      title: editor.title,
      status: "yayinda",
    },
  });

  const columnistAuthors = [];
  for (const c of columnists) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        password: await hash("Yazar123!", 10),
        role: "YAZAR",
        slug: c.slug,
        title: c.title,
        bio: c.bio,
        avatarUrl: `https://i.pravatar.cc/400?u=${c.avatarSeed}`,
        twitterUrl: `https://x.com/${c.slug.replace(/-/g, "")}`,
        isColumnist: true,
        columnistOrder: c.columnistOrder,
      },
    });
    columnistAuthors.push(
      await prisma.author.create({
        data: {
          userId: user.id,
          displayName: c.name,
          slug: c.slug,
          title: c.title,
          bio: c.bio,
          photoUrl: `https://i.pravatar.cc/400?u=${c.avatarSeed}`,
          twitterUrl: `https://x.com/${c.slug.replace(/-/g, "")}`,
          isColumnist: true,
          columnistOrder: c.columnistOrder,
          status: "yayinda",
        },
      }),
    );
  }

  const createdCategories = [];
  for (const cat of categories) {
    createdCategories.push(await prisma.category.create({ data: cat }));
  }

  const allArticles = [...sampleArticles, ...columnPieces];
  const createdArticles = [];
  let featuredCounter = 0;
  let sideCounter = 0;

  for (const item of allArticles) {
    const category = createdCategories.find((c) => c.slug === item.categorySlug);
    if (!category) continue;

    const columnist = item.authorSlug
      ? columnistAuthors.find((a) => a.slug === item.authorSlug)
      : null;
    const authorId = columnist?.id ?? editorAuthor.id;

    const publishedAt = new Date(Date.now() - (item.hoursAgo ?? 1) * 60 * 60 * 1000);
    const isFeatured = item.isFeatured ?? false;

    if (isFeatured) featuredCounter += 1;

    const article = await prisma.article.create({
      data: {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        coverImage: `https://picsum.photos/seed/${item.slug}/1200/675`,
        status: "YAYINDA",
        isBreaking: item.isBreaking ?? false,
        isFeatured,
        mansetOrder: isFeatured ? featuredCounter : 0,
        isSideManset: false,
        sideOrder: 0,
        sourceAgency: item.sourceAgency ?? null,
        publishedAt,
        categoryId: category.id,
        authorId,
        metaTitle: item.title,
        metaDescription: item.excerpt,
      },
    });
    createdArticles.push(article);

    for (const tagName of item.tags) {
      const slug = tagName
        .toLocaleLowerCase("tr-TR")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name: tagName },
        create: { name: tagName, slug },
      });
      await prisma.articleTag.create({
        data: { articleId: article.id, tagId: tag.id },
      });
    }
  }

  const sideCandidates = createdArticles.filter((a) => !a.isFeatured).slice(0, 6);
  for (const [index, article] of sideCandidates.entries()) {
    await prisma.article.update({
      where: { id: article.id },
      data: { isSideManset: true, sideOrder: index + 1 },
    });
    sideCounter += 1;
  }

  await prisma.setting.createMany({
    data: [
      { key: "siteName", value: "Yenihaber" },
      { key: "siteTagline", value: "Güncel haberler, son dakika ve yerel gündem" },
      { key: "contactEmail", value: "iletisim@yenihaber.local" },
      { key: "liveYouTubeUrl", value: "" },
      { key: "mansetMainLimit", value: "12" },
      { key: "mansetSideLimit", value: "6" },
      { key: "mansetAutoplay", value: "true" },
      { key: "mansetAutoplaySec", value: "6" },
      { key: "mansetSideAutoplaySec", value: "7" },
    ],
  });

  console.log("Seed tamamlandı.");
  console.log(`${allArticles.length} haber yüklendi.`);
  console.log(`${columnists.length} köşe yazarı eklendi.`);
  console.log(`Ana manşet: ${featuredCounter}, Yan manşet: ${sideCounter}`);
  console.log(`Admin e-posta: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
