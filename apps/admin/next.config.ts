import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@yenihaber/ui",
    "@yenihaber/api-client",
    "@yenihaber/shared",
    "@yenihaber/config",
  ],
};

export default nextConfig;
