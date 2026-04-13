"use client";

import React, { useState } from "react";
import { Role } from "./RoleCard";
import { RolePermissionUI } from "@/app/(servers)/types";


interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (roleData: Omit<Role, "id" | "memberCount">) => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [roleName, setRoleName] = useState("");
  const [roleColor, setRoleColor] = useState("#5865F2");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );

  const availablePermissions: RolePermissionUI[] = [
    {
      id: "view_channels",
      name: "채널 보기",
      description: "텍스트 및 음성 채널을 볼 수 있습니다",
      enabled: false,
    },
    {
      id: "send_messages",
      name: "메시지 보내기",
      description: "텍스트 채널에 메시지를 보낼 수 있습니다",
      enabled: false,
    },
    {
      id: "connect_voice",
      name: "음성 연결",
      description: "음성 채널에 연결할 수 있습니다",
      enabled: false,
    },
    {
      id: "speak",
      name: "말하기",
      description: "음성 채널에서 말할 수 있습니다",
      enabled: false,
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

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      alert("역할 이름을 입력해주세요.");
      return;
    }

    const permissions = availablePermissions.map((permission) => ({
      ...permission,
      enabled: selectedPermissions.has(permission.id),
    }));

    onSubmit({
      name: roleName.trim(),
      color: roleColor,
      permissions,
      isDefault: false,
      isOwner: false,
    });

    onClose();
  };

  const predefinedColors = [
    "#5865F2",
    "#57F287",
    "#FEE75C",
    "#ED4245",
    "#EB459E",
    "#FF7A00",
    "#00D9FF",
    "#9C27B0",
    "#607D8B",
    "#795548",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">새 역할 만들기</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 역할 이름 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              역할 이름 *
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="예: Admin"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 역할 색상 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              역할 색상
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={roleColor}
                onChange={(e) => setRoleColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-600 bg-gray-700"
              />
              <div className="flex space-x-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setRoleColor(color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      roleColor === color
                        ? "border-white scale-110"
                        : "border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: roleColor }}
              ></div>
              <span className="text-white font-medium">
                {roleName || "새 역할"}
              </span>
            </div>
          </div>

          {/* 권한 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              권한
            </label>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-3">
                {availablePermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="mt-1 rounded border-gray-500 bg-gray-600"
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
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              역할 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal;
