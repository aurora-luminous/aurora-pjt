"use client";

import React from "react";
import JoinRequestItem from "../components/JoinRequestItem";
import { useJoinRequestsPage } from "@/app/(servers)/hooks/useAdmin";

export default function JoinRequestsPage() {
  const {
    // 상태
    selectedAll,
    selectedRequests,
    filterStatus,

    // 데이터
    filteredRequests,
    pendingCount,
    isLoading,
    error,
    isProcessing,

    // 핸들러
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleBulkReject,
    handleSelectRequest,
    handleSelectAll,
    handleFilterChange,
    refetch,
  } = useJoinRequestsPage();

  return (
    <div className="p-6">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">서버 가입 요청</h1>
        <p className="text-gray-400">
          대기 중인 가입 요청:{" "}
          <span className="text-white font-semibold">{pendingCount}개</span>
        </p>
      </div>

      {/* 로딩 상태 표시 */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="text-white">처리 중...</div>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div className="text-center py-4">
          <div className="text-red-400">데이터 로드 실패</div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 필터 및 액션 바 */}
      <div className="flex items-center justify-between mb-6 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {/* 전체 선택 체크박스 */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
            />
            <span className="text-white text-sm">전체 선택</span>
          </label>

          {/* 상태 필터 */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">상태:</span>
            <select
              value={filterStatus}
              onChange={(e) =>
                handleFilterChange(
                  e.target.value as "all" | "pending" | "approved" | "rejected"
                )
              }
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="pending">대기 중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거절됨</option>
            </select>
          </div>
        </div>

        {/* 일괄 액션 버튼 */}
        {selectedRequests.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {selectedRequests.size}개 선택됨
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg transition-colors"
            >
              전체 승인
            </button>
            <button
              onClick={handleBulkReject}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-lg transition-colors"
            >
              전체 거절
            </button>
          </div>
        )}
      </div>

      {/* 요청 목록 */}
      <div className="space-y-4">
        {!error && filteredRequests.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">
              가입 요청이 없습니다
            </h3>
            <p className="text-gray-400">
              {filterStatus === "all"
                ? "아직 서버 가입 요청이 없습니다."
                : `${filterStatus} 상태의 요청이 없습니다.`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <JoinRequestItem
              key={request.id}
              request={request}
              isSelected={selectedRequests.has(request.id)}
              onSelect={handleSelectRequest}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {filteredRequests.length > 0 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="flex items-center space-x-1">
            <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
              ←
            </button>
            <button className="w-8 h-8 bg-blue-600 rounded text-white text-sm">
              1
            </button>
            <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
              2
            </button>
            <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
              3
            </button>
            <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
