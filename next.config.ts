import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/spin",
        destination: "http://localhost:8000/api/spin",
      },
      {
        source: "/api/status",
        destination: "http://localhost:8000/api/status",
      },
      {
        source: "/api/admin/:path*",
        destination: "http://localhost:8000/api/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
