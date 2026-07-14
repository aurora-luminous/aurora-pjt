import type { AuthFormData, AuthFormErrors } from "../types";

export const validateLoginForm = (formData: AuthFormData): AuthFormErrors => {
  const errors: AuthFormErrors = {};

  if (!formData.userEmail) {
    errors.userEmail = "이메일을 입력하세요";
  } else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) {
    errors.userEmail = "올바른 이메일 형식을 입력하세요";
  }

  if (!formData.password) {
    errors.password = "비밀번호를 입력하세요";
  } else if (formData.password.length < 6) {
    errors.password = "비밀번호는 6자 이상이어야 합니다";
  }

  return errors;
};

export const validateRegisterForm = (formData: AuthFormData): AuthFormErrors => {
  const errors = validateLoginForm(formData);

  if (!formData.userName) {
    errors.userName = "이름을 입력하세요";
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = "비밀번호 확인을 입력하세요";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "비밀번호가 일치하지 않습니다";
  }

  if (!formData.agreeToTerms) {
    errors.agreeToTerms = "서비스 약관에 동의해주세요";
  }

  return errors;
};
