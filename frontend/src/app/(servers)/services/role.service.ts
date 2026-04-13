import type { RolePermissionUI, RoleUI } from "../types";
import type { RolePermisson } from "@/app/(server-setup)/types";

export const convertApiPermissionsToUIPermissions = (
  apiPermissions: RolePermisson
): RolePermissionUI[] => [
  {
    id: "kickMembers",
    name: "멤버 추방",
    description: "멤버를 서버에서 추방할 수 있습니다",
    enabled: apiPermissions.kickMembers,
  },
  {
    id: "banMembers",
    name: "멤버 차단",
    description: "멤버를 서버에서 차단할 수 있습니다",
    enabled: apiPermissions.banMembers,
  },
  {
    id: "manageRoles",
    name: "역할 관리",
    description: "역할을 생성하고 멤버의 역할을 변경할 수 있습니다",
    enabled: apiPermissions.manageRoles,
  },
];

export const getRoleDisplayInfo = (
  serverRole: string
): { name: string; color: string; isOwner?: boolean; isDefault?: boolean } => {
  switch (serverRole) {
    case "owner":
      return { name: "서버 오너", color: "#FFD700", isOwner: true };
    case "admin":
      return { name: "관리자", color: "#FF6B6B" };
    case "member":
      return { name: "멤버", color: "#95A5A6", isDefault: true };
    default:
      return { name: serverRole, color: "#6B7280" };
  }
};

export const convertApiRoleToUIRole = (
  apiRole: RolePermisson,
  memberCount: number = 0
): RoleUI => {
  const displayInfo = getRoleDisplayInfo(apiRole.serverRole);
  return {
    id: apiRole.serverRole,
    name: displayInfo.name,
    color: displayInfo.color,
    permissions: convertApiPermissionsToUIPermissions(apiRole),
    memberCount,
    isDefault: displayInfo.isDefault,
    isOwner: displayInfo.isOwner,
  };
};
