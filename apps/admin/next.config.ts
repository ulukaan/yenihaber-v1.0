import type { NextConfig } from "next";

function apiRewriteDestination(): string {
  const raw = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim();
  if (raw && !raw.startsWith("/")) return raw.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:4000/api/v1";
  }
  return "";
}

const apiDest = apiRewriteDestination();

const nextConfig: NextConfig = {
  transpilePackages: [
    "@yenihaber/ui",
    "@yenihaber/api-client",
    "@yenihaber/shared",
    "@yenihaber/config",
  ],
  async rewrites() {
    if (!apiDest) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiDest}/:path*`,
      },
    ];
  },
};

export default nextConfig;
