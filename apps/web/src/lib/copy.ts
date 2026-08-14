/**
 * Site UI metinleri — buton/link etiketleri tek yerden.
 */
export const Copy = {
  seeAll: "Tümü",
  continueStory: "Devamını gör",
  home: "Ana sayfa",
  login: "Giriş",
  membership: "Üyelik",
  accountMenu: "Hesap menüsü",
  saveCookies: "Tercihleri kaydet",
  acceptAllCookies: "Tüm Çerezleri Kabul Et",
  cookieSettings: "Çerez Ayarlarına Git",
} as const;

export type CopyKey = keyof typeof Copy;
