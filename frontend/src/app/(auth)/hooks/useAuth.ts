import { useAuthForm } from "./useAuthForm";
import { AuthFormData } from "../types/AuthFormData";
import {
  useSignUpMutation,
  useLoginMutation,
  useLogoutMutation,
} from "./useAuthMutations";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export const useAuth = (type: "login" | "register" = "register") => {
  const router = useRouter();
  const signUpMutation = useSignUpMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const queryClient = useQueryClient();
  // 회원가입 처리 함수
  const handleRegister = async (data: AuthFormData) => {
    console.log("회원가입 프로세스 시작 - 폼 데이터:", data);
    try {
      // 1. 회원가입 먼저 진행
      const signUpResponse = await signUpMutation.mutateAsync({
        userEmail: data.userEmail,
        userName: data.userName || "",
        password: data.password,
      });
      console.log("✅ 회원가입 성공:", signUpResponse);

      // 2. 회원가입 성공 후 바로 로그인
      console.log("🔄 자동 로그인 시작...");
      const loginResponse = await loginMutation.mutateAsync({
        userEmail: data.userEmail,
        password: data.password,
      });
      console.log("✅ 자동 로그인 성공:", loginResponse);

      // 3. 로그인 성공 후 서버 연결 페이지로 이동
      console.log("🎉 회원가입 및 로그인 완료! 서버 연결 페이지로 이동합니다.");
      router.push("/server-connect");
    } catch (error) {
      console.error("❌ 회원가입 또는 로그인 에러:", error);
      throw error;
    }
  };

  // 로그인 처리 함수
  const handleLogin = async (data: AuthFormData) => {
    console.log("로그인 프로세스 시작 - 폼 데이터:", data);
    try {
      const response = await loginMutation.mutateAsync({
        userEmail: data.userEmail,
        password: data.password,
        rememberMe: data.rememberMe || false,
      });

      console.log("🎉 로그인 성공:", response);
      console.log(
        `💾 로그인 상태 유지: ${data.rememberMe ? "활성화" : "비활성화"}`
      );
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      // 로그인 성공 후 서버 연결 페이지로 이동
      router.push("/server-connect");
    } catch (error) {
      console.error("❌ 로그인 에러:", error);
      throw error;
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

  // 타입에 따른 초기 데이터 설정
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

  // 타입에 따른 onSubmit 함수 선택
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
