"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { AuthInput } from "../components/AuthInput";
import { AuthCheckbox } from "../components/AuthCheckbox";
import { AuthButton } from "../components/AuthButton";
import { AuthInputWithButton } from "../components/AuthInputWithButton";

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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">회원가입</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
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
        <div className="mt-8 text-center">
          <p className="text-white/70">
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
          className="mb-6 mt-4"
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
