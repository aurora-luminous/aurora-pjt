"use client";

import React from "react";
import JoinRequestItem from "../components/JoinRequestItem";
import {
  useJoinRequestsPage,
  useAdminPermission,
} from "@/app/(servers)/hooks/useAdmin";
import { useResponsive } from "../../../../lib/useResponsive";

export default function JoinRequestsPage() {
  const { isMobile } = useResponsive();
  const {
    isAdmin,
    currentServerRole,
    isLoading: permissionLoading,
  } = useAdminPermission();
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

  // 권한 없을 시
  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
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
              {currentServerRole ? currentServerRole.serverRole : "Member"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "p-4" : "p-6"}`}>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1
          className={`
          font-bold text-white mb-2
          ${isMobile ? "text-xl" : "text-2xl"}
        `}
        >
          서버 가입 요청
        </h1>
        <p
          className={`
          text-gray-400
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          대기 중인 가입 요청:{" "}
          <span className="text-white font-semibold">{pendingCount}개</span>
        </p>
      </div>

      {/* 로딩 상태 표시 */}
      {isProcessing && (
        <div
          className={`
          text-center
          ${isMobile ? "py-3" : "py-4"}
        `}
        >
          <div
            className={`
            text-white
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            처리 중...
          </div>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div
          className={`
          text-center
          ${isMobile ? "py-3" : "py-4"}
        `}
        >
          <div
            className={`
            text-red-400
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            데이터 로드 실패
          </div>
          <button
            onClick={() => refetch()}
            className={`
              mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
              ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm"}
            `}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 필터 및 액션 바 */}
      <div
        className={`
        mb-6 bg-gray-800 rounded-lg
        ${isMobile ? "p-3" : "p-4"}
      `}
      >
        <div
          className={`
          ${
            isMobile
              ? "flex flex-col space-y-3"
              : "flex items-center justify-between"
          }
        `}
        >
          <div
            className={`
            ${
              isMobile
                ? "flex flex-col space-y-2"
                : "flex items-center space-x-4"
            }
          `}
          >
            {/* 전체 선택 체크박스 */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <span
                className={`
                text-white
                ${isMobile ? "text-sm" : "text-sm"}
              `}
              >
                전체 선택
              </span>
            </label>

            {/* 상태 필터 */}
            <div className="flex items-center space-x-2">
              <span
                className={`
                text-gray-400
                ${isMobile ? "text-sm" : "text-sm"}
              `}
              >
                상태:
              </span>
              <select
                value={filterStatus}
                onChange={(e) =>
                  handleFilterChange(
                    e.target.value as
                      | "all"
                      | "Pending"
                      | "Active"
                      | "Inactive"
                      | "Banned"
                  )
                }
                className={`
                  bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isMobile ? "px-2 py-1 text-sm" : "px-3 py-1 text-sm"}
                `}
              >
                <option value="all">전체</option>
                <option value="Pending">대기 중</option>
                <option value="Active">승인됨</option>
                <option value="Inactive">거절됨</option>
                <option value="Banned">차단됨</option>
              </select>
            </div>
          </div>

          {/* 일괄 액션 버튼 */}
          {selectedRequests.size > 0 && (
            <div
              className={`
              ${
                isMobile
                  ? "flex flex-col space-y-2"
                  : "flex items-center space-x-2"
              }
            `}
            >
              <span
                className={`
                text-gray-400
                ${isMobile ? "text-sm" : "text-sm"}
              `}
              >
                {selectedRequests.size}개 선택됨
              </span>
              <div
                className={`
                flex
                ${isMobile ? "space-x-2 w-full" : "space-x-2"}
              `}
              >
                <button
                  onClick={handleBulkApprove}
                  disabled={isProcessing}
                  className={`
                    bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors
                    ${
                      isMobile
                        ? "px-3 py-2 text-sm flex-1"
                        : "px-4 py-2 text-sm"
                    }
                  `}
                >
                  전체 승인
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={isProcessing}
                  className={`
                    bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors
                    ${
                      isMobile
                        ? "px-3 py-2 text-sm flex-1"
                        : "px-4 py-2 text-sm"
                    }
                  `}
                >
                  전체 거절
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 요청 목록 */}
      <div className={`${isMobile ? "space-y-3" : "space-y-4"}`}>
        {!error && filteredRequests?.length === 0 && !isLoading ? (
          <div
            className={`
            text-center
            ${isMobile ? "py-8" : "py-12"}
          `}
          >
            <div className="text-gray-400 mb-2">
              <svg
                className={`mx-auto mb-4 ${
                  isMobile ? "w-12 h-12" : "w-16 h-16"
                }`}
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
            <h3
              className={`
              text-white font-medium mb-2
              ${isMobile ? "text-base" : "text-lg"}
            `}
            >
              가입 요청이 없습니다
            </h3>
            <p
              className={`
              text-gray-400
              ${isMobile ? "text-sm" : "text-base"}
            `}
            >
              {filterStatus === "all"
                ? "아직 서버 가입 요청이 없습니다."
                : `${filterStatus} 상태의 요청이 없습니다.`}
            </p>
          </div>
        ) : (
          filteredRequests?.map((request) => (
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
      {filteredRequests?.length && filteredRequests?.length > 0 && (
        <div
          className={`
          flex items-center justify-center
          ${isMobile ? "space-x-1 mt-6" : "space-x-2 mt-8"}
        `}
        >
          <div className="flex items-center space-x-1">
            <button
              className={`
              bg-gray-700 hover:bg-gray-600 rounded text-white
              ${isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-sm"}
            `}
            >
              ←
            </button>
            <button
              className={`
              bg-blue-600 rounded text-white
              ${isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-sm"}
            `}
            >
              1
            </button>
            <button
              className={`
              bg-gray-700 hover:bg-gray-600 rounded text-white
              ${isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-sm"}
            `}
            >
              2
            </button>
            <button
              className={`
              bg-gray-700 hover:bg-gray-600 rounded text-white
              ${isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-sm"}
            `}
            >
              3
            </button>
            <button
              className={`
              bg-gray-700 hover:bg-gray-600 rounded text-white
              ${isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-sm"}
            `}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
