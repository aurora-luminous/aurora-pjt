"use client";

import { useEffect, useState } from "react";
import { refreshTokenApi } from "../api/auth.api";
import {
  handleTokenRefreshSuccess,
  handleTokenRefreshFailure,
  isTokenExpired,
} from "../services/auth.service";
import { getAccessToken, getRefreshToken, clearTokens } from "@/app/lib/tokenStorage";

export const useAutoLogin = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!accessToken && !refreshToken) {
          setIsLoggedIn(false);
          return;
        }

        if (accessToken && !isTokenExpired(accessToken)) {
          setIsLoggedIn(true);
          return;
        }

        if (refreshToken) {
          try {
            const response = await refreshTokenApi(refreshToken);
            handleTokenRefreshSuccess(response.accessToken);
            setIsLoggedIn(true);
          } catch {
            handleTokenRefreshFailure();
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  const logout = () => {
    clearTokens();
    setIsLoggedIn(false);
  };

  return { isChecking, isLoggedIn, logout };
};
