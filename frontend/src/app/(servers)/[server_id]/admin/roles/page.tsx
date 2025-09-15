"use client";

import React from "react";
import { useRolesPage } from "@/app/(servers)/hooks/useRoles";
import RoleCard from "../components/RoleCard";
import CreateRoleModal from "../components/CreateRoleModal";
import EditRoleModal from "../components/EditRoleModal";
import { useResponsive } from "../../../../lib/useResponsive";
import { useAdminPermission } from "../../../hooks/useAdmin";

const RolesPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const {
    isAdmin,
    currentServerRole,
    isLoading: permissionLoading,
  } = useAdminPermission();
  const {
    roles,
    isLoading,
    error,
    showCreateModal,
    showEditModal,
    editingRole,
    handleCreateRole,
    handleEditRole,
    handleDeleteRole,
    handlePermissionChange,
    setShowCreateModal,
    setShowEditModal,
    setEditingRole,
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
              {currentServerRole || "member"}
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
      <div
        className={`mb-6 ${
          isMobile
            ? "flex flex-col space-y-4"
            : "flex items-center justify-between"
        }`}
      >
        <div>
          <h1
            className={`font-bold text-white mb-2 ${
              isMobile ? "text-xl" : "text-2xl"
            }`}
          >
            역할
          </h1>
          <p className={`text-gray-400 ${isMobile ? "text-sm" : "text-base"}`}>
            서버 권한을 관리하고 멤버에게 역할을 할당하세요. 총 {roles.length}
            개의 역할
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${
            isMobile
              ? "px-3 py-2 text-sm space-x-1 w-full justify-center"
              : "px-4 py-2 space-x-2"
          }`}
        >
          <span>➕</span>
          <span>역할 만들기</span>
        </button>
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
              역할 관리 팁
            </h3>
            <p className={`text-blue-300 ${isMobile ? "text-xs" : "text-sm"}`}>
              역할은 위에서 아래로 우선순위가 적용됩니다. 드래그하여 순서를
              변경할 수 있습니다.
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
            onEdit={(role) => {
              setEditingRole(role);
              setShowEditModal(true);
            }}
            onDelete={handleDeleteRole}
            onPermissionChange={handlePermissionChange}
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
            아직 생성된 역할이 없습니다.
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              isMobile ? "px-4 py-2 text-sm" : "px-6 py-3"
            }`}
          >
            첫 번째 역할 만들기
          </button>
        </div>
      )}

      {/* 모달들 */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRole}
        />
      )}

      {showEditModal && editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => {
            setShowEditModal(false);
            setEditingRole(null);
          }}
          onSubmit={handleEditRole}
        />
      )}
    </div>
  );
};

export default RolesPage;
