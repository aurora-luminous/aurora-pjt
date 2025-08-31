"use client";

import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ server_id: string }>;
}) {
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
