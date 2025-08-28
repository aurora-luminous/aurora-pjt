import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Role, Permission } from "../[server_id]/admin/components/RoleCard";

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const defaultPermissions: Permission[] = [
  {
    id: "view_channels",
    name: "채널 보기",
    description: "텍스트 및 음성 채널을 볼 수 있습니다",
    enabled: true,
  },
  {
    id: "send_messages",
    name: "메시지 보내기",
    description: "텍스트 채널에 메시지를 보낼 수 있습니다",
    enabled: true,
  },
  {
    id: "connect_voice",
    name: "음성 연결",
    description: "음성 채널에 연결할 수 있습니다",
    enabled: true,
  },
  {
    id: "speak",
    name: "말하기",
    description: "음성 채널에서 말할 수 있습니다",
    enabled: true,
  },
  {
    id: "manage_messages",
    name: "메시지 관리",
    description: "다른 사용자의 메시지를 삭제할 수 있습니다",
    enabled: false,
  },
  {
    id: "manage_channels",
    name: "채널 관리",
    description: "채널을 생성, 수정, 삭제할 수 있습니다",
    enabled: false,
  },
  {
    id: "kick_members",
    name: "멤버 추방",
    description: "멤버를 서버에서 추방할 수 있습니다",
    enabled: false,
  },
  {
    id: "ban_members",
    name: "멤버 차단",
    description: "멤버를 서버에서 차단할 수 있습니다",
    enabled: false,
  },
  {
    id: "manage_roles",
    name: "역할 관리",
    description: "역할을 생성, 수정, 삭제할 수 있습니다",
    enabled: false,
  },
  {
    id: "administrator",
    name: "관리자",
    description: "모든 권한을 가집니다",
    enabled: false,
  },
];

const mockRoles: Role[] = [
  {
    id: "owner",
    name: "Owner",
    color: "#FFD700",
    permissions: defaultPermissions.map((p) => ({ ...p, enabled: true })),
    memberCount: 1,
    isOwner: true,
  },
  {
    id: "admin",
    name: "Admin",
    color: "#FF6B6B",
    permissions: defaultPermissions.map((p) => ({
      ...p,
      enabled: p.id !== "administrator",
    })),
    memberCount: 2,
  },
  {
    id: "member",
    name: "Member",
    color: "#95A5A6",
    permissions: defaultPermissions.map((p) => ({
      ...p,
      enabled: [
        "view_channels",
        "send_messages",
        "connect_voice",
        "speak",
      ].includes(p.id),
    })),
    memberCount: 50,
    isDefault: true,
  },
];

export const useRolesPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;

  // 상태 관리
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // 역할 생성
  const handleCreateRole = useCallback(
    async (roleData: Omit<Role, "id" | "memberCount">) => {
      console.log("역할 생성:", roleData);

      try {
        // 실제 API 호출 로직
        // await createRole(serverId, roleData);

        const newRole: Role = {
          ...roleData,
          id: Date.now().toString(), // 임시 ID
          memberCount: 0,
        };

        setRoles((prev) => [...prev, newRole]);
        console.log("✅ 역할 생성 완료");
      } catch (error) {
        console.error("❌ 역할 생성 실패:", error);
      }
    },
    [serverId]
  );

  // 역할 수정
  const handleEditRole = useCallback(
    async (roleId: string, roleData: Partial<Role>) => {
      console.log("역할 수정:", { roleId, roleData });

      try {
        // 실제 API 호출 로직
        // await updateRole(serverId, roleId, roleData);

        setRoles((prev) =>
          prev.map((role) =>
            role.id === roleId ? { ...role, ...roleData } : role
          )
        );
        console.log("✅ 역할 수정 완료");
      } catch (error) {
        console.error("❌ 역할 수정 실패:", error);
      }
    },
    [serverId]
  );

  // 역할 삭제
  const handleDeleteRole = useCallback(
    async (roleId: string) => {
      console.log("역할 삭제:", roleId);

      try {
        // 실제 API 호출 로직
        // await deleteRole(serverId, roleId);

        setRoles((prev) => prev.filter((role) => role.id !== roleId));
        console.log("✅ 역할 삭제 완료");
      } catch (error) {
        console.error("❌ 역할 삭제 실패:", error);
      }
    },
    [serverId]
  );

  // 권한 변경
  const handlePermissionChange = useCallback(
    async (roleId: string, permissionId: string, enabled: boolean) => {
      console.log("권한 변경:", { roleId, permissionId, enabled });

      try {
        // 실제 API 호출 로직
        // await updateRolePermission(serverId, roleId, permissionId, enabled);

        setRoles((prev) =>
          prev.map((role) =>
            role.id === roleId
              ? {
                  ...role,
                  permissions: role.permissions.map((permission) =>
                    permission.id === permissionId
                      ? { ...permission, enabled }
                      : permission
                  ),
                }
              : role
          )
        );
        console.log("✅ 권한 변경 완료");
      } catch (error) {
        console.error("❌ 권한 변경 실패:", error);
      }
    },
    [serverId]
  );

  return {
    // 데이터
    roles,
    isLoading,
    error,
    showCreateModal,
    showEditModal,
    editingRole,

    // 상태 설정
    setShowCreateModal,
    setShowEditModal,
    setEditingRole,

    // 핸들러
    handleCreateRole,
    handleEditRole,
    handleDeleteRole,
    handlePermissionChange,
  };
};
