import { springAuthClient, springClient, expressClient } from "@/app/lib/axiosClient";
import type { LoginRequest, LoginResponse, SignUpRequest, UserInfo, LastChannelResponse } from "../types";

export const signUpApi = (data: SignUpRequest): Promise<string> =>
  springAuthClient.post<string>("/signup", data).then((res) => res.data);

export const loginApi = (data: LoginRequest): Promise<LoginResponse> =>
  springAuthClient.post<LoginResponse>("/login", data).then((res) => res.data);

export const refreshTokenApi = (refreshToken: string): Promise<{ accessToken: string }> =>
  springAuthClient
    .post<{ accessToken: string }>("/refresh", { refreshToken })
    .then((res) => res.data);

export const logoutApi = (): Promise<void> =>
  springClient.post<void>("/logout").then((res) => res.data);

export const getUserInfoApi = (): Promise<UserInfo> =>
  springClient.get<UserInfo>("/info").then((res) => res.data);

export const getLastChannelApi = (): Promise<LastChannelResponse> =>
  expressClient.get<LastChannelResponse>("/ex/members/me/last-channel").then((res) => res.data);
