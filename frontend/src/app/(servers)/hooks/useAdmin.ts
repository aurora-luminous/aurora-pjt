import { useParams } from "next/navigation";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import {
  useServerAccessQuery,
  usePatchServerAccessMutation,
  useServerListQuery,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { useMemo, useState, useCallback } from "react";
import { ServerAccess } from "@/app/(servers)/types/ServerAccess";

// JoinRequest 타입 정의
export interface JoinRequest {
  id: string;
  userName: string;
  userAvatar?: string;
  message: string;
  requestDate: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
}

// ServerAccess를 JoinRequest로 변환하는 함수
const mapServerAccessToJoinRequest = (
  serverAccess: ServerAccess
): JoinRequest => {
  const statusMap: Record<string, "pending" | "approved" | "rejected"> = {
    Pending: "pending",
    Approved: "approved",
    Banned: "rejected",
  };

  return {
    id: serverAccess.userInfo.user_email,
    userName: serverAccess.userInfo.user_name,
    userAvatar: serverAccess.userInfo.profile_image_path || undefined,
    message: `${serverAccess.userInfo.user_name}님이 서버 가입을 요청했습니다.`,
    requestDate: new Date().toISOString(),
    status: statusMap[serverAccess.status] || "pending",
    userEmail: serverAccess.userInfo.user_email || "",
  };
};

// 관리자 사이드바 훅
export const useAdminSidebar = () => {
  const params = useParams();
  const serverUrl = params.server_id as string;

  const serverInfo = useCurrentServerInfo();
  const serverName = serverInfo?.serverName;

  // 서버 목록을 조회하여 현재 사용자의 role 확인
  const serverListQuery = useServerListQuery(true);

  // 현재 서버에서의 사용자 role 찾기
  const currentServerRole = serverListQuery.data?.find(
    (server) => server.serverUrl === serverInfo?.serverUrl
  )?.serverRole;

  // 관리자 권한 확인 (owner 또는 admin)
  const isAdmin =
    currentServerRole === "owner" || currentServerRole === "admin";

  const {
    data: serverAccessList = [],
    isLoading,
    error,
    refetch,
  } = useServerAccessQuery(serverUrl, {
    enabled: isAdmin, // 관리자 권한이 있을 때만 API 호출
  });

  const pendingRequestsCount = useMemo(() => {
    return (
      serverAccessList?.filter((access) => access.status === "Pending")
        .length || 0
    );
  }, [serverAccessList]);

  return {
    serverUrl,
    serverName,
    isLoading: isAdmin ? isLoading : false,
    error: isAdmin ? error : null,
    refetch,
    pendingRequestsCount,
    isAdmin, // 권한 정보도 반환
  };
};

// 가입 요청 아이템 훅
export const useJoinRequestItem = (
  request: JoinRequest,
  onApprove: (requestId: string) => Promise<void>,
  onReject: (requestId: string) => Promise<void>,
  onSelect?: (requestId: string, selected: boolean) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onApprove(request.id);
    } finally {
      setIsProcessing(false);
    }
  }, [request.id, onApprove]);

  const handleReject = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onReject(request.id);
    } finally {
      setIsProcessing(false);
    }
  }, [request.id, onReject]);

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSelect?.(request.id, e.target.checked);
    },
    [request.id, onSelect]
  );

  const getStatusBadge = useCallback(() => {
    switch (request.status) {
      case "approved":
        return { text: "✅ 승인됨", className: "text-green-400 text-sm" };
      case "rejected":
        return { text: "❌ 거절됨", className: "text-red-400 text-sm" };
      default:
        return null;
    }
  }, [request.status]);

  return {
    isProcessing,
    handleApprove,
    handleReject,
    handleCheckboxChange,
    getStatusBadge,
  };
};

