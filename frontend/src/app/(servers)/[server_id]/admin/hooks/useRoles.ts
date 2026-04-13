import { useCallback, useMemo } from "react";
import { useRolePermissions } from "./useAdmin";
import { convertApiRoleToUIRole } from "../../../services/role.service";

export const useRolesPage = () => {
  // 실제 API 훅 사용
  const {
    rolePermissions,
    isLoading: permissionsLoading,
    error: permissionsError,
    handleChangePermission,
    isChanging,
  } = useRolePermissions();

  console.log("🔍 useRolesPage - rolePermissions:", {
    rolePermissions,
    length: rolePermissions?.length,
    type: typeof rolePermissions,
    isArray: Array.isArray(rolePermissions),
  });

  // API 데이터를 UI 형식으로 변환
  const roles = useMemo(() => {
    if (!rolePermissions || rolePermissions.length === 0) {
      console.log("⚠️ rolePermissions가 비어있음:", rolePermissions);
      return [];
    }

    const convertedRoles = rolePermissions.map((apiRole) => {
      // 멤버 수는 표시하지 않음 (역할 관리 페이지에서는 불필요)
      return convertApiRoleToUIRole(apiRole, 0);
    });

    console.log("✅ 변환된 roles:", convertedRoles);
    return convertedRoles;
  }, [rolePermissions]);

  const isLoading = permissionsLoading;
  const error = permissionsError;

  // 역할 삭제 (현재 API에서는 미지원 - 기본 역할만 존재)
  const handleDeleteRole = useCallback(async (roleId: string) => {
    console.log("⚠️ 역할 삭제는 현재 지원되지 않습니다:", roleId);
    alert("기본 역할(Owner, Admin, Member)은 삭제할 수 없습니다.");
  }, []);

  // 권한 변경 - 실제 API 호출
  const handlePermissionChangeWrapper = useCallback(
    async (roleId: string, permissionId: string, enabled: boolean) => {
      console.log("권한 변경:", { roleId, permissionId, enabled });

      try {
        // 현재 역할의 모든 권한 가져오기
        const currentRole = rolePermissions?.find(
          (r) => r.serverRole === roleId,
        );

        if (!currentRole) {
          console.error("역할을 찾을 수 없습니다:", roleId);
          return;
        }

        // 변경할 권한 객체 생성
        const updatedPermissions = {
          kickMembers: currentRole.kickMembers,
          banMembers: currentRole.banMembers,
          manageRoles: currentRole.manageRoles,
        };

        // 특정 권한만 업데이트
        if (permissionId === "kickMembers") {
          updatedPermissions.kickMembers = enabled;
        } else if (permissionId === "banMembers") {
          updatedPermissions.banMembers = enabled;
        } else if (permissionId === "manageRoles") {
          updatedPermissions.manageRoles = enabled;
        }

        // API 호출
        await handleChangePermission(roleId, updatedPermissions);

        console.log("✅ 권한 변경 완료");
      } catch (error) {
        console.error("❌ 권한 변경 실패:", error);
        alert("권한 변경에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [rolePermissions, handleChangePermission],
  );

  return {
    // 데이터
    roles,
    isLoading,
    error,
    isChanging, // 권한 변경 중 상태

    // 핸들러
    handleDeleteRole,
    handlePermissionChange: handlePermissionChangeWrapper,
  };
};
