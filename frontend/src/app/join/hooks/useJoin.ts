import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useJoinQuery } from "./useJoinQuery";
import { useMutation } from "@tanstack/react-query";
import { joinServerApi } from "@/app/(server-setup)/api/server.api";
import { getAccessToken } from "@/app/lib/tokenStorage";
import axios from "axios";

export const useJoin = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteCode = searchParams.get("code") ?? "";

  const [isJoining, setIsJoining] = useState(false);
  const [isJoinError2, setIsJoinError2] = useState(false);
  const [isServerNotFound, setIsServerNotFound] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);

  // 로그인 여부: accessToken 존재 확인
  const isLoggedIn = !!getAccessToken();

  const {
    data: joinInfo,
    isLoading: isJoinLoading,
    isError: isJoinError,
  } = useJoinQuery(inviteCode, isLoggedIn);

  const serverUrl = joinInfo?.serverUrl ?? "";

  console.log("서버 주소:", serverUrl);

  const serverOwner = joinInfo?.owner ?? "";
  const memberCount = joinInfo?.memberCount ?? 0;

  const isPageLoading = !isLoggedIn || isJoinLoading;
  const isJoinButtonDisabled = !serverUrl || isJoining;

  const joinMutation = useMutation({
    mutationFn: () => joinServerApi(serverUrl),
    onError: (error) => {
      console.error("🔴 join API 에러:", error);

      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setJoinErrorMessage(error.response.data.message);
      } else if (error instanceof Error) {
        setJoinErrorMessage(error.message);
      } else {
        setJoinErrorMessage("서버 가입에 실패했습니다.");
      }

      setIsJoining(false);
    },
  });

  // 미로그인 → 로그인 페이지로
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (!isLoggedIn && !hasRedirected.current) {
      hasRedirected.current = true;
      const currentPath = `/join?code=${inviteCode}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoggedIn, inviteCode, router]);

  // 서버 가입하기 버튼 핸들러
  const handleJoin = useCallback(async () => {
    if (!serverUrl || isJoining) return;

    setJoinErrorMessage(null);
    setIsJoinError2(false);

    try {
      setIsJoining(true);
      const result = await joinMutation.mutateAsync();

      // 서버가 삭제된 경우: { message: string }만 있고 sStatus 없음
      if (
        typeof result === "object" &&
        "message" in result &&
        !("sStatus" in result)
      ) {
        const msg = (result as { message: string }).message;
        console.warn("⚠️ 서버가 존재하지 않습니다:", msg);
        setJoinErrorMessage(msg);
        setIsServerNotFound(true);
        setIsJoining(false);
        return;
      }

      // 정상 가입 요청 성공 → pending 페이지로 이동
      if (joinInfo) {
        const params = new URLSearchParams({
          serverUrl: joinInfo.serverUrl,
          serverName: joinInfo.serverName,
        });
        router.push(`/pending?${params.toString()}`);
      } else {
        router.push("/pending");
      }
    } catch (error) {
      console.error("서버 가입 실패:", error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setJoinErrorMessage(error.response.data.message);
      } else {
        setIsJoinError2(true);
      }
      setIsJoining(false);
    }
  }, [serverUrl, isJoining, joinMutation, joinInfo, router]);

  const handleGoHome = () => router.push("/");

  return {
    // 상태
    isPageLoading,
    isJoinError,
    isJoining,
    isJoinError2,
    isServerNotFound,
    isJoinButtonDisabled,
    joinErrorMessage,
    // 데이터
    joinInfo,
    serverOwner,
    memberCount,
    // 액션
    handleJoin,
    handleGoHome,
  };
};
