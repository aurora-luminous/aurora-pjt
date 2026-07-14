"use client";

import React, { useState, useEffect } from "react";
import { Role } from "./RoleCard";

interface EditRoleModalProps {
  role: Role;
  onClose: () => void;
  onSubmit: (roleId: string, roleData: Partial<Role>) => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  role,
  onClose,
  onSubmit,
}) => {
  const [roleName, setRoleName] = useState(role.name);
  const [roleColor, setRoleColor] = useState(role.color);
  const [permissions, setPermissions] = useState(role.permissions);

  useEffect(() => {
    setRoleName(role.name);
    setRoleColor(role.color);
    setPermissions(role.permissions);
  }, [role]);

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === permissionId
          ? { ...permission, enabled: !permission.enabled }
          : permission
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      alert("역할 이름을 입력해주세요.");
      return;
    }

    onSubmit(role.id, {
      name: roleName.trim(),
      color: roleColor,
      permissions,
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
            <h2 className="text-xl font-bold text-white">역할 수정</h2>
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
              disabled={role.isOwner}
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
                disabled={role.isOwner}
              />
              <div className="flex space-x-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setRoleColor(color)}
                    disabled={role.isOwner}
                    className={`w-8 h-8 rounded border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
              <span className="text-white font-medium">{roleName}</span>
            </div>
          </div>

          {/* 권한 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              권한
            </label>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-3">
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className={`flex items-start space-x-3 p-2 rounded transition-colors ${
                      role.isOwner
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-600 cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={permission.enabled}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="mt-1 rounded border-gray-500 bg-gray-600"
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
            {role.isOwner && (
              <p className="text-yellow-400 text-sm mt-2">
                소유자 역할의 권한은 수정할 수 없습니다.
              </p>
            )}
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
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoleModal;
