"use client";

import React, { useState } from "react";
import { MemberInfo } from "@/app/(server-setup)/types/Server";
import { useResponsive } from "../../../../lib/useResponsive";

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
  const { isMobile } = useResponsive();
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
    <div
      className={`
      hover:bg-gray-700 transition-colors
      ${isMobile ? "px-3 py-2" : "px-4 py-3"}
    `}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(member.userInfo.userName, e.target.checked)}
          className={`
            rounded border-gray-600 bg-gray-700
            ${isMobile ? "mr-2" : "mr-4"}
          `}
          disabled={member.serverRole === "owner"}
        />
        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
          {/* 사용자 정보 */}
          <div className="col-span-4 flex items-center space-x-3">
            <div className="relative">
              <div
                className={`
                bg-blue-600 rounded-full flex items-center justify-center
                ${isMobile ? "w-8 h-8" : "w-10 h-10"}
              `}
              >
                {member.userInfo.ProfileImageUrl ? (
                  <img
                    src={member.userInfo.ProfileImageUrl}
                    alt={member.userInfo.userName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={`
                    text-white font-semibold
                    ${isMobile ? "text-xs" : "text-sm"}
                  `}
                  >
                    {member.userInfo.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div
                className={`
                  absolute -bottom-0.5 -right-0.5 ${getStatusColor(
                    member.pStatus || "offline"
                  )} rounded-full border-2 border-gray-800
                  ${isMobile ? "w-2 h-2" : "w-3 h-3"}
                `}
              ></div>
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`
                text-white font-medium
                ${isMobile ? "text-sm" : "text-base"}
              `}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`
                    truncate
                    ${
                      member.serverRole === "owner" && isMobile
                        ? "max-w-[6rem]"
                        : ""
                    }
                  `}
                  >
                    {member.userInfo.userName}
                  </span>
                  {member.serverRole === "owner" && (
                    <span
                      className={`
                      px-1.5 py-0.5 bg-yellow-600 text-yellow-100 rounded-full flex-shrink-0
                      ${isMobile ? "text-xs px-1 py-0" : "text-xs px-2 py-0.5"}
                    `}
                    >
                      {isMobile ? "소유" : "소유자"}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`
                text-gray-400 truncate
                ${isMobile ? "text-xs" : "text-sm"}
              `}
              >
                {member.userInfo.userEmail}
              </div>
            </div>
          </div>

          {/* 역할 */}
          <div className="col-span-3">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`
                  text-left w-full bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isMobile ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"}
                `}
                disabled={member.serverRole === "owner"}
              >
                {member.serverRole === "owner"
                  ? "소유자"
                  : member.serverRole === "admin"
                  ? "관리자"
                  : "멤버"}
                {member.serverRole !== "owner" && (
                  <svg
                    className={`
                      inline ml-2
                      ${isMobile ? "w-3 h-3" : "w-4 h-4"}
                    `}
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
                      className={`
                        block w-full text-left text-white hover:bg-gray-600 transition-colors first:rounded-t last:rounded-b
                        ${isMobile ? "px-2 py-2 text-xs" : "px-3 py-2 text-sm"}
                      `}
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
            <span
              className={`
              text-gray-300
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              {getStatusText(member.pStatus || "offline")}
            </span>
          </div>

          {/* 작업 */}
          <div className="col-span-1">
            {member.serverRole !== "owner" && (
              <div
                className={`
                flex
                ${isMobile ? "space-x-0.5" : "space-x-1"}
              `}
              >
                <button
                  title="메시지 보내기"
                  className={`
                    text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors
                    ${isMobile ? "p-0.5 text-xs" : "p-1 text-sm"}
                  `}
                >
                  💬
                </button>
                <button
                  title="킥하기"
                  className={`
                    text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors
                    ${isMobile ? "p-0.5 text-xs" : "p-1 text-sm"}
                  `}
                >
                  👢
                </button>
                <button
                  title="차단하기"
                  className={`
                    text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors
                    ${isMobile ? "p-0.5 text-xs" : "p-1 text-sm"}
                  `}
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
