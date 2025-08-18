"use client";

import { useAutoLogin } from "../(auth)/hooks/useAutoLogin";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 인증 가드 컴포넌트
 * 자동 로그인을 처리하고 필요시 리다이렉트를 수행합니다.
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isChecking, isLoggedIn } = useAutoLogin();
  const pathname = usePathname();
  const router = useRouter();

  // 인증이 필요한 페이지들
  const protectedRoutes = ["/server-connect", "/servers"];

  // 인증된 사용자가 접근하면 안 되는 페이지들 (로그인, 회원가입)
  const authRoutes = ["/login", "/register"];

  useEffect(() => {
    if (!isChecking) {
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );
      const isAuthRoute = authRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute && !isLoggedIn) {
        // 보호된 페이지인데 로그인하지 않은 경우
        console.log(
          "🚫 인증이 필요한 페이지입니다. 로그인 페이지로 이동합니다."
        );
        router.push("/login");
      } else if (isAuthRoute && isLoggedIn) {
        // 이미 로그인한 사용자가 로그인/회원가입 페이지에 접근한 경우
        console.log(
          "✅ 이미 로그인된 상태입니다. 서버 연결 페이지로 이동합니다."
        );
        router.push("/server-connect");
      }
    }
  }, [isChecking, isLoggedIn, pathname, router]);

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
