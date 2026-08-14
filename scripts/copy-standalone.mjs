import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps/web");
const standalone = join(web, ".next/standalone");

if (!existsSync(standalone)) {
  console.warn("copy-standalone: .next/standalone yok, atlandı");
  process.exit(0);
}

const nested = join(standalone, "apps/web");
const dest = existsSync(join(nested, "server.js")) ? nested : standalone;

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

console.log(`copy-standalone → ${dest}`);
