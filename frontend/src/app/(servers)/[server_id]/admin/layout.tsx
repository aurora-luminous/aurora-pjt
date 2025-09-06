"use client";

import React from "react";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useServerListQuery } from "@/app/(server-setup)/hooks/useServerMutation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ server_id: string }>;
}) {
  const serverInfo = useCurrentServerInfo();

  // 서버 목록을 조회하여 현재 사용자의 role 확인
  const serverListQuery = useServerListQuery(true);

  // 현재 서버에서의 사용자 role 찾기
  const currentServerRole = serverListQuery.data?.find(
    (server) => server.serverUrl === serverInfo?.serverUrl
  )?.serverRole;

  // 관리자 권한 확인 (owner 또는 admin)
  const isAdmin =
    currentServerRole === "owner" || currentServerRole === "admin";

  // 로딩 중일 때
  if (serverListQuery.isLoading) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-white text-center">
          <div className="mb-4">권한을 확인하는 중...</div>
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // 권한이 없는 경우
  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-center p-8 bg-red-900/20 border border-red-600 rounded-lg max-w-md">
          <div className="text-red-400 text-6xl mb-4">🚫</div>
          <h1 className="text-white text-2xl font-bold mb-2">
            접근 권한이 없습니다
          </h1>
          <p className="text-gray-300 mb-4">
            관리자 페이지는 서버 소유자 또는 관리자만 접근할 수 있습니다.
          </p>
          <p className="text-gray-400 text-sm">
            현재 권한:{" "}
            <span className="text-yellow-400">
              {currentServerRole || "member"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* 관리 사이드바 */}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}

        {/* 메인 영역 */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
