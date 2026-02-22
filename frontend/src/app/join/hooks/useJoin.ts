import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useJoinQuery } from "./useJoinQuery";
import { useServerJoinStatusApi } from "@/app/(server-setup)/hooks/useServerApi";
import { getAccessToken } from "@/app/lib/tokenStorage";

export const useJoin = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteCode = searchParams.get("code") ?? "";

  const [isJoining, setIsJoining] = useState(false);
  const [isJoinError2, setIsJoinError2] = useState(false);

  // 로그인 여부: accessToken 존재 확인
  const isLoggedIn = !!getAccessToken();

  // 미로그인 상태에서는 쿼리 자체를 막아 에러 캐시를 방지
  // isPageLoading은 미로그인 리다이렉트 중에도 true → 에러 화면 안 보임
  const {
    data: joinInfo,
    isLoading: isJoinLoading,
    isError: isJoinError,
  } = useJoinQuery(inviteCode, isLoggedIn);

  const serverUrl = joinInfo?.serverUrl ?? "";

  console.log("서버 주소:",serverUrl);

  const serverOwner = joinInfo?.owner ?? "";
  const memberCount = joinInfo?.memberCount ?? 0;

  // 미로그인: 리다이렉트 중이므로 로딩으로 처리 (에러 화면 차단)
  const isPageLoading = !isLoggedIn || isJoinLoading;
  const isJoinButtonDisabled = !serverUrl || isJoining;

  // useServerJoinStatusApi의 execute를 뮤테이션처럼 직접 1회 호출
  const { execute: requestJoin } = useServerJoinStatusApi(serverUrl);

  // 미로그인 → 로그인 페이지로 (현재 경로를 redirect 파라미터로 전달)
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (!isLoggedIn && !hasRedirected.current) {
      hasRedirected.current = true;
      const currentPath = `/join?code=${inviteCode}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoggedIn, inviteCode, router]);

  // 서버 가입하기 버튼 핸들러 - 1회 POST 후 바로 pending으로 이동
  const handleJoin = useCallback(async () => {
    if (!serverUrl || isJoining) return;

    try {
      setIsJoining(true);
      await requestJoin();

      // 가입 요청 성공 → pending 페이지로 이동 (serverUrl, serverName을 쿼리 파라미터로 전달)
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
      setIsJoinError2(true);
      setIsJoining(false);
    }
  }, [serverUrl, isJoining, requestJoin, joinInfo, router]);

  const handleGoHome = () => router.push("/");

  return {
    // 상태
    isPageLoading,
    isJoinError,
    isJoining,
    isJoinError2,
    isJoinButtonDisabled,
    // 데이터
    joinInfo,
    serverOwner,
    memberCount,
    // 액션
    handleJoin,
    handleGoHome,
  };
};
