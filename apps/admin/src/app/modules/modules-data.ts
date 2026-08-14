export type ModuleStatus = "ready" | "partial" | "planned";

export type ModuleItem = {
  name: string;
  status: ModuleStatus;
  note?: string;
  href?: string;
};

export type ModuleGroup = {
  id: string;
  title: string;
  items: ModuleItem[];
};

/**
 * Rakip CMS özellik listesi × mevcut Düzce Radikal paneli.
 * ready = kullanılabilir · partial = kısmi · planned = yok / yol haritası
 */
export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: "core",
    title: "Altyapı & paket",
    items: [
      { name: "Ücretsiz SSL", status: "ready", note: "Hosting / CDN katmanı" },
      { name: "Ücretsiz Kurulum", status: "ready", note: "pnpm setup + seed" },
      { name: "Ücretsiz Destek", status: "planned" },
      { name: "Ücretsiz İçerik Taşıma", status: "planned" },
      {
        name: "Türkçe/İngilizce",
        status: "partial",
        note: "TR öncelikli; i18n iskeleti sınırlı",
      },
      {
        name: "Responsive (Tailwind)",
        status: "partial",
        note: "Responsive var; stil CSS modules + tema",
      },
      {
        name: "Cloudflare Cache",
        status: "planned",
        note: "CDN ayarı dışarıda",
      },
      {
        name: "Progressive Web Apps",
        status: "planned",
      },
      {
        name: "Pagespeed Optimizasyon",
        status: "partial",
        note: "next/image, code-split; sürekli iyileştirme",
      },
      { name: "WebP", status: "ready", note: "Medya upload WebP kabul eder" },
    ],
  },
  {
    id: "ai",
    title: "Yapay zeka",
    items: [
      { name: "Yapay Zeka İçerik Üretimi", status: "planned" },
      { name: "Yapay Zeka İçerik Özgünleştirme", status: "planned" },
      { name: "Sesli Haber Yazabilme", status: "planned" },
      { name: "Sesli Arama", status: "planned" },
      { name: "Sesli Okuma", status: "planned" },
      { name: "Sesli Yorum", status: "planned" },
    ],
  },
  {
    id: "content",
    title: "İçerik & yayın",
    items: [
      {
        name: "Haberler",
        status: "ready",
        href: "/articles",
      },
      {
        name: "Taslak",
        status: "ready",
        note: "TASLAK / ONAYDA durumları",
        href: "/articles",
      },
      {
        name: "İleri Tarihli Haber",
        status: "ready",
        note: "ZAMANLANMIS + scheduledAt",
        href: "/articles",
      },
      {
        name: "Çöp Kutusu",
        status: "partial",
        note: "Arşiv var; soft-delete çöp kutusu yok",
      },
      {
        name: "Video Galeri",
        status: "ready",
        href: "/videos",
      },
      {
        name: "Foto Galeri",
        status: "ready",
        href: "/galleries",
      },
      {
        name: "Hikaye (Story)",
        status: "ready",
        href: "/stories",
      },
      {
        name: "Makaleler",
        status: "partial",
        note: "Haber tipi üzerinden; ayrı makale modülü yok",
        href: "/articles",
      },
      {
        name: "Biyografiler",
        status: "partial",
        note: "Yazar profilleri var",
        href: "/users?tab=authors",
      },
      {
        name: "Anketler",
        status: "ready",
        href: "/polls",
      },
      {
        name: "Gazete Arşivi",
        status: "planned",
      },
      {
        name: "Gazete Manşetleri",
        status: "planned",
      },
      {
        name: "Vefat Edenler",
        status: "partial",
        note: "Ücretli vefat ilanı",
        href: "/ilanlar",
      },
      {
        name: "Yerel Haberler",
        status: "ready",
        note: "Bölge kategorileri",
        href: "/categories/bolge",
      },
      {
        name: "Editör İçerikleri",
        status: "ready",
        href: "/articles",
      },
      {
        name: "Günün Haberleri / Manşetleri",
        status: "ready",
        href: "/manset",
      },
      {
        name: "Arşiv",
        status: "partial",
        note: "ARSIV durumu + arama",
      },
      {
        name: "Habere Özel Meta",
        status: "ready",
        note: "metaTitle / description",
      },
      {
        name: "Haberlerde İlgili İçerik",
        status: "partial",
        note: "Etiket / kategori ilişkisi",
      },
      {
        name: "Emojiler",
        status: "partial",
        note: "Tepki nabzı",
        href: "/reactions",
      },
      {
        name: "Canlı Haber Akışı",
        status: "partial",
        note: "Son dakika / manşet akışı",
        href: "/manset",
      },
      {
        name: "Kopya İçerikler",
        status: "planned",
      },
      {
        name: "İçerik Linkleri",
        status: "partial",
      },
      {
        name: "Otomatik Sayfa Yenileme",
        status: "partial",
        note: "Seçim merkezi 30sn; genel ayar yok",
      },
    ],
  },
  {
    id: "manset",
    title: "Manşet & layout",
    items: [
      {
        name: "Düzenlenebilir Manşet",
        status: "ready",
        href: "/manset",
      },
      {
        name: "Manşet Sabitleme",
        status: "ready",
        href: "/manset",
      },
      {
        name: "Manşet Reklamları",
        status: "ready",
        href: "/ads",
      },
      {
        name: "Header Seçenekleri",
        status: "partial",
        href: "/settings",
      },
      {
        name: "Footer Seçenekleri",
        status: "partial",
        href: "/settings",
      },
      {
        name: "Bileşenler (Sürükle/Bırak)",
        status: "partial",
        note: "Manşet sıralama; tam page builder yok",
        href: "/manset",
      },
      {
        name: "Tema Yönetimi",
        status: "partial",
        note: "Panel sidebar / marka renkleri",
        href: "/settings",
      },
      {
        name: "Infinity Scroll",
        status: "partial",
        note: "Kategori listelerinde sayfalama ağırlıklı",
      },
      {
        name: "Modül Yönetimi",
        status: "ready",
        note: "Bu sayfa",
        href: "/modules",
      },
    ],
  },
  {
    id: "seo",
    title: "SEO & teknik",
    items: [
      {
        name: "%100 Schema Uyumlu",
        status: "partial",
        note: "Haber / org schema kısmi",
      },
      {
        name: "Seo Skoru",
        status: "planned",
      },
      {
        name: "Özel Seo Ayarları",
        status: "partial",
        href: "/settings",
      },
      {
        name: "Sitemapler",
        status: "partial",
        note: "sitemap.ts + video-sitemap",
      },
      {
        name: "RSS’ler",
        status: "planned",
      },
      {
        name: "Robots & Ads.txt",
        status: "partial",
        note: "Dosya / ayar; panel editörü yok",
      },
      {
        name: "Robot Ayarları",
        status: "planned",
      },
      {
        name: "URL 301 Yönlendirme",
        status: "partial",
        note: "API + slug değişiminde otomatik; panel UI yok",
      },
      {
        name: "Kalıcı Bağlantı Ayarları",
        status: "partial",
      },
      {
        name: "Özel Kod Alanları",
        status: "partial",
        href: "/settings",
      },
      {
        name: "Google Search Console API",
        status: "planned",
      },
      {
        name: "Google Indexing API",
        status: "planned",
      },
      {
        name: "Google Analytics API",
        status: "partial",
        note: "Analytics sayfası iskelet",
        href: "/analytics",
      },
      {
        name: "Google Adsense API",
        status: "planned",
      },
      {
        name: "Google Recaptcha API",
        status: "planned",
      },
      {
        name: "Google Youtube API",
        status: "planned",
      },
      {
        name: "Google Trend Takip",
        status: "planned",
      },
      {
        name: "Yandex Metrica API",
        status: "planned",
      },
    ],
  },
  {
    id: "people",
    title: "Kullanıcı & üyelik",
    items: [
      {
        name: "Üyelik Sistemi",
        status: "partial",
        href: "/users",
      },
      {
        name: "Abonelik Sistemi",
        status: "planned",
      },
      {
        name: "Kullanıcı Seviye Yönetimi",
        status: "ready",
        note: "ADMIN / EDITOR / MODERATOR / MUHABIR",
        href: "/users",
      },
      {
        name: "Muhabir Yönetimi",
        status: "ready",
        href: "/users?tab=authors",
      },
      {
        name: "Çift Faktör (2FA)",
        status: "ready",
        note: "TOTP login",
      },
      {
        name: "Basın İlan Kurumu Uyumluluğu",
        status: "partial",
        href: "/reports/bik",
      },
      {
        name: "Mahreç Yönetimi",
        status: "partial",
        note: "Kaynak / fotoğrafçı alanı",
      },
      {
        name: "Mahreç Raporlama",
        status: "planned",
      },
    ],
  },
  {
    id: "engage",
    title: "Etkileşim & bildirim",
    items: [
      {
        name: "Yorum Sistemi",
        status: "ready",
        href: "/comments",
      },
      {
        name: "Bülten Sistemi",
        status: "partial",
        note: "Footer bülten + newsletter API",
        href: "/settings",
      },
      {
        name: "Whatsapp Mesaj",
        status: "partial",
        href: "/settings",
      },
      {
        name: "Whatsapp İhbar Butonu",
        status: "ready",
        href: "/kurumsal/iletisim",
      },
      {
        name: "Masaüstü WhatsApp Paylaş",
        status: "ready",
        note: "Haber / seçim paylaşımı",
      },
      {
        name: "Telegram Botu",
        status: "planned",
      },
      {
        name: "Tarayıcı Bildirimleri",
        status: "planned",
        note: "OneSignal / Bildirt yok",
      },
      {
        name: "Arama Yönetimi (Algolia)",
        status: "partial",
        note: "Yerel arama; Algolia yok",
      },
    ],
  },
  {
    id: "media-ads",
    title: "Medya & reklam",
    items: [
      {
        name: "Medya Arşivi / Ortam Kütüphanesi",
        status: "ready",
        href: "/media",
      },
      {
        name: "Reklam Yönetimi",
        status: "ready",
        href: "/ads",
      },
      {
        name: "Etiket Yönetimi",
        status: "ready",
        href: "/tags",
      },
      {
        name: "Menü Yönetimi",
        status: "ready",
        href: "/menu",
      },
    ],
  },
  {
    id: "bots",
    title: "Bot & ajans",
    items: [
      { name: "Ajans Botları", status: "planned" },
      { name: "Özel Haber Botları", status: "planned" },
    ],
  },
  {
    id: "services",
    title: "Site servisleri",
    items: [
      {
        name: "Puan Durumu & Lig Fikstürü",
        status: "ready",
        href: "/services#skor",
      },
      {
        name: "Namaz Vakitleri",
        status: "ready",
        href: "/services#namaz",
      },
      {
        name: "İmsakiye",
        status: "partial",
        note: "Namaz imsak satırı",
        href: "/services#namaz",
      },
      {
        name: "Döviz Kurları",
        status: "ready",
        href: "/services#piyasa",
      },
      {
        name: "Trafik Durumu",
        status: "planned",
      },
      {
        name: "Nöbetçi Eczaneler",
        status: "planned",
      },
      {
        name: "Günlük Burçlar",
        status: "planned",
      },
      {
        name: "Seçim Merkezi",
        status: "ready",
        note: "Liste dışı ama bizde var",
        href: "/elections",
      },
      {
        name: "Hava Durumu",
        status: "ready",
        note: "Liste dışı ama bizde var",
        href: "/services#hava",
      },
    ],
  },
];

export function countByStatus(groups: ModuleGroup[]) {
  const all = groups.flatMap((g) => g.items);
  return {
    total: all.length,
    ready: all.filter((i) => i.status === "ready").length,
    partial: all.filter((i) => i.status === "partial").length,
    planned: all.filter((i) => i.status === "planned").length,
  };
}
