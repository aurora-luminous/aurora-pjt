"use client";

import React from "react";
import { useServerLayout } from "./hooks/useServerLayout";
import { useFullscreen } from "./hooks/useFullscreen";
import { ServerHeader, ProjectSidebar, UserSidebar } from "./components";
import { useResponsive } from "../lib/useResponsive";
import { useChannelSubscription } from "./hooks/useChannelSubscription";
import { ChatMessage } from "./types/websocket";

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile, isTablet } = useResponsive();
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

  // 웹소켓 연결 및 채널 구독
  const { isConnected, isLoading: isLoadingChannels } = useChannelSubscription(
    (message: ChatMessage) => {
      // 메시지 수신 시 처리 로직
      console.log("📨 레이아웃에서 메시지 수신:", message);
      // 여기에 Redux store 업데이트 또는 다른 상태 관리 로직 추가 가능
    }
  );

  // 모바일에서 프로젝트 사이드바 표시 상태 관리
  const [isMobileProjectSidebarOpen, setIsMobileProjectSidebarOpen] =
    React.useState(false);

  const toggleMobileProjectSidebar = () => {
    setIsMobileProjectSidebarOpen(!isMobileProjectSidebarOpen);
  };

  // 모바일에서 메인 콘텐츠의 transform 계산
  const getMainContentTransform = () => {
    if (!isMobile) return "translateX(0)";

    let translateX = 0;

    // 프로젝트 사이드바가 열려있으면 오른쪽으로 이동
    if (isMobileProjectSidebarOpen) {
      translateX += 280; // 320px - 40px (여백)
    }

    // 유저 사이드바가 열려있으면 왼쪽으로 이동
    if (isSidebarOpen) {
      translateX -= 280; // 320px - 40px (여백)
    }

    return `translateX(${translateX}px)`;
  };

  // 배경 클릭 핸들러
  const handleBackgroundClick = () => {
    if (isMobileProjectSidebarOpen) {
      setIsMobileProjectSidebarOpen(false);
    }
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  // 메인 콘텐츠 클릭 핸들러 (모바일에서만 사용)
  const handleMainContentClick = (e: React.MouseEvent) => {
    // 모바일이 아니거나 사이드바가 모두 닫혀있으면 아무것도 하지 않음
    if (!isMobile || (!isMobileProjectSidebarOpen && !isSidebarOpen)) {
      return;
    }

    // 클릭된 요소가 사이드바 내부인지 확인
    const target = e.target as HTMLElement;
    const isClickInsideSidebar =
      target.closest('[data-sidebar="project"]') ||
      target.closest('[data-sidebar="user"]');

    // 사이드바 내부 클릭이 아닌 경우에만 사이드바 닫기
    if (!isClickInsideSidebar) {
      handleBackgroundClick();
    }
  };

  return (
    <div
      className="h-screen flex flex-col bg-white overflow-hidden relative"
      style={{ overscrollBehavior: "none" }}
    >
      {/* 모바일 배경 오버레이 - 사이드바가 열려있을 때만 표시 */}
      {isMobile &&
        (isMobileProjectSidebarOpen || isSidebarOpen) &&
        !isFullscreen && (
          <div
            className="absolute inset-0 bg-black/20 z-20 transition-opacity duration-300"
            onClick={handleBackgroundClick}
          />
        )}

      {/* 프로젝트 사이드바 - 모바일에서는 고정 위치 */}
      {isMobile && !isFullscreen && (
        <div
          className={`
            absolute left-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-in-out
            ${
              isMobileProjectSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }
          `}
          data-sidebar="project"
        >
          <ProjectSidebar
            serverId={serverId}
            projectId={projectId}
            channelId={channelId}
            isProjectActive={isProjectActive}
            isProjectSelected={isProjectSelected}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>
      )}

      {/* 유저 사이드바 - 모바일에서는 고정 위치 */}
      {isMobile && !isFullscreen && (
        <div
          className={`
            absolute right-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}
          `}
          data-sidebar="user"
        >
          <div className="h-full bg-gray-600 flex flex-col rounded-tl-lg w-80 max-w-[85vw]">
            <UserSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              directMessages={directMessages}
              serverId={serverId}
              projectId={projectId}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 컨테이너 - 헤더와 본문을 함께 묶어서 transform 적용 */}
      <div
        className={`
          flex h-screen flex-col flex-1 relative z-30
          ${isMobile ? "transition-transform duration-300 ease-in-out" : ""}
        `}
        style={isMobile ? { transform: getMainContentTransform() } : {}}
        onClick={handleMainContentClick}
      >
        {/* 상단 헤더 */}
        {!isFullscreen && (
          <div className="flex-shrink-0">
            <ServerHeader
              serverId={serverId}
              channelId={channelId}
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              isTablet={isTablet}
              toggleMobileProjectSidebar={toggleMobileProjectSidebar}
              isMobileProjectSidebarOpen={isMobileProjectSidebarOpen}
            />
          </div>
        )}

        {/* 메인 영역: 사이드바 + 콘텐츠 */}
        <div className="flex flex-1 bg-aurora-main min-h-0 relative overflow-hidden">
          {/* 데스크탑/태블릿 프로젝트 사이드바 */}
          {!isMobile && !isFullscreen && (
            <div className="flex-shrink-0">
              <ProjectSidebar
                serverId={serverId}
                projectId={projectId}
                channelId={channelId}
                isProjectActive={isProjectActive}
                isProjectSelected={isProjectSelected}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            </div>
          )}

          {/* 중앙: 메인 콘텐츠 */}
          <div className="flex-1 bg-gray-800 relative overflow-auto">
            {children}
          </div>

          {/* 데스크탑/태블릿 유저 사이드바 */}
          {!isMobile && !isFullscreen && (
            <div
              className={`
                bg-gray-600 flex flex-col rounded-tl-lg transition-all duration-300 ease-in-out 
                overflow-hidden flex-shrink-0
                ${
                  isSidebarOpen
                    ? `${isTablet ? "w-56" : "w-64"} opacity-100`
                    : "w-0 opacity-0"
                }
              `}
            >
              <UserSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                directMessages={directMessages}
                serverId={serverId}
                projectId={projectId}
                isSidebarOpen={isSidebarOpen}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            </div>
          )}
        </div>
      </div>

      {/* 개발 환경에서 웹소켓 연결 상태 표시 */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black/70 text-white p-2 rounded text-xs z-50">
          <div>WebSocket: {isConnected ? "✅ 연결됨" : "❌ 연결 안됨"}</div>
          {isLoadingChannels && <div>채널 로딩 중...</div>}
        </div>
      )}
    </div>
  );
}
