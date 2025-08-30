import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useServerApi } from "@/app/(server-setup)/hooks/useServerApi";
import { Project } from "@/app/(server-setup)/types/Projcets";
import { useModal } from "@/app/(server-setup)/hooks/useModal";
import AddChannelModal from "@/app/(server-setup)/components/AddChannelModal";
import AddProjectModal from "@/app/(server-setup)/components/AddProjectModal";
import { useChannels } from "../hooks/useChannels";
import { useAdminSidebar } from "../hooks/useAdmin";
import { UserInfo } from "./UserInfo";

interface ProjectSidebarProps {
  serverId: string;
  projectId: string;
  channelId: string;
  isProjectActive: (projectId: string) => boolean;
  isProjectSelected: boolean;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  serverId,
  projectId,
  channelId,
  isProjectActive,
  isProjectSelected,
}) => {
  const pathname = usePathname();
  const serverInfo = useCurrentServerInfo();
  const { getProjectList } = useServerApi();
  const { openChannelAddModal, openProjectAddModal } = useModal();

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

  // 현재 admin 링크가 활성화된 상태인지 확인
  const isActiveAdminLink = (href: string) => {
    return pathname === href;
  };

  // URL 인코딩된 channelId를 디코딩
  const decodedChannelId = useMemo(() => {
    try {
      return decodeURIComponent(channelId);
    } catch (error) {
      console.warn("채널 ID 디코딩 실패:", channelId, error);
      return channelId;
    }
  }, [channelId]);

  // Redux를 통한 채널 관리
  const {
    loading: loadingChannels,
    loadChannels,
    textChannels,
    voiceChannels,
    noticeChannels,
  } = useChannels();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // 프로젝트 목록 로딩
  useEffect(() => {
    const loadProjects = async () => {
      if (!serverInfo?.serverUrl) return;

      setLoadingProjects(true);
      try {
        const projectList = await getProjectList(serverInfo.serverUrl);
        setProjects(projectList);

        // 현재 프로젝트 찾기 - projectPk 기반 매칭
        let currentProj: Project | null = null;

        if (projectId) {
          // projectId를 숫자로 변환해서 projectPk와 매칭
          const projectPkFromUrl = parseInt(projectId, 10);

          if (!isNaN(projectPkFromUrl)) {
            currentProj =
              projectList.find((p) => p.projectPk === projectPkFromUrl) || null;

            console.log("🔍 [프로젝트 매칭]:");
            console.log("  - URL projectId:", projectId);
            console.log("  - 변환된 projectPk:", projectPkFromUrl);
            console.log("  - 찾은 프로젝트:", currentProj);
            console.log(
              "  - 전체 프로젝트 목록:",
              projectList.map((p) => `${p.projectName}(PK:${p.projectPk})`)
            );
          } else {
            console.log("❌ projectId를 숫자로 변환 실패:", projectId);
          }
        }

        // 매칭되지 않으면 첫 번째 프로젝트 사용
        if (!currentProj && projectList.length > 0) {
          currentProj = projectList[0];
          console.log("📋 매칭 실패, 첫 번째 프로젝트 사용:", currentProj);
        }

        setCurrentProject(currentProj);
      } catch (error) {
        console.error("프로젝트 목록 로딩 실패:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [serverInfo?.serverUrl, projectId, getProjectList]);

  // 채널 목록 로딩 - projectId 변경 직접 감지
  useEffect(() => {
    console.log("🔍 [채널 로딩] useEffect 실행됨:");
    console.log("  - projectId:", projectId);
    console.log("  - serverInfo?.serverUrl:", serverInfo?.serverUrl);
    console.log("  - isProjectSelected:", isProjectSelected);
    console.log("  - currentProject:", currentProject);

    if (
      serverInfo?.serverUrl &&
      projectId &&
      isProjectSelected &&
      currentProject?.projectPk
    ) {
      console.log(
        `📋 채널 목록 로드: ${projectId} (PK: ${currentProject.projectPk})`
      );
      loadChannels(serverInfo.serverUrl, currentProject.projectPk);
    } else {
      console.log("🗑️ 채널 로딩 조건 불충족");
    }
  }, [
    projectId, // URL에서 직접 가져온 projectId 변경 감지
    serverInfo?.serverUrl,
    isProjectSelected,
    currentProject?.projectPk, // currentProject가 설정되면 실행
    loadChannels,
  ]);

  // 채널 추가 모달 열기
  const handleAddChannel = () => {
    if (!serverInfo?.serverUrl || !currentProject) return;

    openChannelAddModal({
      serverUrl: serverInfo.serverUrl,
      projectPk: currentProject.projectPk,
      channelName: "",
      channelKind: "text",
      isPrivate: false,
    });
  };

  // 프로젝트 추가 모달 열기
  const handleAddProject = () => {
    if (!serverInfo?.serverUrl) return;

    openProjectAddModal({
      serverUrl: serverInfo.serverUrl,
      projectName: "",
      projectDescription: "",
    });
  };

  // 채널 링크 생성 함수 (채널 타입별 경로 구분)
  const createChannelLink = (channelName: string, isVoice: boolean = false) => {
    const encodedChannelName = encodeURIComponent(channelName);
    const channelType = isVoice ? "voice_channels" : "channels";
    return `/${serverId}/projects/${currentProject?.projectPk}/${channelType}/${encodedChannelName}`;
  };

  // 현재 채널인지 확인하는 함수 (디코딩된 이름으로 비교)
  const isCurrentChannel = (channelName: string) => {
    return decodedChannelId === channelName;
  };

  return (
    <>
      <div className="flex flex-col h-full bg-aurora-main rounded-tl-lg">
        <div className="flex flex-1">
          {/* 왼쪽: 프로젝트 목록 */}
          <div className="w-16 bg-gray-800 flex flex-col py-3">
            {/* 프로젝트 목록 */}
            <div className="flex-1 overflow-y-auto px-2">
              {loadingProjects ? (
                <div className="text-white text-xs text-center py-4">
                  로딩중...
                </div>
              ) : (
                projects.map((project, index) => (
                  <Link
                    key={project.projectPk}
                    href={`/${serverId}/projects/${project.projectPk}/channels/general`}
                    className={`block mb-2 ${
                      index === 0
                        ? "rounded-tr-lg rounded-br-lg rounded-bl-lg"
                        : "rounded"
                    } cursor-pointer transition-colors ${
                      isProjectActive(project.projectPk.toString())
                        ? "bg-blue-600"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-center p-2">
                      <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {project.projectName[0]?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}

              {/* 프로젝트 생성 버튼 */}
              <div
                onClick={handleAddProject}
                className="mb-2 rounded cursor-pointer hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-600 hover:border-gray-500"
              >
                <div className="flex items-center justify-center p-2">
                  <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                    <span className="text-white text-lg">+</span>
                  </div>
                </div>
              </div>
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
                    <button
                      onClick={handleAddChannel}
                      className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* 채널 목록 또는 관리자 메뉴 */}
              <div className="px-4 py-3 flex-1 overflow-y-auto">
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
                ) : loadingChannels ? (
                  <div className="text-white text-center py-4">
                    채널 로딩 중...
                  </div>
                ) : (
                  <>
                    {/* 공지 채널 */}
                    {noticeChannels.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white text-xs font-semibold uppercase">
                            공지사항
                          </h3>
                        </div>
                        {noticeChannels.map((channel) => (
                          <Link
                            key={channel.channelName}
                            href={createChannelLink(channel.channelName)}
                            className={`flex items-center px-2 py-1 rounded cursor-pointer mb-1 transition-colors ${
                              isCurrentChannel(channel.channelName)
                                ? "bg-gray-600 text-white"
                                : "text-gray-300 hover:bg-gray-600 hover:text-white"
                            }`}
                          >
                            <span className="mr-2 text-gray-400">📢</span>
                            <span className="text-sm">
                              {channel.channelName}
                            </span>
                            {channel.isPrivate && (
                              <span className="ml-auto text-xs">🔒</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* 채팅 채널 */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-gray-300 text-xs font-semibold uppercase">
                        채팅 채널
                      </h3>
                      <button className="text-gray-400 hover:text-gray-200">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-4">
                      {textChannels.length === 0 ? (
                        <div className="text-gray-400 text-sm py-2">
                          채널이 없습니다
                        </div>
                      ) : (
                        textChannels.map((channel) => (
                          <Link
                            key={channel.channelName}
                            href={createChannelLink(channel.channelName)}
                          >
                            <div
                              className={`flex items-center px-2 py-1 rounded cursor-pointer mb-1 transition-colors ${
                                isCurrentChannel(channel.channelName)
                                  ? "bg-gray-600 text-white"
                                  : "text-gray-300 hover:bg-gray-600 hover:text-white"
                              }`}
                            >
                              <span className="mr-2 text-gray-400">#</span>
                              <span className="text-sm">
                                {channel.channelName}
                              </span>
                              {channel.isPrivate && (
                                <span className="ml-auto text-xs">🔒</span>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    {/* 음성 채널 */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-gray-300 text-xs font-semibold uppercase">
                        음성 채널
                      </h3>
                      <button className="text-gray-400 hover:text-gray-200">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="mb-4">
                      {voiceChannels.length === 0 ? (
                        <div className="text-gray-400 text-sm py-2">
                          음성 채널이 없습니다
                        </div>
                      ) : (
                        voiceChannels.map((channel) => (
                          <Link
                            key={channel.channelName}
                            href={createChannelLink(channel.channelName, true)}
                          >
                            <div
                              className={`flex items-center px-2 py-1 rounded cursor-pointer mb-1 transition-colors ${
                                isCurrentChannel(channel.channelName)
                                  ? "bg-gray-600 text-white"
                                  : "text-gray-300 hover:bg-gray-600 hover:text-white"
                              }`}
                            >
                              <span className="mr-2 text-gray-400">🔊</span>
                              <span className="text-sm">
                                {channel.channelName}
                              </span>
                              {channel.isPrivate && (
                                <span className="ml-auto text-xs">🔒</span>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단: 사용자 정보 (프로젝트+채널 영역에만 제한) */}
        <UserInfo />
      </div>

      {/* 모달들 */}
      <AddChannelModal />
      <AddProjectModal />
    </>
  );
};
