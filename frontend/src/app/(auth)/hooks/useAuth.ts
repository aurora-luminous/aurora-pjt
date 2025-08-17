import { useApi } from "react-easy-api";
import axiosClient from "@/app/lib/axiosClient";
import { SignUpRequest } from "../types/SignUp";
import { LoginRequest, LoginResponse } from "../types/Login";

/**
 * 인증 관련 API 호출을 처리하는 커스텀 훅
 * react-easy-api를 사용하여 API 호출을 관리합니다.
 */
export const useAuth = () => {
  // API 훅을 사용하여 각 엔드포인트별 함수 생성
  const {
    execute: signUpApi,
    loading: isSigningUp,
    error: signUpError,
  } = useApi<string, SignUpRequest>({
    endpoint: "/jv/signup",
    method: "POST",
    axiosInstance: axiosClient,
  });

  const {
    execute: loginApi,
    loading: isLoggingIn,
    error: loginError,
  } = useApi<LoginResponse, LoginRequest>({
    endpoint: "/jv/login",
    method: "POST",
    axiosInstance: axiosClient,
  });

  /**
   * 회원가입을 처리하는 함수
   */
  const signUp = async (data: SignUpRequest): Promise<string> => {
    try {
      console.log("🔐 회원가입 시작:", data);
      console.log("🔗 API URL:", process.env.NEXT_PUBLIC_API_URL);

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
  const login = async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await loginApi(data);

      // 로그인 성공 시 토큰 저장
      if (response) {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      return response || { accessToken: "", refreshToken: "" };
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      throw error;
    }
  };

  return {
    signUp,
    login,
    isSigningUp,
    isLoggingIn,
    signUpError,
    loginError,
  };
};
