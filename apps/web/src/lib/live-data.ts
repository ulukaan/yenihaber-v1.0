/** Canlı içerik demo verileri — gerçek API ile değiştirilebilir */

export type MarketItem = {
  label: string;
  value: string;
  change: string;
  up: boolean;
};

export type LiveScore = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  league: string;
};

export type StandingRow = {
  pos: number;
  team: string;
  played: number;
  pts: number;
};

export type Fixture = {
  time: string;
  home: string;
  away: string;
  league: string;
};

export type PrayerTimes = {
  city: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
};

export type WeatherDay = {
  city: string;
  temp: number;
  feels: number;
  desc: string;
  humidity: number;
  wind: string;
};

export type FuelPrice = {
  name: string;
  price: string;
  unit: string;
};

export const marketFx: MarketItem[] = [
  { label: "USD", value: "34,12", change: "+0,18%", up: true },
  { label: "EUR", value: "36,84", change: "-0,07%", up: false },
  { label: "GBP", value: "43,21", change: "+0,22%", up: true },
];

export const marketGold: MarketItem[] = [
  { label: "Gram", value: "2.946 ₺", change: "+0,41%", up: true },
  { label: "Çeyrek", value: "4.812 ₺", change: "+0,38%", up: true },
  { label: "Ons", value: "2.318 $", change: "-0,12%", up: false },
];

export const marketBorsa: MarketItem[] = [
  { label: "BİST 100", value: "9.842", change: "+1,14%", up: true },
  { label: "BİST 30", value: "10.624", change: "+0,92%", up: true },
  { label: "USD/TRY", value: "34,12", change: "+0,18%", up: true },
];

/** Eski market şeridi uyumu */
export const marketStrip: MarketItem[] = [
  ...marketFx,
  { label: "BİST 100", value: "9.842", change: "+1,14%", up: true },
  { label: "ALTIN", value: "2.946", change: "+0,41%", up: true },
  { label: "BTC", value: "67.420 $", change: "-0,85%", up: false },
];

export const liveScores: LiveScore[] = [
  {
    league: "Süper Lig",
    home: "Galatasaray",
    away: "Fenerbahçe",
    homeScore: 1,
    awayScore: 1,
    minute: "67'",
  },
  {
    league: "Süper Lig",
    home: "Beşiktaş",
    away: "Trabzonspor",
    homeScore: 2,
    awayScore: 0,
    minute: "HT",
  },
  {
    league: "Europa League",
    home: "Ajax",
    away: "Roma",
    homeScore: 0,
    awayScore: 0,
    minute: "12'",
  },
  {
    league: "Süper Lig",
    home: "Başakşehir",
    away: "Samsunspor",
    homeScore: 1,
    awayScore: 0,
    minute: "81'",
  },
];

export const standings: StandingRow[] = [
  { pos: 1, team: "Galatasaray", played: 28, pts: 72 },
  { pos: 2, team: "Fenerbahçe", played: 28, pts: 70 },
  { pos: 3, team: "Beşiktaş", played: 28, pts: 58 },
  { pos: 4, team: "Trabzonspor", played: 28, pts: 52 },
  { pos: 5, team: "Başakşehir", played: 28, pts: 45 },
];

export const fixtures: Fixture[] = [
  { time: "19:00", home: "Antalyaspor", away: "Konyaspor", league: "Süper Lig" },
  { time: "19:00", home: "Eyüpspor", away: "Gaziantep", league: "Süper Lig" },
  { time: "21:45", home: "Sivasspor", away: "Kasımpaşa", league: "Süper Lig" },
  { time: "22:00", home: "Alanyaspor", away: "Hatayspor", league: "Süper Lig" },
];

export const prayerTimes: PrayerTimes = {
  city: "Düzce",
  imsak: "04:38",
  gunes: "06:08",
  ogle: "13:05",
  ikindi: "16:45",
  aksam: "20:14",
  yatsi: "21:38",
};

export const weather: WeatherDay = {
  city: "Düzce",
  temp: 28,
  feels: 29,
  desc: "Açık",
  humidity: 52,
  wind: "12 km/s",
};

export const fuelPrices: FuelPrice[] = [
  { name: "Benzin", price: "66,36", unit: "₺/L" },
  { name: "Motorin", price: "76,64", unit: "₺/L" },
  { name: "LPG", price: "33,64", unit: "₺/L" },
];
