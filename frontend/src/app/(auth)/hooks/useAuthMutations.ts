import { useMutation, useQuery } from "@tanstack/react-query";
import {
  signUpApi,
  loginApi,
  logoutApi,
  getUserInfoApi,
  getLastChannelApi,
} from "../api/auth.api";
import { handleLoginSuccess, handleLogoutSuccess } from "../services/auth.service";
import { getAccessToken } from "@/app/lib/tokenStorage";
import type { SignUpRequest, LoginRequest } from "../types";

export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: (data: SignUpRequest) => signUpApi(data),
  });
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (data: LoginRequest & { rememberMe?: boolean }) => {
      const response = await loginApi({ userEmail: data.userEmail, password: data.password });
      handleLoginSuccess(response, data.rememberMe ?? false);
      return response;
    },
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: async () => {
      await logoutApi();
      handleLogoutSuccess();
    },
  });
};

export const useGetUserInfoQuery = () => {
  return useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfoApi(),
  });
};

export const useGetLastChannelQuery = () => {
  return useQuery({
    queryKey: ["lastChannel"],
    queryFn: () => getLastChannelApi(),
    enabled: !!getAccessToken(),
  });
};
