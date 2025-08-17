export interface AuthFormData {
  userName?: string;
  userEmail: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
  agreeToTerms?: boolean;
}
