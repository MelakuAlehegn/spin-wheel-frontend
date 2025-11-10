import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/spin",
        destination: "https://spin-wheel-backend-eawf.onrender.com/api/spin",
      },
      {
        source: "/api/status",
        destination: "https://spin-wheel-backend-eawf.onrender.com/api/status",
      },
      {
        source: "/api/admin/:path*",
        destination: "https://spin-wheel-backend-eawf.onrender.com/api/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
