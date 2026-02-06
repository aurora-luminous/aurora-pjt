import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import {
  useProjectListQuery,
  useChannelListQuery,
  useProjectMemberListQuery,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { useModal } from "@/app/(server-setup)/hooks/useModal";
import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";
import { useAdminSidebar } from "./useAdmin";
import { Project } from "@/app/(server-setup)/types/Projcets";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { ChannelKind } from "@/app/(server-setup)/types/ChannelKind";
import { AccessType } from "@/app/(server-setup)/types/AccessType";
import { ChannelRole } from "@/app/(server-setup)/types/ChannelRole";
import { createChannelUrl } from "@/app/(server-setup)/utils/serverAccessUtils";

interface UseProjectSidebarProps {
  serverId: string;
  projectId: number;
  channelId: string;
  isProjectActive: (projectId: number) => boolean;
}

export const useProjectSidebar = ({
  serverId,
  projectId,
  channelId,
  isProjectActive,
}: UseProjectSidebarProps) => {
  const pathname = usePathname();
  const serverInfo = useCurrentServerInfo();
  const serverUrl = serverInfo?.serverUrl;

  const {
    openChannelAddModal,
    openProjectAddModal,
    openProjectInviteModal,
    openProjectManageModal,
    openChannelManageModal,
  } = useModal();

  // 드롭다운 상태 관리
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showProjectOptionMenu, setShowProjectOptionMenu] = useState<number | null>(null);
  const [showChannelOptionMenu, setShowChannelOptionMenu] = useState<string | null>(null);
  const [showInviteDropdown, setShowInviteDropdown] = useState<string | null>(null);

  // 데이터 조회
  const projectListQuery = useProjectListQuery(serverUrl || "");
  const userInfo = useGetUserInfoQuery();
  const memberInfo = useProjectMemberListQuery(serverUrl || "", projectId);

  const currentUserEmail = userInfo.data?.userEmail;
  const currentProjectRole = memberInfo.data?.find(
    (member) => member.userInfo.userEmail === currentUserEmail
  )?.projectRole;

  // 디코딩된 채널 ID
  const decodedChannelId = useMemo(() => {
    try {
      return decodeURIComponent(channelId);
    } catch (error) {
      return channelId;
    }
  }, [channelId]);

  // 프로젝트 및 채널 관리
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    const projectList = projectListQuery.data || [];
    setProjects(projectList);

    let currentProj: Project | null = null;
    if (projectId) {
      currentProj = projectList.find((p) => p.projectPk === projectId) || null;
    }

    if (!currentProj && projectList.length > 0) {
      currentProj = projectList[0];
    }
    setCurrentProject(currentProj);
  }, [projectListQuery.data, projectId]);

  const channelListQuery = useChannelListQuery(
    serverUrl || "",
    currentProject?.projectPk || 0
  );

  const channels = channelListQuery.data || [];
  const textChannels = channels.filter((c) => c.channelKind === ChannelKind.TEXT);
  const voiceChannels = channels.filter((c) => c.channelKind === ChannelKind.VOICE);
  const noticeChannels = channels.filter((c) => c.channelKind === ChannelKind.NOTIFICATION);

  // Admin 로직
  const isAdminPage = pathname.includes("/admin");
  const { isLoading: adminLoading, pendingRequestsCount } = useAdminSidebar();

  const adminMenuItems = [
    {
      href: `/${serverId}/admin/join-requests`,
      label: "서버 가입 요청",
      icon: "👥",
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    { href: `/${serverId}/admin/members`, label: "구성원", icon: "👤" },
    { href: `/${serverId}/admin/roles`, label: "역할", icon: "🏷️" },
    { href: `/${serverId}/admin/invitations`, label: "초대", icon: "✉️" },
    { href: `/${serverId}/admin/settings`, label: "서버 설정", icon: "⚙️" },
  ];

  const isActiveAdminLink = (href: string) => pathname === href;

  // 이벤트 핸들러
  const openProjectDropdown = (e: React.MouseEvent, pId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProjectOptionMenu(showProjectOptionMenu === pId ? null : pId);
  };

  const openChannelInviteDropdown = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowInviteDropdown(showInviteDropdown === targetId ? null : targetId);
  };

  const openChannelDropdown = (e: React.MouseEvent, channelName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChannelOptionMenu(showChannelOptionMenu === channelName ? null : channelName);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (
        !target.closest(".channel-dropdown") && 
        !target.closest(".invite-channel-dropdown") &&
        !target.closest(".invite-button")
      ) {
        setShowChannelDropdown(false);
        setShowInviteDropdown(null);
      }

      setShowProjectOptionMenu(null);
      setShowChannelOptionMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleAddChannel = () => {
    if (!serverUrl || !currentProject) return;
    openChannelAddModal({
      serverUrl,
      projectPk: currentProject.projectPk,
      channelName: "",
      channelKind: ChannelKind.TEXT,
      accessType: AccessType.PUBLIC,
      channelPk: 0,
    });
  };

  const handleAddProject = () => {
    if (!serverUrl) return;
    openProjectAddModal({
      serverUrl,
      projectName: "",
      projectDescription: "",
    });
  };

  const handleInviteProject = () => {
    if (!serverUrl || !currentProject) return;
    openProjectInviteModal({
      serverUrl,
      projectPk: currentProject.projectPk,
      projectName: currentProject.projectName,
    });
  };

  const handleProjectManage = () => {
    if (currentProjectRole !== "admin") return;
    openProjectManageModal({
      serverUrl: serverUrl || "",
      projectPk: projectId,
    });
  };

  const handleChannelManage = (channel: Channel) => {
    const canManageChannel =
      channel.accessType === AccessType.PRIVATE
        ? channel.channelRole === ChannelRole.ADMIN
        : currentProjectRole === "admin";

    if (!canManageChannel || !serverUrl || !currentProject) return;

    openChannelManageModal({
      serverUrl,
      projectPk: currentProject.projectPk,
      channelPk: channel.channelPk,
    });
  };

  const createChannelLink = (channel: Channel) => {
    return createChannelUrl(
      serverId,
      currentProject?.projectPk || 0,
      channel.channelPk,
      channel.channelKind
    );
  };

  const isCurrentChannel = (channel: Channel) => {
    const currentId = parseInt(channelId, 10);
    return channel.channelPk === currentId;
  };

  return {
    serverInfo,
    projects,
    currentProject,
    projectListQuery,
    channelListQuery,
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
    setShowInviteDropdown,
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
  };
};
