import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useJoinQuery } from "./useJoinQuery";
import {
  useProjectListQuery,
  useUserMemberListQuery,
  useServerJoinStatusQuery,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { getAccessToken } from "@/app/lib/tokenStorage";

export const useJoin = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteCode = searchParams.get("code") ?? "";

  const [hasJoined, setHasJoined] = useState(false);

  // 로그인 여부: accessToken 존재 확인
  const isLoggedIn = !!getAccessToken();

  // 초대 코드로 서버 기본 정보 조회
  const {
    data: joinInfo,
    isLoading: isJoinLoading,
    isError: isJoinError,
  } = useJoinQuery(inviteCode);

  const serverUrl = joinInfo?.serverUrl ?? "";

  // serverUrl로 프로젝트 목록 조회
  const { data: projects, isLoading: isProjectsLoading } =
    useProjectListQuery(serverUrl);

  // serverUrl로 멤버 목록 조회
  const { data: members, isLoading: isMembersLoading } =
    useUserMemberListQuery(serverUrl);

  // 가입 신청 (hasJoined가 true일 때 POST 실행)
  const {
    data: joinStatus,
    isLoading: isJoinStatusLoading,
    isError: isJoinStatusError,
  } = useServerJoinStatusQuery(serverUrl, hasJoined ? undefined : "Active");

  // 파생 데이터
  const serverOwner = members?.find(
    (m) => m.serverRole === "owner"
  )?.userInfo?.userName;

  const isPageLoading = isJoinLoading;
  const isContentLoading = isProjectsLoading || isMembersLoading;
  const isJoinButtonDisabled = !serverUrl || isJoinStatusLoading || hasJoined;

  // 미로그인 → 로그인 페이지로 (현재 경로를 redirect 파라미터로 전달)
  useEffect(() => {
    if (!isLoggedIn) {
      const currentPath = `/join?code=${inviteCode}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoggedIn, inviteCode, router]);

  // 가입 신청 완료 → pending 페이지로 이동
  useEffect(() => {
    if (!hasJoined || !joinStatus) return;

    const status = joinStatus.sStatus;
    if (status === "Pending" || status === "Active") {
      if (joinInfo) {
        localStorage.setItem("pendingServerUrl", joinInfo.serverUrl);
        localStorage.setItem("pendingServerName", joinInfo.serverName);
      }
      router.push("/pending");
    }
  }, [hasJoined, joinStatus, joinInfo, router]);

  const handleJoin = () => {
    if (!serverUrl) return;
    setHasJoined(true);
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return {
    // 상태
    isPageLoading,
    isContentLoading,
    isJoinLoading,
    isJoinError,
    isJoinStatusLoading,
    isJoinStatusError,
    hasJoined,
    isJoinButtonDisabled,
    // 데이터
    joinInfo,
    projects,
    members,
    serverOwner,
    // 액션
    handleJoin,
    handleGoHome,
  };
};
