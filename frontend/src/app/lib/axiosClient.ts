import axios, { AxiosInstance } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearTokens,
} from "./tokenStorage";

const axiosClient = axios.create({
  baseURL: "/api", // Next.js 프록시 사용 - 기본은 스프링 서버
});

console.log("🔗 Using Next.js proxy: /api");

// 스프링 서버 전용 클라이언트 (인증 필요)
export const springClient = axios.create({
  baseURL: "/api/jv", // 스프링 서버로 라우팅
});

// 스프링 서버 전용 클라이언트 (인증 불필요 - 회원가입, 로그인용)
export const springAuthClient = axios.create({
  baseURL: "/api/jv", // 스프링 서버로 라우팅
});

// Express 서버 전용 클라이언트
export const expressClient = axios.create({
  baseURL: "/api", // Express 서버로 라우팅
  withCredentials: true, // 쿠키 포함 (웹소켓 인증용)
});

// 인증이 불필요한 엔드포인트 목록
const authFreeEndpoints = ["/signup", "/login"];

// 공통 인터셉터 설정 함수
const setupInterceptors = (
  client: AxiosInstance,
  serverName: string,
  skipAuth = false
) => {
  // 요청 인터셉터
  client.interceptors.request.use((config) => {
    console.log(
      `🚀 ${serverName} API 요청:`,
      config.method?.toUpperCase(),
      config.url
    );
    console.log("📦 요청 데이터:", config.data);

    // skipAuth가 false이고, 인증이 불필요한 엔드포인트가 아닌 경우에만 토큰 추가
    if (
      !skipAuth &&
      !authFreeEndpoints.some((endpoint) => config.url?.includes(endpoint))
    ) {
      // tokenStorage에서 토큰 가져오기
      const accessToken = getAccessToken();

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  });

  // 응답 인터셉터 (자동 토큰 갱신 포함)
  client.interceptors.response.use(
    (response) => {
      console.log(
        `✅ ${serverName} API 응답 성공:`,
        response.status,
        response.config.url
      );
      console.log("📦 응답 데이터:", response.data);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      console.error(
        `❌ ${serverName} API 응답 에러:`,
        error.response?.status,
        error.config?.url
      );
      console.error("📦 에러 데이터:", error.response?.data);

      // 401 에러이고 아직 재시도하지 않은 경우 (skipAuth가 false인 경우만)
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !skipAuth
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = getRefreshToken();

          if (refreshToken) {
            console.log("🔄 401 에러 감지, 토큰 갱신 시도");

            // 토큰 갱신 요청 (인증 불필요한 클라이언트 사용)
            const refreshResponse = await springAuthClient.post("/refresh", {
              refreshToken,
            });

            const newAccessToken = refreshResponse.data.accessToken;

            // 새 토큰 저장 (기존 rememberMe 설정 유지)
            updateAccessToken(newAccessToken);

            // 원래 요청에 새 토큰 적용
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            console.log("✅ 토큰 갱신 완료, 원래 요청 재시도");

            // 원래 요청 재시도
            return client(originalRequest);
          }
        } catch (refreshError) {
          console.error("❌ 토큰 갱신 실패:", refreshError);

          // 토큰 갱신 실패 시 모든 토큰 제거
          clearTokens();

          // 로그인 페이지로 리다이렉트 (필요시)
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

// 각 클라이언트에 인터셉터 설정
setupInterceptors(axiosClient, "Spring");
setupInterceptors(springClient, "Spring");
setupInterceptors(springAuthClient, "Spring Auth-Free", true); // 인증 불필요
setupInterceptors(expressClient, "Express");

// 편의 함수들
export const apiRequest = {
  // 스프링 서버 요청
  spring: springClient,
  // 스프링 서버 요청 (인증 불필요)
  springAuth: springAuthClient,
  // Express 서버 요청
  express: expressClient,
  // 기본 요청 (스프링 서버)
  default: axiosClient,
};

export default axiosClient;
