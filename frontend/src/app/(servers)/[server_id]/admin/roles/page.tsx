"use client";

import React from "react";
import { useRolesPage } from "@/app/(servers)/[server_id]/admin/hooks/useRoles";
import RoleCard from "../components/RoleCard";
import { useResponsive } from "../../../../lib/useResponsive";
import { useAdminPermission } from "../hooks/useAdmin";

const RolesPage = () => {
  const { isMobile } = useResponsive();
  const {
    isAdmin,
    currentServerRole,
    isLoading: permissionLoading,
  } = useAdminPermission();
  const {
    roles,
    isLoading,
    error,
    isChanging,
    handleDeleteRole,
    handlePermissionChange,
  } = useRolesPage();

  // 권한 확인 로딩 중일 때
  if (permissionLoading) {
    return (
      <div className="flex h-full bg-gray-900 items-center justify-center">
        <div className={`text-white text-center ${isMobile ? "px-4" : "px-0"}`}>
          <div className={`mb-4 ${isMobile ? "text-base" : "text-lg"}`}>
            권한을 확인하는 중...
          </div>
          <div
            className={`
            border-2 border-white border-t-transparent rounded-full animate-spin mx-auto
            ${isMobile ? "w-6 h-6" : "w-8 h-8"}
          `}
          ></div>
        </div>
      </div>
    );
  }

  // 권한이 없는 경우
  if (!isAdmin) {
    return (
      <div className="flex h-full bg-gray-900 items-center justify-center">
        <div
          className={`
          text-center bg-red-900/20 border border-red-600 rounded-lg
          ${isMobile ? "p-6 mx-4 max-w-sm" : "p-8 max-w-md"}
        `}
        >
          <div
            className={`
            text-red-400 mb-4
            ${isMobile ? "text-4xl" : "text-6xl"}
          `}
          >
            🚫
          </div>
          <h1
            className={`
            text-white font-bold mb-2
            ${isMobile ? "text-xl" : "text-2xl"}
          `}
          >
            접근 권한이 없습니다
          </h1>
          <p
            className={`
            text-gray-300 mb-4
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            관리자 페이지는 서버 소유자 또는 관리자만 접근할 수 있습니다.
          </p>
          <p
            className={`
            text-gray-400
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            현재 권한:{" "}
            <span className="text-yellow-400">
              {currentServerRole ? currentServerRole.serverRole : "Member"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`h-full bg-gray-900 overflow-auto ${
          isMobile ? "p-4" : "p-6"
        }`}
      >
        <div className="flex items-center justify-center h-64">
          <div
            className={`text-gray-400 ${isMobile ? "text-sm" : "text-base"}`}
          >
            역할 목록을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`h-full bg-gray-900 overflow-auto ${
          isMobile ? "p-4" : "p-6"
        }`}
      >
        <div className="flex items-center justify-center h-64">
          <div className={`text-red-400 ${isMobile ? "text-sm" : "text-base"}`}>
            역할 목록을 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isMobile ? "p-4" : "p-6"}`}>
      {/* 헤더 */}
      <div className="mb-6">
        <h1
          className={`font-bold text-white mb-2 ${
            isMobile ? "text-xl" : "text-2xl"
          }`}
        >
          역할 관리
        </h1>
        <p className={`text-gray-400 ${isMobile ? "text-sm" : "text-base"}`}>
          서버의 각 역할이 가질 수 있는 권한을 설정하세요.
        </p>
      </div>

      {/* 안내 메시지 */}
      <div
        className={`mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg ${
          isMobile ? "p-3" : "p-4"
        }`}
      >
        <div
          className={`flex items-start ${isMobile ? "space-x-2" : "space-x-3"}`}
        >
          <span
            className={`text-blue-400 ${isMobile ? "text-base" : "text-lg"}`}
          >
            💡
          </span>
          <div>
            <h3
              className={`text-blue-200 font-medium mb-1 ${
                isMobile ? "text-sm" : "text-base"
              }`}
            >
              역할 권한 안내
            </h3>
            <p className={`text-blue-300 ${isMobile ? "text-xs" : "text-sm"}`}>
              각 역할(Owner, Admin, Member)이 가질 수 있는 권한을 설정합니다.
              권한을 변경하면 해당 역할을 가진 모든 멤버에게 적용됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 역할 목록 */}
      <div className="space-y-4">
        {roles.map((role, index) => (
          <RoleCard
            key={role.id}
            role={role}
            position={index + 1}
            onEdit={() => {}} // 빈 함수 (편집 기능 미사용)
            onDelete={handleDeleteRole}
            onPermissionChange={handlePermissionChange}
            isChanging={isChanging}
          />
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <div
            className={`text-gray-400 mb-4 ${
              isMobile ? "text-sm" : "text-base"
            }`}
          >
            역할 정보를 불러올 수 없습니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
