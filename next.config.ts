import type { NextConfig } from "next";

const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:8000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/spin",
        destination: `${backend}/api/spin`,
      },
      {
        source: "/api/status",
        destination: `${backend}/api/status`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${backend}/api/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
