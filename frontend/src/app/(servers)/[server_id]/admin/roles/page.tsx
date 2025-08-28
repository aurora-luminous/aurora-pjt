"use client";

import React from "react";
import { useRolesPage } from "@/app/(servers)/hooks/useRoles";
import RoleCard from "../components/RoleCard";
import CreateRoleModal from "../components/CreateRoleModal";
import EditRoleModal from "../components/EditRoleModal";

const RolesPage = () => {
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

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">역할 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">역할 목록을 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">역할</h1>
          <p className="text-gray-400">
            서버 권한을 관리하고 멤버에게 역할을 할당하세요. 총 {roles.length}
            개의 역할
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>역할 만들기</span>
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-400 text-lg">💡</span>
          <div>
            <h3 className="text-blue-200 font-medium mb-1">역할 관리 팁</h3>
            <p className="text-blue-300 text-sm">
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
          <div className="text-gray-400 mb-4">아직 생성된 역할이 없습니다.</div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
