import { useParams } from "next/navigation";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import {
  useServerAccessQuery,
  usePatchServerAccessMutation,
  useServerListQuery,
  usePatchServerRolePermessionMutation,
  useServerRolePermessionQuery,
  useServerRoleMutation,
  useUserMemberListQuery,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { useMemo, useState, useCallback, useEffect } from "react";
import type { MemberInfo, Permission } from "@/app/(server-setup)/types";
import { mapServerAccessToJoinRequest } from "../../../services/admin.service";

// JoinRequest 타입 정의
export interface JoinRequest {
  id: string;
  userName: string;
  userAvatar?: string;
  message: string;
  requestDate: string;
  userEmail: string;
  sStatus: "Pending" | "Active" | "Inactive" | "Banned";
}

export const useAdminPermission = () => {
  const serverInfo = useCurrentServerInfo();
  const { data: serverList, isLoading } = useServerListQuery(true);

  const currentServerRole = serverList?.find(
    (s) => s.serverUrl === serverInfo?.serverUrl,
  );

  const isAdmin = currentServerRole
    ? currentServerRole.serverRole === "owner" ||
      currentServerRole.serverRole === "admin"
    : false;

  return {
    isAdmin,
    currentServerRole,
    isLoading, // 이제 react-query에서 제공하는 isLoading 사용
    error: null,
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
    (server) => server.serverUrl === serverInfo?.serverUrl,
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
      serverAccessList?.filter((access) => access.sStatus === "Pending")
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
  onSelect?: (requestId: string, selected: boolean) => void,
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
    [request.id, onSelect],
  );

  const getStatusBadge = useCallback(() => {
    switch (request.sStatus) {
      case "Active":
        return { text: "✅ 승인됨", className: "text-green-400 text-sm" };
      case "Inactive":
        return { text: "❌ 거절됨", className: "text-red-400 text-sm" };
      case "Banned":
        return { text: "❌ 차단됨", className: "text-red-400 text-sm" };
      default:
        return null;
    }
  }, [request.sStatus]);

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
    (server) => server.serverUrl === serverInfo?.serverUrl,
  )?.serverRole;

  // 관리자 권한 확인 (owner 또는 admin)
  const isAdmin =
    currentServerRole === "owner" || currentServerRole === "admin";

  // 상태 관리
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set(),
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Pending" | "Active" | "Inactive" | "Banned"
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

  useEffect(() => {
    if (isAdmin && serverUrl) {
      refetch();
    }
  }, [isAdmin, refetch, serverUrl]);

  const patchServerAccessMutation = usePatchServerAccessMutation(serverUrl);

  // 데이터 변환 및 계산
  const requests = useMemo(() => {
    return serverAccessList?.map(mapServerAccessToJoinRequest);
  }, [serverAccessList]);

  const filteredRequests = useMemo(() => {
    if (filterStatus === "all") return requests;
    return requests?.filter((request) => request.sStatus === filterStatus);
  }, [requests, filterStatus]);

  const pendingCount = useMemo(() => {
    return (
      requests?.filter((request) => request.sStatus === "Pending").length || 0
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
          sStatus: "Active",
          userEmail: userEmail,
        });

        refetch();
        console.log("✅ 가입 요청 승인 완료");
      } catch (error) {
        console.error("❌ 가입 요청 승인 실패:", error);
      }
    },
    [patchServerAccessMutation, refetch],
  );

  const handleReject = useCallback(
    async (userEmail: string) => {
      try {
        console.log("가입 요청 거절:", userEmail);

        await patchServerAccessMutation.mutateAsync({
          sStatus: "Inactive",
          userEmail: userEmail,
        });

        refetch();
        console.log("✅ 가입 요청 거절 완료");
      } catch (error) {
        console.error("❌ 가입 요청 거절 실패:", error);
      }
    },
    [patchServerAccessMutation, refetch],
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
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedAll(checked);
      if (checked) {
        setSelectedRequests(
          new Set(
            filteredRequests
              ?.filter((r) => r.sStatus === "Pending")
              .map((r) => r.id),
          ),
        );
      } else {
        setSelectedRequests(new Set());
      }
    },
    [filteredRequests],
  );

  const handleFilterChange = useCallback(
    (status: "all" | "Pending" | "Active" | "Inactive" | "Banned") => {
      setFilterStatus(status);
    },
    [],
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

// 역할별 권한(Permission) 관리 훅
export const useRolePermissions = () => {
  const params = useParams();
  const serverUrl = params.server_id as string;

  const { isAdmin } = useAdminPermission();

  // 역할별 권한 조회
  const {
    data: rolePermissionsData,
    isLoading,
    error,
    refetch,
  } = useServerRolePermessionQuery(serverUrl);

  const patchPermissionMutation =
    usePatchServerRolePermessionMutation(serverUrl);

  // 디버깅: API 응답 확인
  console.log("🔍 useRolePermissions - API 응답:", {
    rolePermissionsData,
    isAdmin,
    serverUrl,
    isLoading,
    error,
  });

  // 권한 변경 핸들러
  const handleChangePermission = useCallback(
    async (serverRole: string, permissions: Permission) => {
      try {
        console.log("권한 변경 시작:", { serverRole, permissions });

        await patchPermissionMutation.mutateAsync({
          serverRole,
          permissions: permissions,
        });

        refetch();
        console.log("✅ 권한 변경 완료");
      } catch (error) {
        console.error("❌ 권한 변경 실패:", error);
        throw error;
      }
    },
    [patchPermissionMutation, refetch],
  );

  const rolePermissions = isAdmin ? rolePermissionsData?.rolePermissions : [];

  console.log("🔍 useRolePermissions - 반환 데이터:", {
    rolePermissions,
    length: rolePermissions?.length,
  });

  return {
    rolePermissions,
    isLoading: isAdmin ? isLoading : false,
    error: isAdmin ? error : null,
    isAdmin,
    handleChangePermission,
    isChanging: patchPermissionMutation.isPending,
  };
};

// 멤버 역할(Role) 변경 훅
export const useMemberRoleManagement = () => {
  const params = useParams();
  const serverUrl = params.server_id as string;

  const { isAdmin } = useAdminPermission();

  // 멤버 목록 조회
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useUserMemberListQuery(serverUrl);

  const changeRoleMutation = useServerRoleMutation(serverUrl);

  // 단일 멤버 역할 변경
  const handleChangeMemberRole = useCallback(
    async (userEmail: string, newRole: "member" | "admin") => {
      try {
        console.log("멤버 역할 변경 시작:", { userEmail, newRole });

        await changeRoleMutation.mutateAsync({
          changes: [{ userEmail, newRole }],
        });

        refetch();
        console.log("✅ 멤버 역할 변경 완료");
      } catch (error) {
        console.error("❌ 멤버 역할 변경 실패:", error);
        throw error;
      }
    },
    [changeRoleMutation, refetch],
  );

  // 여러 멤버 역할 일괄 변경
  const handleBulkChangeMemberRole = useCallback(
    async (
      changes: Array<{ userEmail: string; newRole: "member" | "admin" }>,
    ) => {
      try {
        console.log("멤버 역할 일괄 변경 시작:", changes);

        await changeRoleMutation.mutateAsync({
          changes,
        });

        refetch();
        console.log("✅ 멤버 역할 일괄 변경 완료");
      } catch (error) {
        console.error("❌ 멤버 역할 일괄 변경 실패:", error);
        throw error;
      }
    },
    [changeRoleMutation, refetch],
  );

  // 역할별로 멤버 필터링
  const membersByRole = useMemo(() => {
    if (!members) {
      return { owners: [], admins: [], members: [] };
    }
    return {
      owners: members.filter((m: MemberInfo) => m.serverRole === "owner"),
      admins: members.filter((m: MemberInfo) => m.serverRole === "admin"),
      members: members.filter((m: MemberInfo) => m.serverRole === "member"),
    };
  }, [members]);

  return {
    members: isAdmin ? members : [],
    membersByRole: isAdmin
      ? membersByRole
      : { owners: [], admins: [], members: [] },
    isLoading: isAdmin ? isLoading : false,
    error: isAdmin ? error : null,
    isAdmin,
    handleChangeMemberRole,
    handleBulkChangeMemberRole,
    isChanging: changeRoleMutation.isPending,
    refetch,
  };
};
