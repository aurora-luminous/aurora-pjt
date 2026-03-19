import { useAuthForm } from "./useAuthForm";
import { AuthFormData } from "../types/AuthFormData";
import {
  useSignUpMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetLastChannelQuery,
} from "./useAuthMutations";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export const useAuth = (type: "login" | "register" = "register") => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const signUpMutation = useSignUpMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const queryClient = useQueryClient();
  const { refetch: refetchLastChannel } = useGetLastChannelQuery();

  // 회원가입 처리 함수
  const handleRegister = async (data: AuthFormData) => {
    console.log("회원가입 프로세스 시작 - 폼 데이터:", data);
    try {
      const signUpResponse = await signUpMutation.mutateAsync({
        userEmail: data.userEmail,
        userName: data.userName || "",
        password: data.password,
      });
      console.log("✅ 회원가입 성공:", signUpResponse);

      console.log("🔄 자동 로그인 시작...");
      const loginResponse = await loginMutation.mutateAsync({
        userEmail: data.userEmail,
        password: data.password,
      });
      console.log("✅ 자동 로그인 성공:", loginResponse);

      router.push(redirectPath ? decodeURIComponent(redirectPath) : "/server-connect");
    } catch (error) {
      console.error("❌ 회원가입 또는 로그인 에러:", error);
      throw error;
    }
  };

  // 로그인 처리 함수
  // mutateAsync가 throw하면 TanStack Query가 loginMutation.error에 자동으로 저장됨
  const handleLogin = async (data: AuthFormData) => {
    console.log("로그인 프로세스 시작 - 폼 데이터:", data);
    const response = await loginMutation.mutateAsync({
      userEmail: data.userEmail,
      password: data.password,
      rememberMe: data.rememberMe || false,
    });

    console.log("🎉 로그인 성공:", response);
    queryClient.invalidateQueries({ queryKey: ["userInfo"] });
    const { data :freshLastChannel } = await refetchLastChannel();
    if (!freshLastChannel) {
      router.push(redirectPath ? decodeURIComponent(redirectPath) : "/server-connect");
    } else {
      router.push(
        freshLastChannel.serverUrl +
          "/projects/" +
          freshLastChannel.projectPk +
          "/channels/" +
          freshLastChannel.channelPk
      );
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    console.log("로그아웃 프로세스 시작");
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        console.log("✅ 로그아웃 성공");
        queryClient.clear();
        router.push("/login");
      },
      onError: (error) => {
        console.error("❌ 로그아웃 에러:", error);
      },
    });
  };

  const getInitialData = () => {
    if (type === "register") {
      return {
        userName: "",
        confirmPassword: "",
        agreeToTerms: false,
      };
    }
    return {};
  };

  const getOnSubmitHandler = () => {
    return type === "register" ? handleRegister : handleLogin;
  };

  const { formData, errors, isLoading, updateField, handleSubmit } =
    useAuthForm({
      initialData: getInitialData(),
      onSubmit: getOnSubmitHandler(),
    });

  return {
    formData,
    errors,
    isLoading,
    updateField,
    handleSubmit,
    signUpMutation,
    loginMutation,
    logoutMutation,
    handleRegister,
    handleLogin,
    handleLogout,
  };
};
