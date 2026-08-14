/** 81 il — Aladhan sorgu adı (Latin) + görünen ad */

export type CityDef = {
  slug: string;
  name: string;
  query: string;
};

export const TURKEY_CITIES: CityDef[] = [
  { slug: "adana", name: "Adana", query: "Adana" },
  { slug: "adiyaman", name: "Adıyaman", query: "Adiyaman" },
  { slug: "afyonkarahisar", name: "Afyonkarahisar", query: "Afyonkarahisar" },
  { slug: "agri", name: "Ağrı", query: "Agri" },
  { slug: "aksaray", name: "Aksaray", query: "Aksaray" },
  { slug: "amasya", name: "Amasya", query: "Amasya" },
  { slug: "ankara", name: "Ankara", query: "Ankara" },
  { slug: "antalya", name: "Antalya", query: "Antalya" },
  { slug: "ardahan", name: "Ardahan", query: "Ardahan" },
  { slug: "artvin", name: "Artvin", query: "Artvin" },
  { slug: "aydin", name: "Aydın", query: "Aydin" },
  { slug: "balikesir", name: "Balıkesir", query: "Balikesir" },
  { slug: "bartin", name: "Bartın", query: "Bartin" },
  { slug: "batman", name: "Batman", query: "Batman" },
  { slug: "bayburt", name: "Bayburt", query: "Bayburt" },
  { slug: "bilecik", name: "Bilecik", query: "Bilecik" },
  { slug: "bingol", name: "Bingöl", query: "Bingol" },
  { slug: "bitlis", name: "Bitlis", query: "Bitlis" },
  { slug: "bolu", name: "Bolu", query: "Bolu" },
  { slug: "burdur", name: "Burdur", query: "Burdur" },
  { slug: "bursa", name: "Bursa", query: "Bursa" },
  { slug: "canakkale", name: "Çanakkale", query: "Canakkale" },
  { slug: "cankiri", name: "Çankırı", query: "Cankiri" },
  { slug: "corum", name: "Çorum", query: "Corum" },
  { slug: "denizli", name: "Denizli", query: "Denizli" },
  { slug: "diyarbakir", name: "Diyarbakır", query: "Diyarbakir" },
  { slug: "duzce", name: "Düzce", query: "Duzce" },
  { slug: "edirne", name: "Edirne", query: "Edirne" },
  { slug: "elazig", name: "Elazığ", query: "Elazig" },
  { slug: "erzincan", name: "Erzincan", query: "Erzincan" },
  { slug: "erzurum", name: "Erzurum", query: "Erzurum" },
  { slug: "eskisehir", name: "Eskişehir", query: "Eskisehir" },
  { slug: "gaziantep", name: "Gaziantep", query: "Gaziantep" },
  { slug: "giresun", name: "Giresun", query: "Giresun" },
  { slug: "gumushane", name: "Gümüşhane", query: "Gumushane" },
  { slug: "hakkari", name: "Hakkâri", query: "Hakkari" },
  { slug: "hatay", name: "Hatay", query: "Hatay" },
  { slug: "igdir", name: "Iğdır", query: "Igdir" },
  { slug: "isparta", name: "Isparta", query: "Isparta" },
  { slug: "istanbul", name: "İstanbul", query: "Istanbul" },
  { slug: "izmir", name: "İzmir", query: "Izmir" },
  { slug: "kahramanmaras", name: "Kahramanmaraş", query: "Kahramanmaras" },
  { slug: "karabuk", name: "Karabük", query: "Karabuk" },
  { slug: "karaman", name: "Karaman", query: "Karaman" },
  { slug: "kars", name: "Kars", query: "Kars" },
  { slug: "kastamonu", name: "Kastamonu", query: "Kastamonu" },
  { slug: "kayseri", name: "Kayseri", query: "Kayseri" },
  { slug: "kilis", name: "Kilis", query: "Kilis" },
  { slug: "kirikkale", name: "Kırıkkale", query: "Kirikkale" },
  { slug: "kirklareli", name: "Kırklareli", query: "Kirklareli" },
  { slug: "kirsehir", name: "Kırşehir", query: "Kirsehir" },
  { slug: "kocaeli", name: "Kocaeli", query: "Kocaeli" },
  { slug: "konya", name: "Konya", query: "Konya" },
  { slug: "kutahya", name: "Kütahya", query: "Kutahya" },
  { slug: "malatya", name: "Malatya", query: "Malatya" },
  { slug: "manisa", name: "Manisa", query: "Manisa" },
  { slug: "mardin", name: "Mardin", query: "Mardin" },
  { slug: "mersin", name: "Mersin", query: "Mersin" },
  { slug: "mugla", name: "Muğla", query: "Mugla" },
  { slug: "mus", name: "Muş", query: "Mus" },
  { slug: "nevsehir", name: "Nevşehir", query: "Nevsehir" },
  { slug: "nigde", name: "Niğde", query: "Nigde" },
  { slug: "ordu", name: "Ordu", query: "Ordu" },
  { slug: "osmaniye", name: "Osmaniye", query: "Osmaniye" },
  { slug: "rize", name: "Rize", query: "Rize" },
  { slug: "sakarya", name: "Sakarya", query: "Sakarya" },
  { slug: "samsun", name: "Samsun", query: "Samsun" },
  { slug: "sanliurfa", name: "Şanlıurfa", query: "Sanliurfa" },
  { slug: "siirt", name: "Siirt", query: "Siirt" },
  { slug: "sinop", name: "Sinop", query: "Sinop" },
  { slug: "sirnak", name: "Şırnak", query: "Sirnak" },
  { slug: "sivas", name: "Sivas", query: "Sivas" },
  { slug: "tekirdag", name: "Tekirdağ", query: "Tekirdag" },
  { slug: "tokat", name: "Tokat", query: "Tokat" },
  { slug: "trabzon", name: "Trabzon", query: "Trabzon" },
  { slug: "tunceli", name: "Tunceli", query: "Tunceli" },
  { slug: "usak", name: "Uşak", query: "Usak" },
  { slug: "van", name: "Van", query: "Van" },
  { slug: "yalova", name: "Yalova", query: "Yalova" },
  { slug: "yozgat", name: "Yozgat", query: "Yozgat" },
  { slug: "zonguldak", name: "Zonguldak", query: "Zonguldak" },
];

export const DEFAULT_CITY_SLUG = "duzce";

export function findCity(slug?: string | null): CityDef {
  const s = (slug ?? DEFAULT_CITY_SLUG).toLocaleLowerCase("tr-TR").trim();
  return (
    TURKEY_CITIES.find((c) => c.slug === s) ??
    TURKEY_CITIES.find((c) => c.slug === DEFAULT_CITY_SLUG)!
  );
}