"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { AuthInput, AuthCheckbox, AuthButton, AuthInputWithButton } from "../components";
import { useResponsive } from "../../lib/useResponsive";
import { parseApiError } from "../../lib/parseApiError";

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

const RegisterPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const {
    formData,
    errors,
    isLoading,
    updateField,
    handleSubmit,
    signUpMutation,
    loginMutation,
  } = useAuth("register");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit("register");
  };

  // mutation 에러 메시지 추출
  const serverError = signUpMutation.error
    ? parseApiError(signUpMutation.error, "회원가입에 실패했습니다.")
    : loginMutation.error
    ? parseApiError(loginMutation.error, "자동 로그인에 실패했습니다. 직접 로그인해 주세요.")
    : null;

  return (
    <motion.div
      key="register"
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
      <div className={`text-center ${isMobile ? "mb-6" : "mb-8"}`}>
        <h2
          className={`
          font-bold text-white mb-2
          ${isMobile ? "text-xl" : isTablet ? "text-xl" : "text-2xl"}
        `}
        >
          회원가입
        </h2>
      </div>

      <form
        onSubmit={onSubmit}
        className={`${isMobile ? "space-y-4" : "space-y-6"}`}
      >
        <AuthInputWithButton
          label="이메일"
          type="email"
          id="userEmail"
          name="userEmail"
          value={formData.userEmail}
          placeholder="이메일을 입력하세요"
          error={errors.userEmail}
          onChange={(value) => updateField("userEmail", value)}
          buttonText="이메일 인증"
          onButtonClick={() => {
            alert("이메일 인증 버튼 클릭");
          }}
          required
        />
        <AuthInput
          label="이름"
          type="text"
          id="userName"
          name="userName"
          value={formData.userName || ""}
          placeholder="이름을 입력하세요"
          error={errors.userName}
          onChange={(value) => updateField("userName", value)}
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

        <AuthInput
          label="비밀번호 확인"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword || ""}
          placeholder="비밀번호를 다시 입력하세요"
          error={errors.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
          required
        />

        <AuthCheckbox
          id="agreeToTerms"
          name="agreeToTerms"
          checked={formData.agreeToTerms || false}
          onChange={(checked) => updateField("agreeToTerms", checked)}
          error={errors.agreeToTerms}
        >
          <Link href="#" className="text-purple-300 hover:text-purple-200">
            서비스 약관
          </Link>{" "}
          및{" "}
          <Link href="#" className="text-purple-300 hover:text-purple-200">
            개인정보 처리방침
          </Link>
          에 동의합니다.
        </AuthCheckbox>

        {/* 서버 에러 배너 */}
        {serverError && (
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
              {serverError}
            </p>
          </motion.div>
        )}

        <div className={`text-center ${isMobile ? "mt-4" : "mt-8"}`}>
          <p
            className={`
            text-white/70
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-purple-300 hover:text-purple-200 font-medium"
            >
              로그인 하러가기
            </Link>
          </p>
        </div>

        <AuthButton
          type="button"
          variant="primary"
          loading={
            isLoading || signUpMutation.isPending || loginMutation.isPending
          }
          onClick={() => {
            console.log("회원가입 버튼 클릭됨");
            console.log("현재 폼 데이터:", formData);
            console.log("현재 에러:", errors);
            handleSubmit("register");
          }}
          disabled={
            isLoading || signUpMutation.isPending || loginMutation.isPending
          }
          className={`${isMobile ? "mb-4 mt-4" : "mb-6 mt-4"}`}
        >
          {signUpMutation.isPending
            ? "회원가입 중..."
            : loginMutation.isPending
            ? "로그인 중..."
            : "회원가입"}
        </AuthButton>
      </form>
    </motion.div>
  );
};

export default RegisterPage;
