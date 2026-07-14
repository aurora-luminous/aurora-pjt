import type { NextConfig } from "next";

// NODE_ENV는 .env 없이도 Next.js가 자동 설정
// npm run dev  → "development"
// npm start    → "production" (Dockerfile: ENV NODE_ENV=production)
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 스프링 서버 (8080)
      {
        source: "/api/jv/:path*",
        destination: isProd
          ? "http://backend-sp:8080/api/jv/:path*"  // 배포: Docker 내부 통신
          : "http://localhost:8080/api/jv/:path*",   // 로컬 개발
      },
      // Express 서버 (3001)
      {
        source: "/api/ex/:path*",
        destination: isProd
          ? "http://backend-ex:3001/api/ex/:path*"  // 배포: Docker 내부 통신
          : "http://localhost:3001/api/ex/:path*",   // 로컬 개발
      },
      // 웹소켓
      {
        source: "/ws/:path*",
        destination: isProd
          ? "http://backend-sp:8080/ws/:path*"      // 배포: Docker 내부 통신
          : "http://localhost:8080/ws/:path*",       // 로컬 개발
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

