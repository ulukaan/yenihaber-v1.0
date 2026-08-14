import type { NextConfig } from "next";

/** Canlı JS'e 127.0.0.1:4000 gömülmesin */
process.env.NEXT_PUBLIC_API_URL = "/api/v1";

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
    "nodemailer",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
