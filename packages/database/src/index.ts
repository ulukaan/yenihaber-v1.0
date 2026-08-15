import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

function isHostingerRuntime(): boolean {
  const home = `${process.env.HOME ?? ""} ${process.env.PWD ?? ""} ${process.cwd()}`;
  return /u\d{6,}|hostingersite|hpanel/i.test(home);
}

function rewriteMysqlHostForRuntime(url: string): string {
  if (!url.startsWith("mysql://")) return url;
  if (!isHostingerRuntime()) return url;
  return url.replace(/@[^/@:]+\.hstgr\.io(?=:\d+)/i, "@localhost");
}

/** Paylaşımlı hosting'de hesap genelinde max_user_connections düşük olabilir */
function withConnectionLimit(url: string): string {
  if (!url.startsWith("mysql://")) return url;
  if (/connection_limit=/i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=5`;
}

function fromMysqlParts(env: NodeJS.ProcessEnv): string {
  const user = env.MYSQL_USER ?? env.DB_USER;
  const pass = env.MYSQL_PASSWORD ?? env.DB_PASSWORD;
  const db = env.MYSQL_DATABASE ?? env.DB_NAME;
  if (!user || !pass || !db) return "";
  const host = isHostingerRuntime()
    ? "localhost"
    : (env.MYSQL_HOST ?? env.DB_HOST ?? "localhost");
  const port = env.MYSQL_PORT ?? env.DB_PORT ?? "3306";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

/** Hostinger MySQL: sunucuda localhost, yerelde srv*.hstgr.io */
function resolveDatabaseUrl(): string {
  const raw = (process.env.DATABASE_URL ?? fromMysqlParts(process.env)).trim();
  if (!raw) return raw;
  if (raw.startsWith("file:")) {
    const file = raw.slice("file:".length);
    if (file.startsWith("/") || /^[A-Za-z]:/.test(file)) return raw;
    return `file:${resolve(root, "data/yenihaber.db")}`;
  }
  return withConnectionLimit(rewriteMysqlHostForRuntime(raw));
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export * from "@prisma/client";
