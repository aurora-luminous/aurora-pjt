import { useApi } from "react-easy-api";
import { springClient } from "@/app/lib/axiosClient";
import {
  setTokens,
  getRefreshToken,
  updateAccessToken,
  clearTokens,
} from "@/app/lib/tokenStorage";
import { SignUpRequest } from "../types/SignUp";
import { LoginRequest, LoginResponse } from "../types/Login";
import { UserInfo } from "../types/UserInfo";

/**
 * 인증 관련 API 호출을 처리하는 커스텀 훅
 * react-easy-api를 사용하여 API 호출을 관리합니다.
 */
export const useAuthApi = () => {
  // API 훅을 사용하여 각 엔드포인트별 함수 생성
  const {
    execute: signUpApi,
    loading: isSigningUp,
    error: signUpError,
  } = useApi<string, SignUpRequest>({
    endpoint: "/signup",
    method: "POST",
    axiosInstance: springClient,
  });


  const {
    execute: refreshTokenApi,
    loading: isRefreshing,
    error: refreshError,
  } = useApi<{ accessToken: string }, { refreshToken: string }>({
    endpoint: "/refresh",
    method: "POST",
    axiosInstance: springClient,
  });

  const {
    execute: logoutApi,
    loading: isLoggingOut,
    error: logoutError,
  } = useApi<string, void>({
    endpoint: "/logout",
    method: "POST",
    axiosInstance: springClient,
  });

  const {
    execute: getUserInfoApi,
    loading: isGettingUserInfo,
    error: getUserInfoError,
  } = useApi<UserInfo, void>({
    endpoint: "/info",
    method: "GET",
    axiosInstance: springClient,
  });

  /**
   * 회원가입을 처리하는 함수
   */
  const signUp = async (data: SignUpRequest): Promise<string> => {
    try {
      console.log("🔐 회원가입 시작:", data);

      // react-easy-api 사용
      const response = await signUpApi(data);
      console.log("✅ 회원가입 응답:", response);

      // null 응답도 성공으로 처리 (서버에서 빈 응답을 보낼 수 있음)
      if (response === null || response === undefined) {
        console.log("✅ 회원가입 완료 (서버에서 빈 응답)");
        return "회원가입이 완료되었습니다.";
      }

      return response || "";
    } catch (error) {
      console.error("❌ 회원가입 중 오류 발생:", error);
      throw error;
    }
  };

  /**
   * 로그인을 처리하는 함수
   */
  const login = async (
    data: LoginRequest & { rememberMe?: boolean }
  ): Promise<LoginResponse> => {
    // react-easy-api(loginApi)는 에러를 내부에서 삼키고 null을 반환하기 때문에
    // 서버의 실제 에러 메시지를 잃게 됨.
    // springClient를 직접 호출하면 axios 인터셉터가 AxiosError를 그대로 throw하여
    // parseApiError에서 response.data.message를 읽을 수 있음.
    const axiosResponse = await springClient.post<LoginResponse>("/login", {
      userEmail: data.userEmail,
      password: data.password,
    });

    const response = axiosResponse.data;

    // 성공했지만 토큰이 없는 경우 (비정상 응답)
    if (!response?.accessToken) {
      throw new Error("서버 응답에 토큰이 없습니다. 관리자에게 문의하세요.");
    }

    // 로그인 성공 시 토큰 저장 (rememberMe 옵션 적용)
    setTokens(
      response.accessToken,
      response.refreshToken,
      data.rememberMe || false
    );

    return response;
  };

  /**
   * 토큰 갱신을 처리하는 함수
   */
  const refreshAccessToken = async (): Promise<string> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("Refresh token이 없습니다.");
      }

      console.log("🔄 토큰 갱신 시작");

      const response = await refreshTokenApi({ refreshToken });

      if (!response) {
        throw new Error(refreshError?.message || "토큰 갱신에 실패했습니다.");
      }

      console.log("✅ 토큰 갱신 성공");

      // 새로운 accessToken 저장 (기존 rememberMe 설정 유지)
      updateAccessToken(response.accessToken);

      return response.accessToken;
    } catch (error) {
      console.error("❌ 토큰 갱신 실패:", error);

      // 리프레시 토큰도 만료된 경우 모든 토큰 제거
      clearTokens();

      throw error;
    }
  };

  /**
   * 로그아웃을 처리하는 함수
   */
  const logout = async () => {
    try {
      await logoutApi();
      clearTokens();
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
      throw error;
    }
  };

  const getUserInfo = async (): Promise<UserInfo> => {
    try {
      const response = await getUserInfoApi();
      return response || { userName: "", userEmail: "", profileImagePath: "" };
    } catch (error) {
      console.error("❌ 사용자 정보 조회 실패:", error);
      throw error;
    }
  };

  return {
    signUp,
    login,
    refreshAccessToken,
    isSigningUp,
    isRefreshing,
    signUpError,
    refreshError,
    logout,
    isLoggingOut,
    logoutError,
    getUserInfo,
    isGettingUserInfo,
    getUserInfoError,
  };
};
