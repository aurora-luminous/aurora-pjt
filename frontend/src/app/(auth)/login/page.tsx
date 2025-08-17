"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthForm } from "../hooks/useAuthForm";
import { AuthFormData } from "../types/AuthFormData";
import { AuthInput } from "../components/AuthInput";
import { AuthCheckbox } from "../components/AuthCheckbox";
import { AuthButton } from "../components/AuthButton";
import { useLoginMutation } from "../hooks/useAuthMutations";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 50,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -50,
  },
};

const LoginPage = () => {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const { formData, errors, isLoading, updateField, handleSubmit } =
    useAuthForm({
      onSubmit: async (data: AuthFormData) => {
        console.log("Login data:", data);
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

          // 로그인 성공 후 서버 연결 페이지로 이동
          router.push("/server-connect");
        } catch (error) {
          console.error("❌ Login error:", error);
        }
      },
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit("login");
  };

  return (
    <motion.div
      key="login"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="exit"
      transition={{
        duration: 0.4,
        ease: "easeInOut",
      }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">로그인</h2>
        <p className="text-white/70">계정에 로그인하여 시작하세요</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <AuthInput
          label="이메일"
          type="email"
          id="userEmail"
          name="userEmail"
          value={formData.userEmail}
          placeholder="이메일을 입력하세요"
          error={errors.userEmail}
          onChange={(value) => updateField("userEmail", value)}
          required
        />

        <AuthInput
          label="비밀번호"
          type="password"
          id="password"
          name="password"
          value={formData.password}
          placeholder="비밀번호를 입력하세요"
          error={errors.password}
          onChange={(value) => updateField("password", value)}
          required
        />

        <div className="flex items-center justify-between">
          <AuthCheckbox
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe || false}
            onChange={(checked) => updateField("rememberMe", checked)}
          >
            로그인 상태 유지
          </AuthCheckbox>

          <Link
            href="#"
            className="text-sm text-purple-300 hover:text-purple-200"
          >
            비밀번호 찾기
          </Link>
        </div>

        <AuthButton
          type="button"
          variant="primary"
          loading={isLoading || loginMutation.isPending}
          disabled={isLoading || loginMutation.isPending}
          onClick={() => handleSubmit("login")}
        >
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </AuthButton>
      </form>

      <div className="mt-8 text-center">
        <p className="text-white/70">
          계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="text-purple-300 hover:text-purple-200 font-medium"
          >
            회원가입
          </Link>
        </p>
      </div>

      {/* Navigation for testing */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <AuthButton variant="secondary">
          <Link href="/" className="block w-full">
            메인으로
          </Link>
        </AuthButton>
      </div>
    </motion.div>
  );
};

export default LoginPage;
