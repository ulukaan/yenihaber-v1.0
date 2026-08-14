import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    "@yenihaber/api",
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
