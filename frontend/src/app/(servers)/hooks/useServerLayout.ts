import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { TabType } from "../types";

import { useResponsive } from "../../lib/useResponsive";

export const useServerLayout = () => {
  const params = useParams();
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  // URL 파라미터
  const serverId = params.server_id as string;
  const projectId = Number(params.project_id);
  const channelId = params.channel_id as string;
  const userId = params.user_id as string;

  // 상태 관리 - 모바일에서는 UserSidebar가 기본적으로 닫혀있음
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // 모바일 상태 변경시 사이드바 상태 업데이트
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // 현재 선택된 프로젝트인지 확인
  const isProjectActive = (checkProjectId: number) => {
    return pathname?.includes(`/projects/${checkProjectId}`);
  };

  // 프로젝트가 선택되었는지 확인
  const isProjectSelected = Boolean(projectId && projectId !== 0);

  // 사이드바 토글
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


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
    isSidebarOpen,

    // 함수들
    isProjectActive,
    isProjectSelected,
    toggleSidebar,
  };
};
