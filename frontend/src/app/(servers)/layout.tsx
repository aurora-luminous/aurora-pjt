"use client";

import React from "react";
import { useServerLayout } from "./hooks/useServerLayout";
import { useFullscreen } from "./hooks/useFullscreen";
import { ServerHeader, ProjectSidebar, UserSidebar } from "./components";

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    serverId,
    projectId,
    channelId,
    activeTab,
    setActiveTab,
    directMessages,
    onlineUsers,
    isSidebarOpen,
    isProjectActive,
    isProjectSelected,
    toggleSidebar,
  } = useServerLayout();

  const { isFullscreen } = useFullscreen();

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 상단 헤더 */}
      {!isFullscreen && (
        <ServerHeader
          serverId={serverId}
          channelId={channelId}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
      )}

      <div className="flex flex-1 bg-aurora-main">
        {/* 왼쪽+중앙: 프로젝트 목록과 채널 목록을 포함하는 사이드바 영역 */}
        {!isFullscreen && (
          <ProjectSidebar
            serverId={serverId}
            projectId={projectId}
            channelId={channelId}
            isProjectActive={isProjectActive}
            isProjectSelected={isProjectSelected}
          />
        )}

        {/* 오른쪽: 메인 콘텐츠 영역 */}
        <div className="flex-1 bg-gray-800 relative">{children}</div>

        {/* 사이드바 with 슬라이드 애니메이션 */}
        {!isFullscreen && (
          <div
            className={`bg-gray-600 flex flex-col rounded-tl-lg transition-all duration-300 ease-in-out overflow-hidden ${
              isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <UserSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onlineUsers={onlineUsers}
              directMessages={directMessages}
              serverId={serverId}
              projectId={projectId}
              isSidebarOpen={isSidebarOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}
