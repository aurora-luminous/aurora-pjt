import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 스프링 서버 (8080) - /api/spring/* 경로
      {
        source: "/api/jv/:path*",
        destination: "https://auro-ra.site/api/jv/:path*",
      },
      // Express 서버 (3001) - /api/express/* 경로
      {
        source: "/api/ex/:path*",
        destination: "https://auro-ra.site/api/ex/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
