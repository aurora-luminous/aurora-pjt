"use client";

import React, { useState } from "react";

export interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: Permission[];
  memberCount: number;
  isDefault?: boolean;
  isOwner?: boolean;
}

interface RoleCardProps {
  role: Role;
  position: number;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
  onPermissionChange: (
    roleId: string,
    permissionId: string,
    enabled: boolean
  ) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  position,
  onEdit,
  onDelete,
  onPermissionChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleDeleteClick = () => {
    if (role.isDefault || role.isOwner) return;

    if (confirm(`"${role.name}" 역할을 삭제하시겠습니까?`)) {
      onDelete(role.id);
    }
  };

  const enabledPermissions = role.permissions.filter((p) => p.enabled);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* 역할 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 순서 */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">#{position}</span>
              <div className="cursor-move text-gray-400 hover:text-white">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 6a2 2 0 112 2 2 2 0 01-2-2zM9 12a2 2 0 112 2 2 2 0 01-2-2zM9 18a2 2 0 112 2 2 2 0 01-2-2zM15 6a2 2 0 112 2 2 2 0 01-2-2zM15 12a2 2 0 112 2 2 2 0 01-2-2zM15 18a2 2 0 112 2 2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            {/* 역할 색상 */}
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color }}
            ></div>

            {/* 역할 정보 */}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">{role.name}</h3>
                {role.isDefault && (
                  <span className="px-2 py-0.5 bg-gray-600 text-gray-200 text-xs rounded">
                    기본
                  </span>
                )}
                {role.isOwner && (
                  <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">
                    소유자
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-sm">
                {role.memberCount}명의 멤버 • {enabledPermissions.length}개의
                권한
              </div>
            </div>
          </div>

          {/* 작업 버튼들 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="권한 보기"
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => onEdit(role)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="수정"
            >
              ✏️
            </button>
            {!role.isDefault && !role.isOwner && (
              <button
                onClick={handleDeleteClick}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                title="삭제"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 권한 목록 (확장 시) */}
      {expanded && (
        <div className="p-4">
          <h4 className="text-white font-medium mb-3">권한</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {role.permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start space-x-3 p-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={permission.enabled}
                  onChange={(e) =>
                    onPermissionChange(role.id, permission.id, e.target.checked)
                  }
                  className="mt-1 rounded border-gray-600 bg-gray-700"
                  disabled={role.isOwner}
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {permission.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {permission.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleCard;
