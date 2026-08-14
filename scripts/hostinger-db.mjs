/**
 * Hostinger derlemesinde şemayı MySQL’e basar. DATABASE_URL yoksa atlar.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pnpm = join(root, "node_modules/pnpm/bin/pnpm.cjs");

function isHostingerRuntime() {
  const home = `${process.env.HOME ?? ""} ${process.env.PWD ?? ""} ${process.cwd()}`;
  return /u\d{6,}|hostingersite|hpanel/i.test(home);
}

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url.startsWith("mysql://")) {
  console.log("hostinger-db: DATABASE_URL yok, db push atlandı");
  process.exit(0);
}

if (isHostingerRuntime()) {
  process.env.DATABASE_URL = url.replace(
    /@[^/@:]+\.hstgr\.io(?=:\d+)/i,
    "@localhost",
  );
}

if (!existsSync(pnpm)) {
  console.warn("hostinger-db: pnpm yok, db push atlandı");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [pnpm, "--filter", "@yenihaber/database", "push", "--accept-data-loss"],
  { cwd: root, env: process.env, stdio: "inherit" },
);

if (result.status !== 0) {
  console.warn("hostinger-db: db push başarısız, derleme devam ediyor");
}
