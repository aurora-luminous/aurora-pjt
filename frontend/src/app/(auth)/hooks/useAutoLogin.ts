import { useEffect, useState } from "react";
import { useAuthApi } from "./useAuthApi";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "@/app/lib/tokenStorage";

/**
 * 자동 로그인을 처리하는 훅
 * 페이지 로드 시 저장된 토큰을 확인하고 유효성을 검사합니다.
 */
export const useAutoLogin = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { refreshAccessToken } = useAuthApi();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!accessToken && !refreshToken) {
          console.log("🔍 토큰이 없습니다. 로그인이 필요합니다.");
          setIsLoggedIn(false);
          return;
        }

        if (accessToken) {
          // 토큰 유효성 검사 (간단한 만료 시간 체크)
          try {
            const payload = JSON.parse(atob(accessToken.split(".")[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp > currentTime) {
              console.log("✅ 유효한 토큰이 있습니다.");
              setIsLoggedIn(true);
              return;
            } else {
              console.log("⏰ 토큰이 만료되었습니다. 갱신을 시도합니다.");
            }
          } catch (error) {
            console.log("❌ 토큰 파싱 실패, 갱신을 시도합니다.");
          }
        }

        // 토큰이 만료되었거나 없는 경우 갱신 시도
        if (refreshToken) {
          try {
            await refreshAccessToken();
            console.log("✅ 토큰 갱신 성공, 자동 로그인 완료");
            setIsLoggedIn(true);
          } catch (error) {
            console.log("❌ 토큰 갱신 실패, 로그인이 필요합니다.");
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("❌ 자동 로그인 체크 중 오류:", error);
        setIsLoggedIn(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, [refreshAccessToken]);

  /**
   * 수동 로그아웃 함수
   */
  const logout = () => {
    clearTokens();
    setIsLoggedIn(false);
    console.log("👋 로그아웃 완료");
  };

  return {
    isChecking,
    isLoggedIn,
    logout,
  };
};
