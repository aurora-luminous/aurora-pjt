import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { User, DirectMessage, TabType } from "../types";
import {
  defaultUsers,
  defaultDirectMessages,
  serverNames,
  projectNames,
  channelNames,
} from "../types/data";

export const useServerLayout = () => {
  const params = useParams();
  const pathname = usePathname();

  // URL 파라미터
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;
  const channelId = params.channel_id as string;
  const userId = params.user_id as string;

  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 이름 가져오기 함수들
  const getServerName = (id: string) => {
    return serverNames[id] || id?.replace(/-/g, " ").toUpperCase();
  };

  const getProjectName = (id: string) => {
    return projectNames[id] || id?.replace(/-/g, " ").toUpperCase();
  };

  const getChannelName = (id: string) => {
    return channelNames[id] || id?.replace(/-/g, " ");
  };

  // 현재 선택된 프로젝트인지 확인
  const isProjectActive = (checkProjectId: string) => {
    return pathname?.includes(`/projects/${checkProjectId}`);
  };

  // 프로젝트가 선택되었는지 확인
  const isProjectSelected = Boolean(projectId && projectId !== "undefined");

  // 사이드바 토글
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 프로젝트 선택 시 사용자 데이터 로드
  useEffect(() => {
    if (isProjectSelected) {
      setOnlineUsers(defaultUsers);
      setDirectMessages(defaultDirectMessages);
    } else {
      setOnlineUsers([]);
      setDirectMessages([]);
    }
  }, [isProjectSelected]);

  return {
    // URL 파라미터
    serverId,
    projectId,
    channelId,
    userId,
    pathname,

    // 상태
    activeTab,
    setActiveTab,
    directMessages,
    onlineUsers,
    isSidebarOpen,

    // 함수들
    getServerName,
    getProjectName,
    getChannelName,
    isProjectActive,
    isProjectSelected,
    toggleSidebar,
  };
};
