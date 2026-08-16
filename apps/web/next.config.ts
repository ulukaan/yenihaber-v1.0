import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === "1";
/** Windows'ta standalone symlink EPERM; Vercel kendi tracing'ini yönetir */
const standalone =
  !isVercel &&
  (process.platform !== "win32" || process.env.FORCE_STANDALONE === "1");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(configDir, "../.."),
  ...(standalone ? { output: "standalone" as const } : {}),
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
