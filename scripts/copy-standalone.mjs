import { cpSync, existsSync, globSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps/web");
const standalone = join(web, ".next/standalone");

if (!existsSync(standalone)) {
  console.warn("copy-standalone: .next/standalone yok, atlandı");
  process.exit(0);
}

/**
 * Next.js standalone çıktısı, outputFileTracingRoot monorepo köküne
 * ayarlıyken orijinal dosya yapısını (apps/web/...) koruyarak üretiyor;
 * gerçek server.js standalone/apps/web/server.js'de oluyor. Hostinger'ın
 * kendi Next.js çalıştırma mekanizması ise düz standalone/server.js
 * bekliyor (başlangıç komutu ayarı hiç yok) — içeriği bir üst seviyeye
 * taşıyarak ikisiyle de uyumlu hale getiriyoruz.
 */
const nested = join(standalone, "apps/web");
if (existsSync(join(nested, "server.js"))) {
  cpSync(nested, standalone, { recursive: true });
}
const dest = standalone;

const staticSrc = join(web, ".next/static");
const staticDest = join(dest, ".next/static");
if (existsSync(staticSrc)) {
  mkdirSync(dirname(staticDest), { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
}

const publicSrc = join(web, "public");
const publicDest = join(dest, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
}

/**
 * Prisma generated client (native query engine dahil) pnpm'in derin
 * .pnpm store yolunda yaşıyor; taşınan standalone server.js oradan
 * @prisma/client'ı bulsa da, kendi içindeki mutlak engine yolu bulunamaz
 * hale gelebiliyor. Prisma'nın da aradığı standalone/.prisma/client'a
 * kopyalayarak garantiye alıyoruz.
 */
const prismaClientDirs = globSync(
  join(root, "node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client"),
);
if (prismaClientDirs.length > 0) {
  const prismaDest = join(dest, ".prisma/client");
  mkdirSync(prismaDest, { recursive: true });
  cpSync(prismaClientDirs[0], prismaDest, { recursive: true });
  console.log(`prisma client → ${prismaDest}`);
}

console.log(`copy-standalone → ${dest}`);

/**
 * Bazı host panelleri (Hostinger dahil) build çıktısını repo kökünde
 * ".next" varsayar. Gerçek çıktı apps/web/.next'te — kökte bir sembolik
 * bağlantı bırakarak panel ayarından bağımsız hale getiriyoruz.
 */
const rootNext = join(root, ".next");
try {
  rmSync(rootNext, { recursive: true, force: true });
  symlinkSync(join(web, ".next"), rootNext, "dir");
  console.log(`root .next bağlantısı → ${join(web, ".next")}`);
} catch (e) {
  console.warn(
    "root .next bağlantısı oluşturulamadı, atlandı:",
    e instanceof Error ? e.message : e,
  );
}
