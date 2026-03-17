"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { AuthInput } from "../components/AuthInput";
import { AuthCheckbox } from "../components/AuthCheckbox";
import { AuthButton } from "../components/AuthButton";
import { useResponsive } from "../../lib/useResponsive";
import { parseApiError } from "../../lib/parseApiError";

const pageVariants = {
  initial: { opacity: 0, y: 50 },
  in: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

const LoginPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const {
    formData,
    errors,
    isLoading,
    updateField,
    handleSubmit,
    loginMutation,
  } = useAuth("login");

  // loginMutation.error에서 서버 에러 메시지 추출
  const loginError = loginMutation.error
    ? parseApiError(loginMutation.error, "로그인에 실패했습니다.")
    : null;

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
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full"
    >
      <div className={`text-center ${isMobile ? "mb-6" : "mb-8"}`}>
        <h2
          className={`
          font-bold text-white mb-2
          ${isMobile ? "text-xl" : isTablet ? "text-xl" : "text-2xl"}
        `}
        >
          로그인
        </h2>
        <p
          className={`
          text-white/70
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          계정에 로그인하여 시작하세요
        </p>
      </div>

      <form onSubmit={onSubmit} className={`${isMobile ? "space-y-4" : "space-y-6"}`}>
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

        <div
          className={`
          flex items-center justify-between
          ${isMobile ? "flex-col space-y-3" : "flex-row"}
        `}
        >
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
            className={`
              text-purple-300 hover:text-purple-200
              ${isMobile ? "text-sm" : "text-sm"}
            `}
          >
            비밀번호 찾기
          </Link>
        </div>

        {/* API 에러 배너 — loginMutation.error가 있을 때 자동 표시 */}
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-red-500/15 border border-red-500/40 rounded-lg px-4 py-3"
          >
            <span className="mt-0.5 shrink-0 text-red-400 text-sm">⚠</span>
            <p
              className={`flex-1 text-red-300 font-medium ${
                isMobile ? "text-xs" : "text-sm"
              }`}
            >
              {loginError}
            </p>
          </motion.div>
        )}

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

      <div className={`text-center ${isMobile ? "mt-6" : "mt-8"}`}>
        <p
          className={`
          text-white/70
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
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
      <div
        className={`
        pt-6 border-t border-white/10
        ${isMobile ? "mt-6" : "mt-8"}
      `}
      >
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
