import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useServerListQuery } from "@/app/(server-setup)/hooks/useServerMutation";
import { useServerDropdown } from "../hooks/useServerDropdown";

interface ServerHeaderProps {
  serverId: string;
  channelId?: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
  isTablet: boolean;
  toggleMobileProjectSidebar: () => void;
  isMobileProjectSidebarOpen: boolean;
}

export const ServerHeader: React.FC<ServerHeaderProps> = ({
  serverId,
  channelId,
  toggleSidebar,
  isSidebarOpen,
  isMobile,
  isTablet,
  toggleMobileProjectSidebar,
  isMobileProjectSidebarOpen,
}) => {
  const serverInfo = useCurrentServerInfo();

  // 서버 목록을 조회하여 현재 사용자의 role 확인
  const serverListQuery = useServerListQuery(true);

  // 현재 서버에서의 사용자 role 찾기
  const currentServerRole = serverListQuery.data?.find(
    (server) => server.serverUrl === serverInfo?.serverUrl
  )?.serverRole;

  // 서버 정보 로딩 중일 때 기본값 사용
  const serverName = serverInfo?.serverName || "서버";
  // 관리자 권한 확인 (owner 또는 admin)
  const isAdmin =
    currentServerRole === "owner" || currentServerRole === "admin";

  const {
    isOpen: isDropdownOpen,
    toggle: toggleDropdown,
    dropdownRef,
    serverList,
    handleSelectServer,
  } = useServerDropdown(serverInfo?.serverUrl);

  return (
    <div
      className={`bg-aurora-main flex items-center justify-between ${
        isMobile ? "h-10 px-3" : "h-12 px-4"
      }`}
    >
      {/* 왼쪽: 로고 또는 햄버거 메뉴 + 관리자 버튼 */}
      <div className={`flex items-center min-w-0 flex-1 ${isMobile ? "space-x-1" : "space-x-2"}`}>
        {isMobile ? (
          <div className="flex items-center space-x-2">
            {/* 햄버거 메뉴 (프로젝트 사이드바 토글) */}
            <button
              onClick={toggleMobileProjectSidebar}
              className="text-white hover:bg-blue-500 p-1.5 rounded transition-colors"
              title="메뉴"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Image
              src="/background/logo.png"
              alt="Aurora Logo"
              className="h-6 w-auto"
              width={120}
              height={24}
            />
          </div>
        ) : (
          <Image
            src="/background/logo.png"
            alt="Aurora Logo"
            className={`w-auto ${isTablet ? "h-7" : "h-8"}`}
            width={120}
            height={32}
          />
        )}

        {/* 관리자 메뉴 - owner나 admin만 표시 */}
        {isAdmin && (
          <Link
            href={`/${serverId}/admin/join-requests`}
            className={`text-white hover:bg-blue-500 rounded transition-colors ${isMobile ? "p-1.5" : "p-2"}`}
            title="서버 관리"
          >
            <svg
              className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        )}
      </div>

      {/* 중간: 서버명 드롭다운 */}
      <div className="flex items-center justify-center flex-1 relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className={`text-white font-semibold flex items-center hover:text-gray-200 transition-colors ${
            isMobile ? "text-sm" : isTablet ? "text-lg" : "text-xl"
          }`}
        >
          {channelId && <span className="text-gray-300 mr-1">#</span>}
          {isMobile
            ? serverName.slice(0, 10) + (serverName.length > 10 ? "..." : "")
            : serverName}
          <svg
            className={`ml-2 flex-shrink-0 transition-transform ${
              isMobile ? "w-3 h-3" : "w-4 h-4"
            } ${isDropdownOpen ? "rotate-180" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* 드롭다운 목록 */}
        {isDropdownOpen && (
          <div className="absolute top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {serverList.length === 0 ? (
              <p className="text-slate-400 text-sm px-4 py-3">서버 없음</p>
            ) : (
              serverList.map((server) => (
                <button
                  key={server.serverUrl}
                  onClick={() => handleSelectServer(server.serverUrl, server.serverName)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                    server.serverUrl === serverInfo?.serverUrl
                      ? "bg-blue-600 text-white"
                      : "text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  <span className="truncate">{server.serverName}</span>
                  {server.serverUrl === serverInfo?.serverUrl && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 오른쪽: 검색창, 토글 버튼 */}
      <div
        className={`flex items-center justify-end flex-1 ${
          isMobile ? "space-x-1" : "space-x-3"
        }`}
      >
        {/* 검색창 - 모바일에서는 더 작게 */}
        <input
          type="text"
          placeholder={isMobile ? "검색" : "검색하기"}
          className={`
            bg-white text-gray-500 placeholder-gray-500 rounded focus:outline-none focus:bg-blue-400
            ${
              isMobile
                ? "px-2 py-1 text-xs w-20"
                : isTablet
                ? "px-3 py-1 text-sm w-32"
                : "px-3 py-1 text-sm w-48"
            }
          `}
        />

        {/* 사이드바 토글 버튼 */}
        <button
          onClick={toggleSidebar}
          className={`
            text-white hover:bg-blue-500 rounded transition-colors
            ${isMobile ? "p-1.5" : "p-2"}
          `}
          title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 보이기"}
        >
          {isMobile ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          ) : (
            <span className="text-lg">{isSidebarOpen ? "»" : "«"}</span>
          )}
        </button>
      </div>
    </div>
  );
};
