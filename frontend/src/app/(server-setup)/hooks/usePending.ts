import { useServerJoinStatusQuery } from "./useServerMutation";
import { useRouter, useSearchParams } from "next/navigation";
import { useServerFlow } from "./useServerFlow";
import { useEffect, useRef, useState } from "react";

export const usePending = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleServerConnection } = useServerFlow();

  // URL 파라미터에서 서버 정보 가져오기
  const serverUrl = searchParams.get("serverUrl") || "";
  const serverName = searchParams.get("serverName") || "";

  // URL 파라미터 누락 여부를 동기적으로 판별
  const hasMissingParams = !serverUrl || !serverName;

  // 리다이렉트 진행 중 여부 (페이지 렌더링 차단용)
  const [isRedirecting, setIsRedirecting] = useState(hasMissingParams);

  // 서버 정보가 없으면 서버 연결 페이지로 리다이렉트
  useEffect(() => {
    if (hasMissingParams) {
      console.log("❌ 서버 정보가 없습니다. 서버 연결 페이지로 이동합니다.");
      router.push("/server-connect");
    }
  }, [hasMissingParams, router]);

  // 로컬 상태
  const [approvalStatus, setApprovalStatus] = useState<
    "Pending" | "Active" | "Inactive" | "Checking"
  >("Checking");

  // 서버 접근 권한 조회 - Tanstack Query 자동 polling 사용
  const {
    data: serverAccessData,
    isLoading,
    error,
    refetch,
  } = useServerJoinStatusQuery(serverUrl || "dummy", approvalStatus);

  // 서버가 삭제된 경우: API가 400 에러를 throw함
  const isServerDeleted =
    !!error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((error as any)?.response?.status === 400 ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.response?.data?.statusCode === 400);

  const isCannotFind =
    !!error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((error as any)?.response?.status === 404 ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.response?.data.statusCode === 404);

  useEffect(() => {
    if (isCannotFind) {
      setIsRedirecting(true);
      alert("서버에 접근할 수 없습니다.");
      router.push("/server-connect");
    }
  }, [isCannotFind, router]);

  // serverAccessData를 ServerAccess 타입으로 좁히기
  const serverAccessList =
    (serverAccessData as { sStatus: string } | undefined) ?? null;

  // 서버 삭제(400) 감지 시 server-connect로 즉시 이동
  useEffect(() => {
    if (isServerDeleted) {
      console.log("⚠️ 서버가 삭제되었습니다. 서버 연결 페이지로 이동합니다.");
      setIsRedirecting(true);
      alert("서버에 접근할 수 없습니다.");
      router.push("/server-connect");
    }
  }, [isServerDeleted, router]);

  // 사용자의 승인 상태 확인 (이메일 필터링 불필요)
  useEffect(() => {
    if (!serverAccessList || !serverUrl) return;

    // /join API는 현재 사용자의 상태만 반환
    const currentUserAccess = serverAccessList;

    if (currentUserAccess) {
      switch (currentUserAccess.sStatus) {
        case "Pending":
          setApprovalStatus("Pending");
          break;
        case "Active":
          setApprovalStatus("Active");
          break;
        case "Inactive":
        case "Banned":
          setApprovalStatus("Inactive");
          break;
        default:
          setApprovalStatus("Pending");
      }
    } else {
      // 목록이 비어있으면 아직 요청이 처리되지 않았음
      setApprovalStatus("Pending");
    }
  }, [serverAccessList, serverUrl]);

  // 최신 값을 ref로 유지 (useEffect 의존성 배열 문제 방지)
  const handleServerConnectionRef = useRef(handleServerConnection);
  const serverUrlRef = useRef(serverUrl);
  const serverNameRef = useRef(serverName);
  useEffect(() => {
    handleServerConnectionRef.current = handleServerConnection;
  }, [handleServerConnection]);
  useEffect(() => {
    serverUrlRef.current = serverUrl;
  }, [serverUrl]);
  useEffect(() => {
    serverNameRef.current = serverName;
  }, [serverName]);

  // 승인 완료 시 자동 입장
  useEffect(() => {
    console.log("approvalStatus", approvalStatus);
    if (approvalStatus === "Active") {
      console.log("✅ 승인 완료! 서버에 자동 입장합니다.");

      setTimeout(async () => {
        try {
          // handleServerConnection이 내부에서 projectPk, channelPk를 조회하고 라우팅까지 처리
          await handleServerConnectionRef.current(
            serverUrlRef.current,
            serverNameRef.current,
          );
        } catch (error) {
          console.error("자동 입장 실패:", error);
        }
      }, 0);
    }
  }, [approvalStatus]);

  const handleGoToRecentServer = () => {
    router.push("/server-connect");
  };

  const handleManualRefresh = () => {
    refetch();
  };

  // 승인 상태에 따른 UI 렌더링
  const getStatusConfig = () => {
    switch (approvalStatus) {
      case "Active":
        return {
          icon: "✅",
          title: "승인 완료!",
          description:
            "서버 입장이 승인되었습니다.\n잠시 후 자동으로 입장합니다.",
          statusColor: "text-green-300",
          bgColor: "bg-green-500/20 border-green-500/30",
          statusText: "승인 완료",
          dotColor: "bg-green-400",
        };
      case "Inactive":
        return {
          icon: "❌",
          title: "가입 거절됨",
          description:
            "서버 관리자가 가입 요청을 거절했습니다.\n다른 서버를 이용해보세요.",
          statusColor: "text-red-300",
          bgColor: "bg-red-500/20 border-red-500/30",
          statusText: "가입 거절",
          dotColor: "bg-red-400",
        };
      case "Checking":
        return {
          icon: "🔍",
          title: "상태 확인 중",
          description:
            "현재 승인 상태를 확인하고 있습니다.\n잠시만 기다려주세요.",
          statusColor: "text-blue-300",
          bgColor: "bg-blue-500/20 border-blue-500/30",
          statusText: "확인 중",
          dotColor: "bg-blue-400",
        };
      default:
        return {
          icon: "⏰",
          title: "서버 가입 승인 대기",
          description:
            "서버 관리자의 승인을 대기중입니다.\n승인이 완료되면 자동으로 입장됩니다.",
          statusColor: "text-amber-300",
          bgColor: "bg-amber-500/20 border-amber-500/30",
          statusText: "승인 대기 중",
          dotColor: "bg-amber-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return {
    statusConfig,
    handleGoToRecentServer,
    handleManualRefresh,
    approvalStatus,
    serverName,
    serverUrl,
    isLoading,
    error,
    isRedirecting,
    handleServerConnection,
  };
};
