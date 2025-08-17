import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api", // Next.js 프록시 사용
});

console.log("🔗 Using Next.js proxy: /api");

// 요청 인터셉터
axiosClient.interceptors.request.use((config) => {
  console.log("🚀 API 요청:", config.method?.toUpperCase(), config.url);
  console.log("📦 요청 데이터:", config.data);

  // accessToken과 token 모두 확인
  const accessToken = localStorage.getItem("accessToken");
  const token = localStorage.getItem("token");
  const authToken = accessToken || token;

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

// 응답 인터셉터
axiosClient.interceptors.response.use(
  (response) => {
    console.log("✅ API 응답 성공:", response.status, response.config.url);
    console.log("📦 응답 데이터:", response.data);
    return response;
  },
  (error) => {
    console.error(
      "❌ API 응답 에러:",
      error.response?.status,
      error.config?.url
    );
    console.error("📦 에러 데이터:", error.response?.data);
    return Promise.reject(error);
  }
);

export default axiosClient;
