"use client";

import React, { useState } from "react";
import { MemberInfo } from "@/app/(server-setup)/types/Server";

interface MemberCardProps {
  member: MemberInfo;
  isSelected: boolean;
  onSelect: (memberId: string, selected: boolean) => void;
  onRoleChange: (memberId: string, newRole: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isSelected,
  onSelect,
  onRoleChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-400";
      case "inactive":
        return "bg-yellow-400";
      case "dnd":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "온라인";
      case "inactive":
        return "자리비움";
      case "dnd":
        return "방해금지";
      default:
        return "오프라인";
    }
  };

  const roles = ["멤버", "관리자", "소유자"];

  return (
    <div className="px-4 py-3 hover:bg-gray-700 transition-colors">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(member.userInfo.userName, e.target.checked)}
          className="mr-4 rounded border-gray-600 bg-gray-700"
          disabled={member.serverRole === "owner"}
        />
        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
          {/* 사용자 정보 */}
          <div className="col-span-4 flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                {member.userInfo.ProfileImageUrl ? (
                  <img
                    src={member.userInfo.ProfileImageUrl}
                    alt={member.userInfo.userName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {member.userInfo.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(
                  member.pStatus || "offline"
                )} rounded-full border-2 border-gray-800`}
              ></div>
            </div>
            <div>
              <div className="text-white font-medium flex items-center">
                {member.userInfo.userName}
                {member.serverRole === "owner" && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                    소유자
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-sm">
                {member.userInfo.userEmail}
              </div>
            </div>
          </div>

          {/* 역할 */}
          <div className="col-span-3">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-left w-full px-3 py-1 bg-gray-700 rounded text-white text-sm hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={member.serverRole === "owner"}
              >
                {member.serverRole === "owner" ? (
                  <svg
                    className="inline ml-2 w-4 h-4"
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
                ) : member.serverRole === "admin" ? (
                  "관리자"
                ) : (
                  "멤버"
                )}
              </button>
              {showDropdown && member.serverRole !== "owner" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-gray-700 rounded shadow-lg z-50 border border-gray-600">
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(member.userInfo.userName, role);
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-white text-sm hover:bg-gray-600 transition-colors first:rounded-t last:rounded-b"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 상태 */}
          <div className="col-span-2">
            <span className="text-gray-300 text-sm">
              {getStatusText(member.pStatus || "offline")}
            </span>
          </div>

          {/* 작업 */}
          <div className="col-span-1">
            {member.serverRole !== "owner" && (
              <div className="flex space-x-1">
                <button
                  title="메시지 보내기"
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                >
                  💬
                </button>
                <button
                  title="킥하기"
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                >
                  👢
                </button>
                <button
                  title="차단하기"
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                >
                  🚫
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
