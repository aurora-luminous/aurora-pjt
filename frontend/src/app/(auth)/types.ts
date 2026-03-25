export interface AuthFormData {
  userName?: string;
  userEmail: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
  agreeToTerms?: boolean;
}

export interface AuthFormErrors {
  userName?: string;
  userEmail?: string;
  password?: string;
  confirmPassword?: string;
  rememberMe?: string;
  agreeToTerms?: string;
}

export interface LoginRequest {
  userEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignUpRequest {
  userEmail: string;
  userName: string;
  password: string;
}

export interface UserInfo {
  userName: string;
  userEmail: string;
  profileImagePath: string;
}

export interface LastChannelResponse {
  serverUrl: string;
  projectPk: number;
  channelPk: number;
}
