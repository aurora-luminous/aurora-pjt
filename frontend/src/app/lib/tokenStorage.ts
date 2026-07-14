/**
 * 토큰 저장 관리 유틸리티
 * rememberMe 옵션에 따라 localStorage 또는 sessionStorage 사용
 */

const TOKEN_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  REMEMBER_ME: "rememberMe",
  CURRENT_SERVER_INFO: "currentServerInfo",
} as const;

/**
 * 토큰을 저장합니다
 */
export const setTokens = (
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false,
) => {
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

  // rememberMe 설정 저장 (항상 localStorage에 저장)
  localStorage.setItem(TOKEN_KEYS.REMEMBER_ME, rememberMe.toString());

  console.log(
    `💾 토큰 저장 완료 (${rememberMe ? "localStorage" : "sessionStorage"})`,
  );
};

/**
 * 액세스 토큰을 가져옵니다
 */
export const getAccessToken = (): string | null => {
  // localStorage와 sessionStorage 둘 다 확인
  return (
    localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
  );
};

/**
 * 리프레시 토큰을 가져옵니다
 */
export const getRefreshToken = (): string | null => {
  // localStorage와 sessionStorage 둘 다 확인
  return (
    localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN) ||
    sessionStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)
  );
};

/**
 * rememberMe 설정을 가져옵니다
 */
export const getRememberMe = (): boolean => {
  const rememberMe = localStorage.getItem(TOKEN_KEYS.REMEMBER_ME);
  return rememberMe === "true";
};

/**
 * 액세스 토큰을 업데이트합니다 (갱신 시 사용)
 */
export const updateAccessToken = (accessToken: string) => {
  const rememberMe = getRememberMe();
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  console.log(
    `🔄 액세스 토큰 업데이트 완료 (${
      rememberMe ? "localStorage" : "sessionStorage"
    })`,
  );
};

/**
 * 모든 토큰을 제거합니다
 */
export const clearTokens = () => {
  // 양쪽 스토리지에서 모두 제거
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REMEMBER_ME);

  sessionStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.CURRENT_SERVER_INFO);

  console.log("🗑️ 모든 토큰 제거 완료");
};

/**
 * 토큰이 존재하는지 확인합니다
 */
export const hasTokens = (): boolean => {
  return !!(getAccessToken() || getRefreshToken());
};
