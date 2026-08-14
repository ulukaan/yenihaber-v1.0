import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

/** SQLite (yerel) veya MySQL (Hostinger) */
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:")) return url;
  const raw = url.slice("file:".length);
  if (raw.startsWith("/") || /^[A-Za-z]:/.test(raw)) return url;
  return `file:${resolve(root, "data/yenihaber.db")}`;
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
