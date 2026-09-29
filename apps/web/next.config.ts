import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pc-booking/shared"],
  async rewrites() {
    const target = (
      process.env.API_PROXY_TARGET ??
      (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")
    ).replace(/\/$/, "");
    return target
      ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
