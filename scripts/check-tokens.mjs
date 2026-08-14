#!/usr/bin/env node
/**
 * Ham hex yasağı: apps/**/*.{tsx,ts,css,module.css} içinde
 * #RRGGBB yalnız yorum/string dışında bulunmamalı.
 * İstisna: packages/ui/src/theme.css (tek renk kaynağı).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TARGETS = ["apps/web/src", "apps/admin/src"];
const HEX = /#[0-9a-fA-F]{6}\b/g;
/** bilinen allow — data URI yok; white/black minimal izin yok */
const ALLOW_FILES = new Set([
  // ileride gerekirse
]);

let hits = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(name) && !name.endsWith(".d.ts")) {
      scan(p);
    }
  }
}

function scan(file) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (ALLOW_FILES.has(rel)) return;
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    // yorum satırlarını atla (kaba)
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      return;
    }
    const m = line.match(HEX);
    if (!m) return;
    // #ffffff #000000 geçici tolerans — anlık siyah/beyaz UI
    const bad = m.filter(
      (h) =>
        !/^#(fff|ffffff|000|000000)$/i.test(h) &&
        !/^#(111|eee|ddd|ccc|999|888|666)$/i.test(h),
    );
    // sıkı: tüm 6 haneli hex'i raporla (beyaz/siyah + basit greys hariç rapor amaçlı tüm #xxxxxx)
    for (const h of m) {
      if (/^#(ffffff|000000|fff|000)$/i.test(h)) continue;
      // griler izinli değil — rapor
      console.error(`${rel}:${i + 1}: ${h}  →  ${line.trim().slice(0, 120)}`);
      hits += 1;
    }
  });
}

for (const t of TARGETS) {
  const abs = join(ROOT, t);
  try {
    walk(abs);
  } catch {
    /* missing */
  }
}

if (hits > 0) {
  console.error(`\ncheck:tokens — ${hits} ham hex. Renkler yalnızca packages/ui/src/theme.css içinde olmalı.`);
  process.exit(1);
}

console.log("check:tokens — OK (apps içinde ham hex yok / tolere-edildi: pure black/white)");
