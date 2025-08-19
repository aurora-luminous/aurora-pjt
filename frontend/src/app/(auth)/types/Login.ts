/**
 * 로그인 요청 타입
 */
export interface LoginRequest {
  userEmail: string;
  password: string;
}

/**
 * 로그인 응답 타입
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}
