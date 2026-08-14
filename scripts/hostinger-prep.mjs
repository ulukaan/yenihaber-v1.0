import { chmodSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Hostinger'da esbuild ikilisi EACCES alır; +x verir.
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
    const isEsbuildBin =
      (name === "esbuild" || name === "esbuild.exe") &&
      (full.includes(`${join("esbuild", "bin")}`) || full.includes(`${join(".bin")}`));
    if (isEsbuildBin) {
      try {
        chmodSync(full, 0o755);
      } catch {
        /* izin yoksa Next derlemesi düşer */
      }
    }
  }
}

walk(join(process.cwd(), "node_modules"));
