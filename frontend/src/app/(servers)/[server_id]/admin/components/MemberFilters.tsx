"use client";

import React from "react";
import { useResponsive } from "../../../../lib/useResponsive";

interface MemberFiltersProps {
  filterRole: string;
  filterStatus: string;
  searchQuery: string;
  onFilterChange: (type: "role" | "status", value: string) => void;
  onSearchChange: (query: string) => void;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  filterRole,
  filterStatus,
  searchQuery,
  onFilterChange,
  onSearchChange,
}) => {
  const { isMobile } = useResponsive();

  const roles = [
    { value: "all", label: "모든 역할" },
    { value: "owner", label: "소유자" },
    { value: "admin", label: "관리자" },
    { value: "member", label: "멤버" },
  ];

  const statuses = [
    { value: "all", label: "모든 상태" },
    { value: "active", label: "활동중" },
    { value: "inactive", label: "자리비움" },
    { value: "dnd", label: "방해금지" },
    { value: "offline", label: "오프라인" },
  ];

  return (
    <div
      className={`
      mb-6 bg-gray-800 rounded-lg
      ${isMobile ? "p-3" : "p-4"}
    `}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 검색 */}
        <div>
          <label
            className={`
            block font-medium text-gray-300 mb-2
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            검색
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="사용자명 또는 이메일로 검색..."
              className={`
                w-full bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10
                ${isMobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-base"}
              `}
            />
            <svg
              className={`
                absolute right-3 text-gray-400
                ${isMobile ? "top-2 w-4 h-4" : "top-2.5 w-4 h-4"}
              `}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 역할 필터 */}
        <div>
          <label
            className={`
            block font-medium text-gray-300 mb-2
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            역할별 필터
          </label>
          <select
            value={filterRole}
            onChange={(e) => onFilterChange("role", e.target.value)}
            className={`
              w-full bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isMobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-base"}
            `}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* 상태 필터 */}
        <div>
          <label
            className={`
            block font-medium text-gray-300 mb-2
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            상태별 필터
          </label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className={`
              w-full bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isMobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-base"}
            `}
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 필터 초기화 */}
      {(filterRole !== "all" || filterStatus !== "all" || searchQuery) && (
        <div
          className={`
          mt-4 flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0
        `}
        >
          <div
            className={`
            flex items-center flex-wrap gap-2 text-gray-400
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            <span>필터 적용됨:</span>
            {filterRole !== "all" && (
              <span
                className={`
                px-2 py-1 bg-blue-600 text-blue-100 rounded
                ${isMobile ? "text-xs" : "text-xs"}
              `}
              >
                역할: {roles.find((r) => r.value === filterRole)?.label}
              </span>
            )}
            {filterStatus !== "all" && (
              <span
                className={`
                px-2 py-1 bg-green-600 text-green-100 rounded
                ${isMobile ? "text-xs" : "text-xs"}
              `}
              >
                상태: {statuses.find((s) => s.value === filterStatus)?.label}
              </span>
            )}
            {searchQuery && (
              <span
                className={`
                px-2 py-1 bg-purple-600 text-purple-100 rounded
                ${isMobile ? "text-xs" : "text-xs"}
              `}
              >
                검색: {searchQuery}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              onFilterChange("role", "all");
              onFilterChange("status", "all");
              onSearchChange("");
            }}
            className={`
              bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors
              ${
                isMobile
                  ? "px-3 py-1 text-sm w-full md:w-auto"
                  : "px-3 py-1 text-sm"
              }
            `}
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberFilters;
