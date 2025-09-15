"use client";

import React from "react";
import { useMembersPage } from "@/app/(servers)/hooks/useMembers";
import { useResponsive } from "../../../../lib/useResponsive";
import { useAdminPermission } from "../../../hooks/useAdmin";
import MemberFilters from "../components/MemberFilters";
import BulkActions from "../components/BulkActions";
import MemberCard from "../components/MemberCard";

const MembersPage = () => {
  const { isMobile } = useResponsive();
  const {
    isAdmin,
    currentServerRole,
    isLoading: permissionLoading,
  } = useAdminPermission();
  const {
    memberList,
    filteredMembers,
    selectedMembers,
    filterRole,
    filterStatus,
    searchQuery,
    isLoading,
    memberListError,
    handleSelectMember,
    handleSelectAll,
    handleFilterChange,
    handleSearchChange,
    handleBulkKick,
    handleBulkBan,
    handleRoleChange,
    selectedAll,
  } = useMembersPage();

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
        className={`
        flex-1
        ${isMobile ? "p-4" : "p-6"}
      `}
      >
        <div className="flex items-center justify-center h-64">
          <div
            className={`
            text-gray-400
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            멤버 목록을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (memberListError) {
    return (
      <div
        className={`
        flex-1
        ${isMobile ? "p-4" : "p-6"}
      `}
      >
        <div className="flex items-center justify-center h-64">
          <div
            className={`
            text-red-400
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            멤버 목록을 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      flex-1
      ${isMobile ? "p-4" : "p-6"}
    `}
    >
      {/* 헤더 */}
      <div className="mb-6">
        <h1
          className={`
          font-bold text-white mb-2
          ${isMobile ? "text-xl" : "text-2xl"}
        `}
        >
          사람과 사용자
        </h1>
        <p
          className={`
          text-gray-400
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          서버 멤버를 관리하고 역할을 할당하세요.
        </p>
      </div>

      {/* 필터 및 검색 */}
      <MemberFilters
        filterRole={filterRole}
        filterStatus={filterStatus}
        searchQuery={searchQuery}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      {/* 일괄 작업 */}
      {selectedMembers.size > 0 && (
        <BulkActions
          selectedCount={selectedMembers.size}
          onBulkKick={handleBulkKick}
          onBulkBan={handleBulkBan}
        />
      )}

      {/* 멤버 목록 */}
      <div
        className={`
        bg-gray-800 rounded-lg overflow-visible
        ${isMobile ? "" : ""}
      `}
      >
        {/* 헤더 - 데스크탑에서만 표시 */}
        {!isMobile && (
          <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="mr-4 rounded border-gray-600 bg-gray-700"
              />
              <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
                <div className="col-span-4">사용자</div>
                <div className="col-span-3">역할</div>
                <div className="col-span-2">상태</div>
                <div className="col-span-1">작업</div>
              </div>
            </div>
          </div>
        )}

        {/* 모바일용 전체 선택 */}
        {isMobile && (
          <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700"
              />
              <span className="text-gray-300 text-sm">전체 선택</span>
            </label>
          </div>
        )}

        {/* 멤버 리스트 */}
        <div
          className={`
          overflow-visible
          ${isMobile ? "p-3" : "divide-y divide-gray-600"}
        `}
        >
          {filteredMembers?.map((member) => (
            <MemberCard
              key={member.userInfo.userEmail}
              member={member}
              isSelected={selectedMembers.has(member.userInfo.userEmail)}
              onSelect={handleSelectMember}
              onRoleChange={handleRoleChange}
            />
          ))}
        </div>

        {filteredMembers && filteredMembers.length === 0 && (
          <div
            className={`
            text-center text-gray-400
            ${isMobile ? "p-6" : "p-8"}
          `}
          >
            조건에 맞는 멤버가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
