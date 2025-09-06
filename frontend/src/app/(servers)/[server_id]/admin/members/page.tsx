"use client";

import React from "react";
import { useMembersPage } from "@/app/(servers)/hooks/useMembers";
import MemberFilters from "../components/MemberFilters";
import BulkActions from "../components/BulkActions";
import MemberCard from "../components/MemberCard";

const MembersPage = () => {
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

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">멤버 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (memberListError) {
    return (
      <div className="flex-1 bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">멤버 목록을 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">사람과 사용자</h1>
        <p className="text-gray-400">서버 멤버를 관리하고 역할을 할당하세요.</p>
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
      <div className="bg-gray-800 rounded-lg overflow-visible">
        {/* 헤더 */}
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

        {/* 멤버 리스트 */}
        <div className="divide-y divide-gray-600 overflow-visible">
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
          <div className="p-8 text-center text-gray-400">
            조건에 맞는 멤버가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
