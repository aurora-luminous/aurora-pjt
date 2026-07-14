import { useAuthForm } from "./useAuthForm";
import {
  useSignUpMutation,
  useLoginMutation,
  useLogoutMutation,
} from "./useAuthMutations";
import { getLastChannelApi } from "../api/auth.api";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthFormData } from "../types";
import { useServerFlow } from "@/app/(server-setup)/hooks/useServerFlow";

export const useAuth = (type: "login" | "register" = "register") => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const signUpMutation = useSignUpMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const queryClient = useQueryClient();
  const { handleServerConnection } = useServerFlow();

  const handleRegister = async (data: AuthFormData) => {
    try {
      await signUpMutation.mutateAsync({
        userEmail: data.userEmail,
        userName: data.userName || "",
        password: data.password,
      });

      await loginMutation.mutateAsync({
        userEmail: data.userEmail,
        password: data.password,
      });

      router.push(
        redirectPath ? decodeURIComponent(redirectPath) : "/server-connect",
      );
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (data: AuthFormData) => {
    await loginMutation.mutateAsync({
      userEmail: data.userEmail,
      password: data.password,
      rememberMe: data.rememberMe ?? false,
    });

    queryClient.invalidateQueries({ queryKey: ["userInfo"] });

    try {
      const lastChannel = await getLastChannelApi();
      handleServerConnection(lastChannel.serverUrl, lastChannel.serverUrl);

      router.push(
        lastChannel.serverUrl +
          "/projects/" +
          lastChannel.projectPk +
          "/channels/" +
          lastChannel.channelPk,
      );
    } catch {
      router.push(
        redirectPath ? decodeURIComponent(redirectPath) : "/server-connect",
      );
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        router.push("/login");
      },
    });
  };

  const getInitialData = () => {
    if (type === "register") {
      return { userName: "", confirmPassword: "", agreeToTerms: false };
    }
    return {};
  };

  const { formData, errors, isLoading, updateField, handleSubmit } =
    useAuthForm({
      initialData: getInitialData(),
      onSubmit: type === "register" ? handleRegister : handleLogin,
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
