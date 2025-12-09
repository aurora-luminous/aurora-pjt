import { useServerJoinStatusQuery } from "./useServerMutation";
import { useRouter, useSearchParams } from "next/navigation";
import { useServerFlow } from "./useServerFlow";
import { useEffect, useState } from "react";

export const usePending = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleServerConnection } = useServerFlow();

  // URL 파라미터에서 서버 정보 가져오기
  const serverUrl = searchParams.get("serverUrl") || "";
  const serverName = searchParams.get("serverName") || "";

  // 서버 정보가 없으면 서버 연결 페이지로 리다이렉트
  useEffect(() => {
    if (!serverUrl || !serverName) {
      console.log("❌ 서버 정보가 없습니다. 서버 연결 페이지로 이동합니다.");
      router.push("/server-connect");
    }
  }, [serverUrl, serverName, router]);

  // 로컬 상태
  const [approvalStatus, setApprovalStatus] = useState<
    "pending" | "active" | "inactive" | "checking"
  >("checking");

  // 서버 접근 권한 조회 - Tanstack Query 자동 polling 사용
  const {
    data: serverAccessList = [],
    isLoading,
    error,
    refetch,
  } = useServerJoinStatusQuery(serverUrl || "dummy", approvalStatus);

  // 사용자의 승인 상태 확인 (이메일 필터링 불필요)
  useEffect(() => {
    if (!serverAccessList?.length || !serverUrl) return;

    // /join API는 현재 사용자의 상태만 반환하므로 첫 번째 항목 사용
    const currentUserAccess = serverAccessList[0];

    if (currentUserAccess) {
      switch (currentUserAccess.sStatus) {
        case "Pending":
          setApprovalStatus("pending");
          break;
        case "Active":
          setApprovalStatus("active");
          break;
        case "Inactive":
        case "Banned":
          setApprovalStatus("inactive");
          break;
        default:
          setApprovalStatus("pending");
      }
    } else {
      // 목록이 비어있으면 아직 요청이 처리되지 않았음
      setApprovalStatus("pending");
    }
  }, [serverAccessList, serverUrl]);

  // 승인 완료 시 자동 입장
  useEffect(() => {
    if (approvalStatus === "active" && serverUrl && serverName) {
      console.log("✅ 승인 완료! 서버에 자동 입장합니다.");

      // 잠시 승인 완료 메시지를 보여준 후 입장
      setTimeout(async () => {
        try {
          await handleServerConnection(serverUrl, serverName);
        } catch (error) {
          console.error("자동 입장 실패:", error);
          // 실패 시 수동으로 다시 시도할 수 있도록 UI 제공
        }
      }, 2000);
    }
  }, [approvalStatus, serverUrl, serverName, handleServerConnection]);

  const handleGoToRecentServer = () => {
    router.push("/server-connect");
  };

  const handleManualRefresh = () => {
    refetch();
  };

  // 승인 상태에 따른 UI 렌더링
  const getStatusConfig = () => {
    switch (approvalStatus) {
      case "active":
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
      case "inactive":
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
      case "checking":
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
    handleServerConnection,
  };
};
