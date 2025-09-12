"use client";

import React, { useState } from "react";
import { useResponsive } from "../../../../lib/useResponsive";

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
  const { isMobile, isTablet } = useResponsive();
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
      <div className={`border-b border-gray-700 ${isMobile ? "p-3" : "p-4"}`}>
        <div
          className={`${
            isMobile ? "space-y-3" : "flex items-center justify-between"
          }`}
        >
          <div
            className={`flex items-center ${
              isMobile ? "space-x-2" : "space-x-4"
            }`}
          >
            {/* 순서 */}
            <div className="flex items-center space-x-2">
              <span
                className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
              >
                #{position}
              </span>
              <div className="cursor-move text-gray-400 hover:text-white">
                <svg
                  className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 6a2 2 0 112 2 2 2 0 01-2-2zM9 12a2 2 0 112 2 2 2 0 01-2-2zM9 18a2 2 0 112 2 2 2 0 01-2-2zM15 6a2 2 0 112 2 2 2 0 01-2-2zM15 12a2 2 0 112 2 2 2 0 01-2-2zM15 18a2 2 0 112 2 2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            {/* 역할 색상 */}
            <div
              className={`rounded-full ${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
              style={{ backgroundColor: role.color }}
            ></div>

            {/* 역할 정보 */}
            <div className="flex-1">
              <div
                className={`flex items-center ${
                  isMobile ? "space-x-1" : "space-x-2"
                }`}
              >
                <h3
                  className={`text-white font-medium ${
                    isMobile ? "text-sm" : "text-base"
                  }`}
                >
                  {role.name}
                </h3>
                {role.isDefault && (
                  <span
                    className={`bg-gray-600 text-gray-200 rounded ${
                      isMobile ? "px-1 py-0 text-xs" : "px-2 py-0.5 text-xs"
                    }`}
                  >
                    기본
                  </span>
                )}
                {role.isOwner && (
                  <span
                    className={`bg-yellow-600 text-yellow-100 rounded ${
                      isMobile ? "px-1 py-0 text-xs" : "px-2 py-0.5 text-xs"
                    }`}
                  >
                    소유자
                  </span>
                )}
              </div>
              <div
                className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
              >
                {role.memberCount}명의 멤버 • {enabledPermissions.length}개의
                권한
              </div>
            </div>
          </div>

          {/* 작업 버튼들 */}
          <div
            className={`flex items-center ${
              isMobile ? "space-x-1 ml-auto" : "space-x-2"
            }`}
          >
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors ${
                isMobile ? "p-1" : "p-2"
              }`}
              title="권한 보기"
            >
              <svg
                className={`transform transition-transform ${
                  expanded ? "rotate-180" : ""
                } ${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
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
              className={`text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors ${
                isMobile ? "p-1 text-xs" : "p-2"
              }`}
              title="수정"
            >
              ✏️
            </button>
            {!role.isDefault && !role.isOwner && (
              <button
                onClick={handleDeleteClick}
                className={`text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors ${
                  isMobile ? "p-1 text-xs" : "p-2"
                }`}
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
        <div className={`${isMobile ? "p-3" : "p-4"}`}>
          <h4
            className={`text-white font-medium mb-3 ${
              isMobile ? "text-sm" : "text-base"
            }`}
          >
            권한
          </h4>
          <div
            className={`gap-3 ${
              isMobile ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2"
            }`}
          >
            {role.permissions.map((permission) => (
              <label
                key={permission.id}
                className={`flex items-start rounded hover:bg-gray-700 transition-colors cursor-pointer ${
                  isMobile ? "space-x-2 p-2" : "space-x-3 p-2"
                }`}
              >
                <input
                  type="checkbox"
                  checked={permission.enabled}
                  onChange={(e) =>
                    onPermissionChange(role.id, permission.id, e.target.checked)
                  }
                  className={`rounded border-gray-600 bg-gray-700 ${
                    isMobile ? "mt-0.5" : "mt-1"
                  }`}
                  disabled={role.isOwner}
                />
                <div className="flex-1">
                  <div
                    className={`text-white font-medium ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {permission.name}
                  </div>
                  <div
                    className={`text-gray-400 ${
                      isMobile ? "text-xs" : "text-xs"
                    }`}
                  >
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
