"use client";

import { useState } from "react";
import { validateLoginForm, validateRegisterForm } from "../validators/auth.validators";
import type { AuthFormData, AuthFormErrors } from "../types";

export interface UseAuthFormProps {
  initialData?: Partial<AuthFormData>;
  onSubmit: (data: AuthFormData) => void;
}

export const useAuthForm = ({ initialData = {}, onSubmit }: UseAuthFormProps) => {
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
    if (errors[field as keyof AuthFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (type: "login" | "register") => {
    const newErrors =
      type === "register" ? validateRegisterForm(formData) : validateLoginForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, errors, isLoading, updateField, handleSubmit };
};
