# Yenihaber

Tam bileşen tabanlı haber sitesi monorepo’su. **Web**, **Admin** ve **API** ayrı uygulamalar; tekrarlayan kod `packages/` altında ortaktır.

Sürüm: **1.1.2** — ayrıntı `CHANGELOG.md`.

Kaynak referanslar (yerel):

- Tasarım/tema rengi: `birhaber` WordPress teması (`theme_color: #e74c3c` → marka accent `#EF233C`)
- Domain modeli: `projec/haber` Prisma şeması
- Monorepo mimarisi: `admin-panelim-v0.1` (apps + packages)

## Yapı

```
apps/
  web/      → Public site  (port 3000)
  admin/    → Yönetim paneli (port 3001)
  api/      → REST API (port 4000)
packages/
  ui/         → Button, Input, Badge, Card, tema
  shared/     → Zod şemaları, tipler, slugify
  api-client/ → Ortak HTTP istemci + servisler
  database/   → Prisma schema + seed
  config/     → Marka renkleri, env loader
```

## Kurulum

```bash
pnpm install
# .env kökte (örnek: .env.example)
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Veya tek komut: `pnpm setup` ardından `pnpm dev`.

## Adresler

| Uygulama | URL |
|----------|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API health | http://localhost:4000/api/v1/health |

## Seed hesaplar

- Admin: `admin@yenihaber.local` / `Admin123!`
- Editör: `editor@yenihaber.local` / `Editor123!`

## Notlar

- Veritabanı varsayılan: SQLite (`data/yenihaber.db`)
- Web ve admin aynı `@yenihaber/api-client` servislerini kullanır
- UI bileşenleri `@yenihaber/ui` paketinde; her iki app import eder
