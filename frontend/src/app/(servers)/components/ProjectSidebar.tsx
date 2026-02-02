import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import {
  useProjectListQuery,
  useChannelListQuery,
  useProjectMemberListQuery,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { Project } from "@/app/(server-setup)/types/Projcets";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { createChannelUrl } from "@/app/(server-setup)/utils/serverAccessUtils";
import { useModal } from "@/app/(server-setup)/hooks/useModal";
import AddChannelModal from "@/app/(server-setup)/components/AddChannelModal";
import AddProjectModal from "@/app/(server-setup)/components/AddProjectModal";
import AddProjectInviteModal from "@/app/(server-setup)/components/AddProjectInviteModal";
import { ProjectManageModal } from "@/app/(server-setup)/components/ProjectManageModal";
import { ChannelManageModal } from "@/app/(server-setup)/components/ChannelManageModal";
import SettingModal from "@/app/(server-setup)/components/SettingModal";
import { useAdminSidebar } from "../hooks/useAdmin";
import { UserInfo } from "./UserInfo";
import { ProjectItem } from "./ProjectItem";
import { ChannelSection } from "./ChannelSection";
import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";

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
  const pathname = usePathname();
  const serverInfo = useCurrentServerInfo();
  const serverUrl = serverInfo?.serverUrl;
  console.log("serverUrl", serverUrl);
  const projectListQuery = useProjectListQuery(serverUrl || "");
  const {
    openChannelAddModal,
    openProjectAddModal,
    openProjectInviteModal,
    openProjectManageModal,
    openChannelManageModal,
  } = useModal();


  // 채널 드롭다운 상태
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  // 프로젝트 옵션 드롭다운 상태
  const [showProjectOptionMenu, setShowProjectOptionMenu] = useState<
    number | null
  >(null);
  // 채널 옵션 드롭다운 상태 (채널명을 저장)
  const [showChannelOptionMenu, setShowChannelOptionMenu] = useState<
    string | null
  >(null);

  const [showInviteDropdown, setShowInviteDropdown] = useState<string | null>(null);

  const memberInfo = useProjectMemberListQuery(serverUrl || "", projectId);

  const userInfo = useGetUserInfoQuery();
  const { data: userInfoData } = userInfo;
  const currentProjectRole = memberInfo.data?.find(
    (member) => member.userInfo.userEmail === userInfoData?.userEmail
  )?.projectRole;
  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".channel-dropdown") || !target.closest(".invite-channel-dropdown")) {
        setShowChannelDropdown(false);
        setShowInviteDropdown(null);
      }
    };

    if (showChannelDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showChannelDropdown]);

  // Admin 페이지인지 확인
  const isAdminPage = pathname.includes("/admin");
  const {
    isLoading: adminLoading,
    error: adminError,
    pendingRequestsCount,
  } = useAdminSidebar();

  // Admin 메뉴 아이템들
  const adminMenuItems = [
    {
      href: `/${serverId}/admin/join-requests`,
      label: "서버 가입 요청",
      icon: "👥",
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      href: `/${serverId}/admin/members`,
      label: "구성원",
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
      icon: "✉️",
    },
    {
      href: `/${serverId}/admin/settings`,
      label: "서버 설정",
      icon: "⚙️",
    },
  ];

  // 현재 admin 링크가 활성화된 상태인지 확인
  const isActiveAdminLink = (href: string) => {
    return pathname === href;
  };

  const openProjectDropdown = (e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("openProjectDropdown", showProjectOptionMenu, projectId);
    setShowProjectOptionMenu(
      showProjectOptionMenu === projectId ? null : projectId
    );
  };

  const openChannelInviteDropdown = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("openChannelInviteDropdown", showInviteDropdown, targetId);
    setShowInviteDropdown(
      showInviteDropdown === targetId ? null : targetId
    );
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProjectOptionMenu(null);
      setShowChannelOptionMenu(null);
    };

    if (showProjectOptionMenu !== null || showChannelOptionMenu !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showProjectOptionMenu, showChannelOptionMenu]);

  const openChannelDropdown = (e: React.MouseEvent, channelName: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("openChannelDropdown", showChannelOptionMenu, channelName);
    setShowChannelOptionMenu(
      showChannelOptionMenu === channelName ? null : channelName
    );
  };

  // 디코딩된 채널 ID
  const decodedChannelId = useMemo(() => {
    try {
      return decodeURIComponent(channelId);
    } catch (error) {
      console.warn("채널 ID 디코딩 실패:", channelId, error);
      return channelId;
    }
  }, [channelId]);

  // 상태 선언
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // 간단한 React Query로 채널 목록 조회
  const channelListQuery = useChannelListQuery(
    serverInfo?.serverUrl || "",
    currentProject?.projectPk || 0
  );

  // 채널 목록을 타입별로 필터링
  const channels = channelListQuery.data || [];
  const textChannels = channels.filter(
    (c: Channel) => c.channelKind === "text"
  );
  const voiceChannels = channels.filter(
    (c: Channel) => c.channelKind === "voice"
  );
  const noticeChannels = channels.filter(
    (c: Channel) => c.channelKind === "notice"
  );

  // 프로젝트 목록 로딩 - React Query 사용
  useEffect(() => {
    if (!projectListQuery.data && !projectListQuery.isLoading) {
      return;
    }

    const projectList = projectListQuery.data || [];
    setProjects(projectList);

    // 현재 프로젝트 찾기 - projectPk 기반 매칭
    let currentProj: Project | null = null;

    if (projectId) {
      const projectPkFromUrl = projectId;

      if (!isNaN(projectPkFromUrl)) {
        currentProj =
          projectList?.find((p: Project) => p.projectPk === projectPkFromUrl) ||
          null;

        console.log("🔍 [프로젝트 매칭]:");
        console.log("  - URL projectId:", projectId);
        console.log("  - 변환된 projectPk:", projectPkFromUrl);
        console.log("  - 찾은 프로젝트:", currentProj);
        console.log(
          "  - 전체 프로젝트 목록:",
          projectList?.map(
            (p: Project) => `${p.projectName}(PK:${p.projectPk})`
          )
        );
      } else {
        console.log("❌ projectId를 숫자로 변환 실패:", projectId);
      }
    }

    // 매칭되지 않으면 첫 번째 프로젝트 사용
    if (!currentProj && projectList && projectList.length > 0) {
      currentProj = projectList[0] || null;
      console.log("📋 매칭 실패, 첫 번째 프로젝트 사용:", currentProj);
    }

    setCurrentProject(currentProj);
  }, [projectListQuery.data, projectListQuery.isLoading, projectId]);

  // 채널 추가 모달 열기
  const handleAddChannel = () => {
    if (!serverInfo?.serverUrl || !currentProject) return;

    setShowChannelDropdown(false);
    openChannelAddModal({
      serverUrl: serverInfo.serverUrl,
      projectPk: currentProject.projectPk,
      channelName: "",
      channelKind: "text",
      isPrivate: false,
      channelPk: 0,
    });
  };

  // 프로젝트 추가 모달 열기
  const handleAddProject = () => {
    if (!serverInfo?.serverUrl) return;

    setShowChannelDropdown(false);
    openProjectAddModal({
      serverUrl: serverInfo.serverUrl,
      projectName: "",
      projectDescription: "",
    });
  };

  // 프로젝트 초대 모달 열기
  const handleInviteProject = () => {
    if (!serverInfo?.serverUrl || !currentProject) return;

    setShowChannelDropdown(false);
    openProjectInviteModal({
      serverUrl: serverInfo.serverUrl,
      projectPk: currentProject.projectPk,
      projectName: currentProject.projectName,
    });
  };

  const handleProjectManage = () => {
    if (currentProjectRole !== "admin") return;
    setShowChannelDropdown(false);
    openProjectManageModal({
      serverUrl: serverUrl || "",
      projectPk: projectId,
    });
  };

  // 채널 관리 모달 열기
  const handleChannelManage = () => {
    if (currentProjectRole !== "admin") return;

    // 현재 채널 찾기 (디코딩된 채널 ID로)
    const currentChannel = channels.find(
      (channel) => channel.channelName === decodedChannelId
    );

    if (!currentChannel || !serverInfo?.serverUrl || !currentProject) return;

    setShowChannelDropdown(false);
    openChannelManageModal({
      serverUrl: serverInfo.serverUrl,
      projectPk: currentProject.projectPk,
      channelPk: currentChannel.channelPk,
    });
  };

  

  // 채널 링크 생성 함수 (채널 타입별 경로 구분) - 유틸 함수 사용
  const createChannelLink = (channel: Channel) => {
    return createChannelUrl(
      serverId,
      currentProject?.projectPk || 0,
      channel.channelName,
      channel.channelKind
    );
  };

  // 현재 채널인지 확인하는 함수 (디코딩된 이름으로 비교)
  const isCurrentChannel = (channelName: string) => {
    return decodedChannelId === channelName;
  };

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
            {/* 프로젝트 목록 */}
            <div
              className={`flex-1 overflow-visible ${
                isMobile ? "px-1" : "px-2"
              }`}
            >
              {projectListQuery.isLoading ? (
                <div
                  className={`
                  text-white text-center py-4
                  ${isMobile ? "text-xs" : "text-xs"}
                `}
                >
                  로딩중...
                </div>
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

          {/* 중앙: 채널 목록 (프로젝트 선택 시) 또는 관리자 메뉴 (admin 페이지) */}
          {(isProjectSelected || isAdminPage) && (
            <div className="w-72 bg-gray-700 flex flex-col rounded-tl-lg rounded-tr-lg overflow-hidden">
              {/* 프로젝트 헤더 */}
              <div className="p-4 border-b border-gray-600 rounded-tl-lg rounded-tr-lg bg-transparent">
                <div className="flex items-center justify-between">
                  <h1 className="text-white font-semibold text-lg">
                    {isAdminPage
                      ? `${serverInfo?.serverName || "서버"} 관리`
                      : currentProject?.projectName ||
                        serverInfo?.projectName ||
                        "프로젝트"}
                  </h1>
                  {!isAdminPage && (
                    <div className="relative channel-dropdown">
                      <button
                        onClick={() =>
                          setShowChannelDropdown(!showChannelDropdown)
                        }
                        className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                      >
                        +
                      </button>

                      {/* 채널 드롭다운 메뉴 */}
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
                                    <div className="text-xs text-gray-400">
                                      서버 멤버 초대하기
                                    </div>
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
                                    <div className="text-xs text-gray-400">
                                      새 프로젝트 만들기
                                    </div>
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
                                    <div className="text-xs text-gray-400">
                                      프로젝트 설정하기
                                    </div>
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
                                <div className="text-xs text-gray-400">
                                  새 채널 만들기
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 채널 목록 또는 관리자 메뉴 */}
              <div className="px-4 py-3 flex-1 overflow-y-auto relative">
                {isAdminPage ? (
                  /* 관리자 메뉴 */
                  adminLoading ? (
                    <div className="text-white text-center py-4">
                      로딩 중...
                    </div>
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
                    {/* 공지 채널 */}
                    {noticeChannels.length > 0 && (
                      <ChannelSection
                        title="공지사항"
                        channels={noticeChannels}
                        serverUrl={serverInfo?.serverUrl || ""}
                        isCurrentChannel={isCurrentChannel}
                        createChannelLink={createChannelLink}
                        onChannelContextMenu={openChannelDropdown}
                        showChannelOptionMenu={showChannelOptionMenu}
                        showInviteDropdown={showInviteDropdown}
                        currentProjectRole={currentProjectRole}
                        onChannelDropdownClose={() =>
                          setShowChannelOptionMenu(null)
                        }
                        onChannelInviteDropdown={openChannelInviteDropdown}
                        onChannelManage={handleChannelManage}
                      />
                    )}

                    {/* 채팅 채널 */}
                    <ChannelSection
                      title="채팅 채널"
                      channels={textChannels}
                      serverUrl={serverInfo?.serverUrl || ""}
                      isCurrentChannel={isCurrentChannel}
                      createChannelLink={createChannelLink}
                      onChannelContextMenu={openChannelDropdown}
                      showChannelOptionMenu={showChannelOptionMenu}
                      showInviteDropdown={showInviteDropdown}
                      currentProjectRole={currentProjectRole}
                      onChannelInviteDropdown={openChannelInviteDropdown}
                      onChannelDropdownClose={() =>
                        setShowChannelOptionMenu(null)
                      }
                      onChannelManage={handleChannelManage}
                    />

                    {/* 음성 채널 */}
                    <ChannelSection
                      title="음성 채널"
                      channels={voiceChannels}
                      isCurrentChannel={isCurrentChannel}
                      createChannelLink={createChannelLink}
                      onChannelContextMenu={openChannelDropdown}
                      showChannelOptionMenu={showChannelOptionMenu}
                      showInviteDropdown={showInviteDropdown}
                      serverUrl={serverInfo?.serverUrl || ""}
                      currentProjectRole={currentProjectRole}
                      onChannelInviteDropdown={openChannelInviteDropdown}
                      onChannelDropdownClose={() =>
                        setShowChannelOptionMenu(null)
                      }
                      onChannelManage={handleChannelManage}
                      emptyMessage="음성 채널이 없습니다"
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단: 사용자 정보 (프로젝트+채널 영역에만 제한) */}
        <UserInfo />
      </div>

      {/* 모달들 - 원래 방식으로 사용 */}
      <ProjectManageModal />
      <ChannelManageModal />
      <AddChannelModal />
      <AddProjectModal />
      <AddProjectInviteModal />
      <SettingModal />
    </>
  );
};
