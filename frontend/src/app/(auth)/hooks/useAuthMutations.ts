import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthApi } from "./useAuthApi";
import { SignUpRequest } from "../types/SignUp";
import { LoginRequest } from "../types/Login";
import { useGetLastChannelApi } from "../../(server-setup)/hooks/useServerApi";
import { getAccessToken } from "@/app/lib/tokenStorage";

/**
 * 회원가입 mutation 훅
 * TanStack Query를 사용하여 회원가입을 처리합니다.
 */
const accessToken = getAccessToken();
export const useSignUpMutation = () => {
  const { signUp } = useAuthApi();

  return useMutation({
    mutationFn: async (data: SignUpRequest) => {
      const result = await signUp(data);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 회원가입 성공:", data);
      // 성공 알림이나 리다이렉트 로직 추가 가능
    },
    onError: (error) => {
      console.error("회원가입 실패:", error);
    },
  });
};

/**
 * 로그인 mutation 훅
 * TanStack Query를 사용하여 로그인을 처리합니다.
 */
export const useLoginMutation = () => {
  const { login } = useAuthApi();

  return useMutation({
    mutationFn: async (data: LoginRequest & { rememberMe?: boolean }) => {
      const result = await login(data);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 로그인 mutation 성공:", data);
      // 토큰은 이미 useAuth에서 저장됨
    },
    onError: (error) => {
      console.error("❌ 로그인 mutation 실패:", error);
      // 에러 토스트 메시지 표시 가능
    },
  });
};

export const useLogoutMutation = () => {
  const { logout } = useAuthApi();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {},
  });
};

export const useGetUserInfoQuery = () => {
  const { getUserInfo } = useAuthApi();

  return useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const result = await getUserInfo();
      return result;
    },
  });
};

export const useGetLastChannelQuery = () => {
  const  {execute: getLastChannel}  = useGetLastChannelApi();

  return useQuery({
    queryKey: ["lastChannel"],
    queryFn: async () => {
      const result = await getLastChannel();
      return result;
    },
    enabled: !!accessToken,
  })
}