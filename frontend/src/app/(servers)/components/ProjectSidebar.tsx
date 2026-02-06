"use client";

import React from "react";
import Link from "next/link";
import { useProjectSidebar } from "../hooks/useProjectSidebar";
import AddChannelModal from "@/app/(server-setup)/components/AddChannelModal";
import AddProjectModal from "@/app/(server-setup)/components/AddProjectModal";
import AddProjectInviteModal from "@/app/(server-setup)/components/AddProjectInviteModal";
import { ProjectManageModal } from "@/app/(server-setup)/components/ProjectManageModal";
import { ChannelManageModal } from "@/app/(server-setup)/components/ChannelManageModal";
import SettingModal from "@/app/(server-setup)/components/SettingModal";
import { UserInfo } from "./UserInfo";
import { ProjectItem } from "./ProjectItem";
import { ChannelSection } from "./ChannelSection";

interface ProjectSidebarProps {
  serverId: string;
  projectId: number;
  channelId: string;
  isProjectActive: (projectId: number) => boolean;
  isProjectSelected: boolean;
  isMobile: boolean;
  isTablet: boolean;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  serverId,
  projectId,
  channelId,
  isProjectActive,
  isProjectSelected,
  isMobile,
  isTablet,
}) => {
  const {
    serverInfo,
    projects,
    currentProject,
    projectListQuery,
    textChannels,
    voiceChannels,
    noticeChannels,
    currentProjectRole,
    isAdminPage,
    adminLoading,
    adminMenuItems,
    isActiveAdminLink,
    showChannelDropdown,
    setShowChannelDropdown,
    showProjectOptionMenu,
    setShowProjectOptionMenu,
    showChannelOptionMenu,
    setShowChannelOptionMenu,
    showInviteDropdown,
    openProjectDropdown,
    openChannelInviteDropdown,
    openChannelDropdown,
    handleAddChannel,
    handleAddProject,
    handleInviteProject,
    handleProjectManage,
    handleChannelManage,
    createChannelLink,
    isCurrentChannel,
  } = useProjectSidebar({
    serverId,
    projectId,
    channelId,
    isProjectActive,
  });

  return (
    <>
      <div
        className={`
        flex flex-col h-full bg-aurora-main rounded-tl-lg
        ${isMobile ? "w-full" : isTablet ? "w-72" : "w-80"}
      `}
      >
        <div className="flex flex-1">
          {/* 왼쪽: 프로젝트 목록 */}
          <div
            className={`
            bg-gray-800 flex flex-col py-3 overflow-visible
            ${isMobile ? "w-12" : "w-16"}
          `}
          >
            <div className={`flex-1 overflow-visible ${isMobile ? "px-1" : "px-2"}`}>
              {projectListQuery.isLoading ? (
                <div className="text-white text-center py-4 text-xs">로딩중...</div>
              ) : (
                projects.map((project, index) => (
                  <ProjectItem
                    key={project.projectPk}
                    project={project}
                    serverId={serverId}
                    isActive={isProjectActive(project.projectPk)}
                    isMobile={isMobile}
                    index={index}
                    onContextMenu={openProjectDropdown}
                    showDropdown={showProjectOptionMenu === project.projectPk}
                    onDropdownClick={(e) => {
                      e.stopPropagation();
                      setShowProjectOptionMenu(null);
                    }}
                    serverUrl={serverInfo?.serverUrl || ""}
                  />
                ))
              )}
            </div>
          </div>

          {/* 중앙: 채널 목록 또는 관리자 메뉴 */}
          {(isProjectSelected || isAdminPage) && (
            <div className="w-72 bg-gray-700 flex flex-col rounded-tl-lg rounded-tr-lg overflow-hidden">
              <div className="p-4 border-b border-gray-600 rounded-tl-lg rounded-tr-lg bg-transparent">
                <div className="flex items-center justify-between">
                  <h1 className="text-white font-semibold text-lg">
                    {isAdminPage
                      ? `${serverInfo?.serverName || "서버"} 관리`
                      : currentProject?.projectName || serverInfo?.projectName || "프로젝트"}
                  </h1>
                  {!isAdminPage && (
                    <div className="relative channel-dropdown">
                      <button
                        onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                        className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                      >
                        +
                      </button>

                      {showChannelDropdown && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-gray-700 rounded shadow-lg z-[9999] border border-gray-600">
                          {currentProjectRole === "admin" && (
                            <>
                              <button
                                onClick={handleInviteProject}
                                className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
                              >
                                <div className="flex items-center">
                                  <span className="mr-3">🔗</span>
                                  <div>
                                    <div className="font-medium">프로젝트 초대</div>
                                    <div className="text-xs text-gray-400">서버 멤버 초대하기</div>
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={handleAddProject}
                                className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
                              >
                                <div className="flex items-center">
                                  <span className="mr-3">📁</span>
                                  <div>
                                    <div className="font-medium">프로젝트 생성</div>
                                    <div className="text-xs text-gray-400">새 프로젝트 만들기</div>
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={handleProjectManage}
                                className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
                              >
                                <div className="flex items-center">
                                  <span className="mr-3">⚙️</span>
                                  <div>
                                    <div className="font-medium">프로젝트 관리</div>
                                    <div className="text-xs text-gray-400">프로젝트 설정하기</div>
                                  </div>
                                </div>
                              </button>
                            </>
                          )}
                          <button
                            onClick={handleAddChannel}
                            className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors rounded-b"
                          >
                            <div className="flex items-center">
                              <span className="mr-3">➕</span>
                              <div>
                                <div className="font-medium">채널 생성</div>
                                <div className="text-xs text-gray-400">새 채널 만들기</div>
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 flex-1 overflow-y-auto relative">
                {isAdminPage ? (
                  adminLoading ? (
                    <div className="text-white text-center py-4">로딩 중...</div>
                  ) : (
                    <div className="space-y-1">
                      {adminMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                            isActiveAdminLink(item.href)
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
                  )
                ) : (
                  <>
                    {noticeChannels.length > 0 && (
                      <ChannelSection
                        title="공지사항"
                        channels={noticeChannels}
                        serverUrl={serverInfo?.serverUrl || ""}
                        serverId={serverId}
                        projectPk={projectId}
                        isCurrentChannel={isCurrentChannel}
                        createChannelLink={createChannelLink}
                        onChannelContextMenu={openChannelDropdown}
                        showChannelOptionMenu={showChannelOptionMenu}
                        showInviteDropdown={showInviteDropdown}
                        currentProjectRole={currentProjectRole}
                        onChannelDropdownClose={() => setShowChannelOptionMenu(null)}
                        onChannelInviteDropdown={openChannelInviteDropdown}
                        onChannelManage={handleChannelManage}
                       
                      />
                    )}

                    <ChannelSection
                      title="채팅 채널"
                      channels={textChannels}
                      serverUrl={serverInfo?.serverUrl || ""}
                      serverId={serverId}
                      projectPk={projectId}
                      isCurrentChannel={isCurrentChannel}
                      createChannelLink={createChannelLink}
                      onChannelContextMenu={openChannelDropdown}
                      showChannelOptionMenu={showChannelOptionMenu}
                      showInviteDropdown={showInviteDropdown}
                      currentProjectRole={currentProjectRole}
                      onChannelInviteDropdown={openChannelInviteDropdown}
                      onChannelDropdownClose={() => setShowChannelOptionMenu(null)}
                      onChannelManage={handleChannelManage}
                      
                    />

                    <ChannelSection
                      title="음성 채널"
                      channels={voiceChannels}
                      projectPk={projectId}
                      isCurrentChannel={isCurrentChannel}
                      createChannelLink={createChannelLink}
                      onChannelContextMenu={openChannelDropdown}
                      showChannelOptionMenu={showChannelOptionMenu}
                      showInviteDropdown={showInviteDropdown}
                      serverUrl={serverInfo?.serverUrl || ""}
                      serverId={serverId}
                      currentProjectRole={currentProjectRole}
                      onChannelInviteDropdown={openChannelInviteDropdown}
                      onChannelDropdownClose={() => setShowChannelOptionMenu(null)}
                      onChannelManage={handleChannelManage}
                      emptyMessage="음성 채널이 없습니다"
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <UserInfo />
      </div>

      <ProjectManageModal />
      <ChannelManageModal />
      <AddChannelModal />
      <AddProjectModal />
      <AddProjectInviteModal />
      <SettingModal />
    </>
  );
};
