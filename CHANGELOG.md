# Sürüm geçmişi

## 1.1.4 — 2026-08-14

Sunucu/istemci sınırı: `@yenihaber/config` kökü izomorfik (URL, palet); `node:crypto` ve JWT yalnızca `@yenihaber/config/server`. Next `serverExternalPackages` içine `nodemailer`; API paket kökü `app.ts` (HTTP sunucusu barrel’dan çıktı).

## 1.1.3 — 2026-08-14

Hostinger derlemesi: webpack `new URL(".", import.meta.url)` ifadesini modül `.` sanıyordu; dizin `dirname(fileURLToPath(...))` ile alınıyor. Yazı tipleri Google’dan indirilmiyor, repo içi `next/font/local` (Inter, Newsreader, Manrope).

## 1.1.2 — 2026-08-14

Hostinger `pnpm build` artık Turbo ikilisi kullanmıyor (EACCES).

## 1.1.1 — 2026-08-14

Hostinger derlemesi: API `.js` importları Next ile çözülsün; Prisma motorlarına +x.

## 1.1.0 — 2026-08-14

Mobil asıl iskelet ve panel sadeleştirmesi.

- Site: tam ekran yan menü, alt gezinme, kategori şeridi, yatay haber satırları
- Panel: menü önizlemesi, zemin şeritleri, 13px taban, hover ikonlar
- Mobil editör işleri: manşet, yorum onayı, son dakika bandı

## 1.0.0

İlk yayın.
