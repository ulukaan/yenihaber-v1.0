import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@yenihaber/ui",
    "@yenihaber/api-client",
    "@yenihaber/shared",
    "@yenihaber/config",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