// 가입 요청 페이지 훅
export const useJoinRequestsPage = () => {
  const params = useParams();
  const serverUrl = params.server_id as string;

  const serverInfo = useCurrentServerInfo();

  // 서버 목록을 조회하여 현재 사용자의 role 확인
  const serverListQuery = useServerListQuery(true);

  // 현재 서버에서의 사용자 role 찾기
  const currentServerRole = serverListQuery.data?.find(
    (server) => server.serverUrl === serverInfo?.serverUrl
  )?.serverRole;

  // 관리자 권한 확인 (owner 또는 admin)
  const isAdmin =
    currentServerRole === "owner" || currentServerRole === "admin";

  // 상태 관리
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set()
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // API 호출 - 관리자 권한이 있을 때만
  const {
    data: serverAccessList = [],
    isLoading,
    error,
    refetch,
  } = useServerAccessQuery(serverUrl, {
    enabled: isAdmin, // 관리자 권한이 있을 때만 API 호출
  });

  const patchServerAccessMutation = usePatchServerAccessMutation(serverUrl);

  // 데이터 변환 및 계산
  const requests = useMemo(() => {
    return serverAccessList?.map(mapServerAccessToJoinRequest);
  }, [serverAccessList]);

  const filteredRequests = useMemo(() => {
    if (filterStatus === "all") return requests;
    return requests?.filter((request) => request.status === filterStatus);
  }, [requests, filterStatus]);

  const pendingCount = useMemo(() => {
    return (
      requests?.filter((request) => request.status === "pending").length || 0
    );
  }, [requests]);

  const isProcessing = useMemo(() => {
    return isLoading || patchServerAccessMutation.isPending;
  }, [isLoading, patchServerAccessMutation.isPending]);

  // 핸들러 함수들
  const handleApprove = useCallback(
    async (userEmail: string) => {
      try {
        console.log("가입 요청 승인:", userEmail);

        await patchServerAccessMutation.mutateAsync({
          status: "Approved",
          userEmail: userEmail,
        });

        refetch();
        console.log("✅ 가입 요청 승인 완료");
      } catch (error) {
        console.error("❌ 가입 요청 승인 실패:", error);
      }
    },
    [serverUrl, patchServerAccessMutation, refetch]
  );

  const handleReject = useCallback(
    async (userEmail: string) => {
      try {
        console.log("가입 요청 거절:", userEmail);

        await patchServerAccessMutation.mutateAsync({
          status: "Banned",
          userEmail: userEmail,
        });

        refetch();
        console.log("✅ 가입 요청 거절 완료");
      } catch (error) {
        console.error("❌ 가입 요청 거절 실패:", error);
      }
    },
    [serverUrl, patchServerAccessMutation, refetch]
  );

  const handleBulkApprove = useCallback(async () => {
    const selectedIds = Array.from(selectedRequests);

    try {
      await Promise.all(selectedIds.map((id) => handleApprove(id)));
      setSelectedRequests(new Set());
      setSelectedAll(false);
      console.log("✅ 일괄 승인 완료");
    } catch (error) {
      console.error("❌ 일괄 승인 실패:", error);
    }
  }, [selectedRequests, handleApprove]);

  const handleBulkReject = useCallback(async () => {
    const selectedIds = Array.from(selectedRequests);

    try {
      await Promise.all(selectedIds.map((id) => handleReject(id)));
      setSelectedRequests(new Set());
      setSelectedAll(false);
      console.log("✅ 일괄 거절 완료");
    } catch (error) {
      console.error("❌ 일괄 거절 실패:", error);
    }
  }, [selectedRequests, handleReject]);

  const handleSelectRequest = useCallback(
    (requestId: string, selected: boolean) => {
      setSelectedRequests((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(requestId);
        } else {
          newSet.delete(requestId);
          setSelectedAll(false);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedAll(checked);
      if (checked) {
        setSelectedRequests(
          new Set(
            filteredRequests
              ?.filter((r) => r.status === "pending")
              .map((r) => r.id)
          )
        );
      } else {
        setSelectedRequests(new Set());
      }
    },
    [filteredRequests]
  );

  const handleFilterChange = useCallback(
    (status: "all" | "pending" | "approved" | "rejected") => {
      setFilterStatus(status);
    },
    []
  );

  // 에러 로깅
  if (error) {
    console.error("❌ 서버 가입 요청 목록 조회 실패:", error);
  }

  return {
    // 상태
    selectedAll,
    selectedRequests,
    filterStatus,

    // 데이터
    requests: isAdmin ? requests : [],
    filteredRequests: isAdmin ? filteredRequests : [],
    pendingCount: isAdmin ? pendingCount : 0,
    isLoading: isAdmin ? isLoading : false,
    error: isAdmin ? error : null,
    isProcessing: isAdmin ? isProcessing : false,

    // 권한 정보
    isAdmin,

    // 핸들러
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleBulkReject,
    handleSelectRequest,
    handleSelectAll,
    handleFilterChange,
    refetch,
  };
};
