import { chmodSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Hostinger: esbuild ve Prisma motorları EACCES almasın diye +x.
 * @param {string} dir
 */
function walk(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (needsExec(name, full)) {
      try {
        chmodSync(full, 0o755);
      } catch {
        /* izin yoksa derleme düşebilir */
      }
    }
  }
}

/**
 * @param {string} name
 * @param {string} full
 */
function needsExec(name, full) {
  const n = name.toLowerCase();
  if (n === "esbuild" || n === "esbuild.exe") return true;
  if (n.includes("query-engine") || n.includes("schema-engine")) return true;
  if (n.startsWith("libquery_engine")) return true;
  if (full.includes(`${join(".bin")}`) && !n.endsWith(".cmd") && !n.endsWith(".ps1")) {
    return !n.includes(".");
  }
  return false;
}

walk(join(process.cwd(), "node_modules"));
