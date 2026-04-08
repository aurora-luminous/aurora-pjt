import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useUserMemberListQuery } from "@/app/(server-setup)/hooks/useServerMutation";
import { useMemberRoleManagement } from "./useAdmin";

export const useMembersPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;

  // 실제 API 훅 사용
  const {
    data: memberList,
    isLoading,
    error: memberListError,
    refetch,
  } = useUserMemberListQuery(serverId);
  const { handleChangeMemberRole, isChanging } = useMemberRoleManagement();

  // 상태 관리
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 필터링된 멤버 목록
  const filteredMembers = useMemo(() => {
    return memberList?.filter((member) => {
      // 검색 필터
      const matchesSearch =
        !searchQuery ||
        member.userInfo.userName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        member.userInfo.userEmail
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // 역할 필터
      const matchesRole =
        filterRole === "all" || member.serverRole === filterRole;

      // 상태 필터
      const matchesStatus =
        filterStatus === "all" ||
        member.pStatus === filterStatus ||
        member.pStatus === "Active" ||
        member.pStatus === "Inactive" ||
        member.pStatus === "Pending";

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [memberList, searchQuery, filterRole, filterStatus]);

  // 전체 선택 상태
  const selectedAll = useMemo(() => {
    const selectableMembers = filteredMembers?.filter(
      (m) => m.serverRole !== "owner",
    );
    return (
      selectableMembers &&
      selectableMembers.length > 0 &&
      selectableMembers.every((member) =>
        selectedMembers.has(member.userInfo.userName),
      )
    );
  }, [filteredMembers, selectedMembers]);

  // 핸들러 함수들
  const handleSelectMember = useCallback(
    (memberId: string, selected: boolean) => {
      setSelectedMembers((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(memberId);
        } else {
          newSet.delete(memberId);
        }
        return newSet;
      });
    },
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const selectableMembers = filteredMembers
          ?.filter((m) => m.serverRole !== "owner")
          .map((m) => m.userInfo.userName);
        setSelectedMembers(new Set(selectableMembers));
      } else {
        setSelectedMembers(new Set());
      }
    },
    [filteredMembers],
  );

  const handleFilterChange = useCallback(
    (type: "role" | "status", value: string) => {
      if (type === "role") {
        setFilterRole(value);
      } else {
        setFilterStatus(value);
      }
      // 필터 변경 시 선택 초기화
      setSelectedMembers(new Set());
    },
    [],
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // 검색어 변경 시 선택 초기화
    setSelectedMembers(new Set());
  }, []);

  const handleBulkKick = useCallback(async () => {
    const selectedIds = Array.from(selectedMembers);
    console.log("⚠️ 일괄 킥 기능은 현재 구현되지 않았습니다:", selectedIds);
    alert("일괄 킥 기능은 현재 지원하지 않습니다. 개별적으로 처리해주세요.");

    // TODO: 서버에서 일괄 킥 API가 제공되면 구현
    // try {
    //   await kickMembers(serverId, selectedIds);
    //   setSelectedMembers(new Set());
    //   refetch();
    //   console.log("✅ 일괄 킥 완료");
    // } catch (error) {
    //   console.error("❌ 일괄 킥 실패:", error);
    // }
  }, [selectedMembers]);

  const handleBulkBan = useCallback(async () => {
    const selectedIds = Array.from(selectedMembers);
    console.log("⚠️ 일괄 차단 기능은 현재 구현되지 않았습니다:", selectedIds);
    alert("일괄 차단 기능은 현재 지원하지 않습니다. 개별적으로 처리해주세요.");

    // TODO: 서버에서 일괄 차단 API가 제공되면 구현
    // try {
    //   await banMembers(serverId, selectedIds);
    //   setSelectedMembers(new Set());
    //   refetch();
    //   console.log("✅ 일괄 차단 완료");
    // } catch (error) {
    //   console.error("❌ 일괄 차단 실패:", error);
    // }
  }, [selectedMembers]);

  const handleRoleChange = useCallback(
    async (userEmail: string, newRole: string) => {
      console.log("역할 변경:", { userEmail, newRole });

      // 역할 유효성 검사
      if (newRole !== "member" && newRole !== "admin") {
        console.error("❌ 유효하지 않은 역할:", newRole);
        alert("유효하지 않은 역할입니다. (member 또는 admin만 가능)");
        return;
      }

      try {
        // 실제 API 호출
        await handleChangeMemberRole(userEmail, newRole as "member" | "admin");

        // 성공 후 목록 새로고침
        refetch();
        console.log("✅ 역할 변경 완료");
      } catch (error) {
        console.error("❌ 역할 변경 실패:", error);
        alert("역할 변경에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [handleChangeMemberRole, refetch],
  );

  return {
    // 데이터
    memberList,
    filteredMembers,
    selectedMembers,
    filterRole,
    filterStatus,
    searchQuery,
    isLoading,
    memberListError,
    selectedAll,
    isChanging, // 역할 변경 중 상태 추가

    // 핸들러
    handleSelectMember,
    handleSelectAll,
    handleFilterChange,
    handleSearchChange,
    handleBulkKick,
    handleBulkBan,
    handleRoleChange,
  };
};
