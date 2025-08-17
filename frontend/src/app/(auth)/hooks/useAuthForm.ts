"use client";

import { useState } from "react";
import { AuthFormData } from "../types/AuthFormData";
import { AuthFormErrors } from "../types/AuthFormErrors";

export interface UseAuthFormProps {
  initialData?: Partial<AuthFormData>;
  onSubmit: (data: AuthFormData) => void;
}

export const useAuthForm = ({
  initialData = {},
  onSubmit,
}: UseAuthFormProps) => {
  const [formData, setFormData] = useState<AuthFormData>({
    userEmail: "",
    userName: "",
    password: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof AuthFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 사용자가 입력을 시작할 때 에러 초기화
    if (errors[field as keyof AuthFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (type: "login" | "register"): boolean => {
    const newErrors: AuthFormErrors = {};

    // 이메일 유효성 검사
    if (!formData.userEmail) {
      newErrors.userEmail = "이메일을 입력하세요";
    } else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) {
      newErrors.userEmail = "올바른 이메일 형식을 입력하세요";
    }

    // 비밀번호 유효성 검사
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력하세요";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 6자 이상이어야 합니다";
    }

    // 회원가입 유효성 검사
    if (type === "register") {
      if (!formData.userName) {
        newErrors.userName = "이름을 입력하세요";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "비밀번호 확인을 입력하세요";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "서비스 약관에 동의해주세요";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (type: "login" | "register") => {
    if (!validateForm(type)) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    errors,
    isLoading,
    updateField,
    handleSubmit,
  };
};
