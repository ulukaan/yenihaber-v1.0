import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));
/** Windows'ta standalone symlink EPERM; Hostinger Linux'ta açılır */
const standalone =
  process.platform !== "win32" || process.env.FORCE_STANDALONE === "1";

const nextConfig: NextConfig = {
  ...(standalone
    ? {
        output: "standalone" as const,
        outputFileTracingRoot: path.join(configDir, "../.."),
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    "@yenihaber/ui",
    "@yenihaber/api-client",
    "@yenihaber/database",
    "@yenihaber/shared",
    "@yenihaber/config",
  ],
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "bcryptjs",
    "jose",
    "hono",
    "dotenv",
    "nodemailer",
    "zod",
    "@hono/node-server",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
