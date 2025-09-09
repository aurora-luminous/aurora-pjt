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
    <div
      className="h-screen flex flex-col bg-white overflow-hidden"
      style={{ overscrollBehavior: "none" }}
    >
      {/* 상단 헤더 - 고정 */}
      {!isFullscreen && (
        <div className="flex-shrink-0">
          <ServerHeader
            serverId={serverId}
            channelId={channelId}
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
      )}

      {/* 메인 영역: 사이드바 + 콘텐츠 */}
      <div className="flex flex-1 bg-aurora-main min-h-0">
        {/* 왼쪽: 프로젝트 사이드바 - 고정 */}
        {!isFullscreen && (
          <div className="flex-shrink-0">
            <ProjectSidebar
              serverId={serverId}
              projectId={projectId}
              channelId={channelId}
              isProjectActive={isProjectActive}
              isProjectSelected={isProjectSelected}
            />
          </div>
        )}

        {/* 중앙: 메인 콘텐츠 - 스크롤 가능 */}
        <div className="flex-1 bg-gray-800 relative overflow-auto">
          {children}
        </div>

        {/* 오른쪽: 유저 사이드바 - 고정 */}
        {!isFullscreen && (
          <div
            className={`bg-gray-600 flex flex-col rounded-tl-lg transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
              isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <UserSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
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
