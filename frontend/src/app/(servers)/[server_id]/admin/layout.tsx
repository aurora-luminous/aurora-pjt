"use client";

import React, { use } from "react";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ server_id: string }>;
}) {
  const { server_id } = use(params);

  return (
    <div className="flex h-full bg-gray-900">
      {/* 관리 사이드바 */}
      <AdminSidebar serverId={server_id} />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">서버 관리</h1>
            <button className="text-gray-400 hover:text-white">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 메인 영역 */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
