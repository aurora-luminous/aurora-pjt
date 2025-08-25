"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSidebar } from "@/app/(servers)/hooks/useAdmin";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";

interface AdminSidebarProps {
  serverId: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ serverId }) => {
  const pathname = usePathname();
  const serverInfo = useCurrentServerInfo();
  const serverName = serverInfo?.serverName;

  const { isLoading, error, pendingRequestsCount } = useAdminSidebar();

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
          <div>
            <h2 className="text-white font-semibold">
              {serverName || "서버 이름"}
            </h2>
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
      <div className="flex bg-gray-800 border-t border-gray-600 rounded-tr-lg mr-2">
        <div className="w-4"></div>
        <div className="flex-1 p-4 flex items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 relative">
            <span className="text-gray-800 text-lg font-bold">사</span>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
          </div>
          <div className="flex-1">
            <div className="text-white text-base font-semibold">사용자</div>
            <div className="text-gray-300 text-sm">온라인</div>
          </div>
          <div className="flex space-x-2">
            <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
              🎤
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
              🎧
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
              ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
