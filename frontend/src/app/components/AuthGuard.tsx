"use client";

import { useAutoLogin } from "../(auth)/hooks/useAutoLogin";
import { getAccessToken } from "../lib/tokenStorage";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isChecking } = useAutoLogin();
  const pathname = usePathname();
  const router = useRouter();

  const protectedRoutes = ["/server-connect", "/servers"];
  const authRoutes = ["/login", "/register"];

  useEffect(() => {
    if (!isChecking) {
      const isLoggedIn = !!getAccessToken();

      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );
      const isAuthRoute = authRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute && !isLoggedIn) {
        router.push("/login");
      } else if (isAuthRoute && isLoggedIn) {
        router.push("/server-connect");
      }
    }
  }, [isChecking, pathname, router]);

  // 로딩 중일 때 표시할 컴포넌트
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora-blue-gradient-diagonal">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">인증 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
