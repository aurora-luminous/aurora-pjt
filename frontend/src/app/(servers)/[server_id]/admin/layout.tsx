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
        {/* 메인 영역 */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
