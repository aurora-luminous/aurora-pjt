import { useState, useEffect } from "react";
import { useServerFlow } from "./useServerFlow";

// 서버 정보 타입 정의
export interface ServerInfo {
  serverName: string;
  serverUrl: string;
  projectName: string;
  projectPk: number;
  channelName: string;
  role: string;
}

/**
 * 현재 서버 정보를 가져오는 커스텀 훅
 */
export const useCurrentServerInfo = (): ServerInfo | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem("currentServerInfo");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * 서버 관련 모든 로직을 통합 관리하는 커스텀 훅
 *
 * ⚠️ 레거시 지원: 기존 코드와의 호환성을 위해 인터페이스 유지
 * 💡 새로운 코드에서는 useServerFlow() 사용을 권장
 */
export const useServer = () => {
  const serverFlow = useServerFlow();

  return {
    // 🎯 메인 액션들 (기존 인터페이스 유지)
    handleAddServer: serverFlow.handleAddServer,
    handleGetProjectList: serverFlow.handleServerConnection, // 이름만 유지, 내부는 개선됨

    // 📊 로딩 상태들 (기존 인터페이스 유지)
    isAddingServer: serverFlow.isAddingServer,
    isGettingServerList: serverFlow.isValidatingAccess,
    isGettingProjectList: serverFlow.isLoadingProjects,
    isGettingChannelList: serverFlow.isLoadingChannels,
    isCreatingChannel: serverFlow.isCreatingChannel,

    // ✅ 성공 상태들
    isAddServerSuccess: serverFlow.isAddServerSuccess,
    isAddServerError: !!serverFlow.addServerError,

    // ❌ 에러들 (기존 인터페이스 유지)
    addServerError: serverFlow.addServerError,
    serverListError: serverFlow.validationError,
    projectListError: serverFlow.projectError,
    channelListError: serverFlow.channelError,
    createChannelError: serverFlow.createChannelError,

    // 🔄 기타
    addServerMutation: null, // 레거시 호환용
    resetAddServer: serverFlow.resetAddServer,
  };
};
