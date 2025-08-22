"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useServerAccessQuery } from "@/app/(server-setup)/hooks/useServerMutation";

interface AdminSidebarProps {
  serverId: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ serverId }) => {
  const pathname = usePathname();

  // ✅ Query 사용: 자동으로 데이터 조회, 캐싱, refetch
  const {
    data: serverAccessList = [],
    isLoading,
    error,
  } = useServerAccessQuery(serverId);

  // 대기 중인 요청 수 계산
  const pendingRequestsCount = useMemo(() => {
    return serverAccessList.filter((access) => access.status === "Pending")
      .length;
  }, [serverAccessList]);

  const menuItems = [
    {
      href: `/${serverId}/admin/join-requests`,
      label: "서버 가입 요청",
      icon: "👥",
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined, // 0이면 배지 숨김
    },
    {
      href: `/${serverId}/admin/members`,
      label: "사람과 사용자",
      icon: "👤",
    },
    {
      href: `/${serverId}/admin/roles`,
      label: "역할",
      icon: "🏷️",
    },
    {
      href: `/${serverId}/admin/invitations`,
      label: "초대",
      icon: "📨",
    },
    {
      href: `/${serverId}/admin/settings`,
      label: "서버 삭제",
      icon: "🗑️",
    },
  ];

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  // 에러 발생 시 로그 출력
  if (error) {
    console.error("❌ 서버 접근 권한 조회 실패:", error);
  }

  return (
    <div className="w-80 bg-gray-800 flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">MS</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">Meeting ssafy</h2>
            <p className="text-gray-400 text-sm">서버 관리</p>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="검색하기"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute right-3 top-2.5 w-4 h-4 text-gray-400"
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

      {/* 메뉴 */}
      <div className="flex-1 px-2">
        {isLoading && (
          <div className="text-center text-gray-400 text-sm py-4">
            로딩 중...
          </div>
        )}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                isActiveLink(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* 하단 사용자 정보 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center relative">
            <span className="text-white text-xs font-semibold">김</span>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">김코딩</p>
            <p className="text-gray-400 text-xs">온라인</p>
          </div>
          <div className="flex space-x-1">
            <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600">
              🎧
            </button>
            <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600">
              🎤
            </button>
            <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600">
              ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
