import {
  setTokens,
  clearTokens,
  updateAccessToken,
} from "@/app/lib/tokenStorage";
import type { LoginResponse } from "../types";

export const handleLoginSuccess = (
  response: LoginResponse,
  rememberMe: boolean
): void => {
  setTokens(response.accessToken, response.refreshToken, rememberMe);
};

export const handleLogoutSuccess = (): void => {
  clearTokens();
};

export const handleTokenRefreshSuccess = (accessToken: string): void => {
  updateAccessToken(accessToken);
};

export const handleTokenRefreshFailure = (): void => {
  clearTokens();
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp <= currentTime;
  } catch {
    return true;
  }
};
