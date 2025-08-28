import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Member } from "../[server_id]/admin/components/MemberCard";

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const mockMembers: Member[] = [
  {
    id: "1",
    userName: "김개발",
    userEmail: "kim@example.com",
    userAvatar: "",
    role: "Owner",
    joinDate: "2023-01-15",
    status: "online",
    isOwner: true,
  },
  {
    id: "2",
    userName: "이디자인",
    userEmail: "lee@example.com",
    userAvatar: "",
    role: "Admin",
    joinDate: "2023-02-20",
    status: "away",
  },
  {
    id: "3",
    userName: "박기획",
    userEmail: "park@example.com",
    userAvatar: "",
    role: "Member",
    joinDate: "2023-03-10",
    status: "online",
  },
  {
    id: "4",
    userName: "최마케팅",
    userEmail: "choi@example.com",
    userAvatar: "",
    role: "Member",
    joinDate: "2023-03-25",
    status: "offline",
  },
  {
    id: "5",
    userName: "정퍼블리셔",
    userEmail: "jung@example.com",
    userAvatar: "",
    role: "Member",
    joinDate: "2023-04-01",
    status: "dnd",
  },
];

export const useMembersPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;

  // 상태 관리
  const [members] = useState<Member[]>(mockMembers);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // 필터링된 멤버 목록
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // 검색 필터
      const matchesSearch =
        !searchQuery ||
        member.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

      // 역할 필터
      const matchesRole = filterRole === "all" || member.role === filterRole;

      // 상태 필터
      const matchesStatus =
        filterStatus === "all" || member.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, filterRole, filterStatus]);

  // 전체 선택 상태
  const selectedAll = useMemo(() => {
    const selectableMembers = filteredMembers.filter((m) => !m.isOwner);
    return (
      selectableMembers.length > 0 &&
      selectableMembers.every((member) => selectedMembers.has(member.id))
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
    []
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const selectableMembers = filteredMembers
          .filter((m) => !m.isOwner)
          .map((m) => m.id);
        setSelectedMembers(new Set(selectableMembers));
      } else {
        setSelectedMembers(new Set());
      }
    },
    [filteredMembers]
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
    []
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // 검색어 변경 시 선택 초기화
    setSelectedMembers(new Set());
  }, []);

  const handleBulkKick = useCallback(async () => {
    const selectedIds = Array.from(selectedMembers);
    console.log("일괄 킥:", selectedIds);

    // 실제 API 호출 로직
    try {
      // await kickMembers(serverId, selectedIds);
      setSelectedMembers(new Set());
      console.log("✅ 일괄 킥 완료");
    } catch (error) {
      console.error("❌ 일괄 킥 실패:", error);
    }
  }, [selectedMembers, serverId]);

  const handleBulkBan = useCallback(async () => {
    const selectedIds = Array.from(selectedMembers);
    console.log("일괄 차단:", selectedIds);

    // 실제 API 호출 로직
    try {
      // await banMembers(serverId, selectedIds);
      setSelectedMembers(new Set());
      console.log("✅ 일괄 차단 완료");
    } catch (error) {
      console.error("❌ 일괄 차단 실패:", error);
    }
  }, [selectedMembers, serverId]);

  const handleRoleChange = useCallback(
    async (memberId: string, newRole: string) => {
      console.log("역할 변경:", { memberId, newRole });

      // 실제 API 호출 로직
      try {
        // await updateMemberRole(serverId, memberId, newRole);
        console.log("✅ 역할 변경 완료");
      } catch (error) {
        console.error("❌ 역할 변경 실패:", error);
      }
    },
    [serverId]
  );

  return {
    // 데이터
    members,
    filteredMembers,
    selectedMembers,
    filterRole,
    filterStatus,
    searchQuery,
    isLoading,
    error,
    selectedAll,

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
