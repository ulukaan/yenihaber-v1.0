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
    "@yenihaber/api",
    "@yenihaber/database",
    "@yenihaber/shared",
    "@yenihaber/config",
  ],
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "bcryptjs",
    "jose",
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
