import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearTokens,
} from "./tokenStorage";

const axiosClient = axios.create({
  baseURL: "/api", // Next.js 프록시 사용
});

console.log("🔗 Using Next.js proxy: /api");

// 요청 인터셉터
axiosClient.interceptors.request.use((config) => {
  console.log("🚀 API 요청:", config.method?.toUpperCase(), config.url);
  console.log("📦 요청 데이터:", config.data);

  // tokenStorage에서 토큰 가져오기
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// 응답 인터셉터 (자동 토큰 갱신 포함)
axiosClient.interceptors.response.use(
  (response) => {
    console.log("✅ API 응답 성공:", response.status, response.config.url);
    console.log("📦 응답 데이터:", response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(
      "❌ API 응답 에러:",
      error.response?.status,
      error.config?.url
    );
    console.error("📦 에러 데이터:", error.response?.data);

    // 401 에러이고 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          console.log("🔄 401 에러 감지, 토큰 갱신 시도");

          // 토큰 갱신 요청
          const refreshResponse = await axiosClient.post("/jv/refresh", {
            refreshToken,
          });

          const newAccessToken = refreshResponse.data.accessToken;

          // 새 토큰 저장 (기존 rememberMe 설정 유지)
          updateAccessToken(newAccessToken);

          // 원래 요청에 새 토큰 적용
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          console.log("✅ 토큰 갱신 완료, 원래 요청 재시도");

          // 원래 요청 재시도
          return axiosClient(originalRequest);
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

export default axiosClient;
