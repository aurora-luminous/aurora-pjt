import { useRouter } from "next/navigation";
import {
  useAddServerMutation,
  useGetProjectListMutation,
  useGetChannelListMutation,
  useCreateChannelMutation,
} from "./useServerMutation";
import { ServerRequest } from "../types/Server";
import { useState, useEffect } from "react";

// 서버 정보 타입 정의
export interface ServerInfo {
  serverName: string;
  serverUrl: string;
  projectName: string;
  projectPk: number;
  channelName: string;
}

/**
 * 현재 서버 정보를 가져오는 커스텀 훅
 */
export const useCurrentServerInfo = (): ServerInfo | null => {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("currentServerInfo");
      if (stored) {
        try {
          setServerInfo(JSON.parse(stored));
        } catch (error) {
          console.error("서버 정보 파싱 실패:", error);
          setServerInfo(null);
        }
      }
    }
  }, []);

  return serverInfo;
};

/**
 * 서버 관련 모든 로직을 통합 관리하는 커스텀 훅
 * useAuth와 동일한 패턴으로 서버 추가, 입장, 나가기 등을 처리합니다.
 */
export const useServer = () => {
  const addServerMutation = useAddServerMutation();
  const getProjectListMutation = useGetProjectListMutation();
  const getChannelListMutation = useGetChannelListMutation();
  const createChannelMutation = useCreateChannelMutation();
  const router = useRouter();

  /**
   * 서버 추가 처리 함수
   */
  const handleAddServer = async (data: ServerRequest) => {
    console.log("서버 추가 프로세스 시작 - 데이터:", data);
    try {
      const response = await addServerMutation.mutateAsync(data);
      console.log("✅ 서버 추가 성공:", response);

      console.log("🎉 서버 추가 완료!");
    } catch (error) {
      console.error("❌ 서버 추가 실패:", error);
      throw error;
    }
  };

  /**
   * 프로젝트 목록 조회 후 자동으로 채널 입장 처리
   */
  const handleGetProjectList = async (
    serverUrl: string,
    serverName: string
  ) => {
    try {
      console.log("🚀 서버 연결 프로세스 시작:", { serverUrl, serverName });

      // 1. 프로젝트 목록 조회
      console.log("📋 프로젝트 목록 조회 중...");
      const projects = await getProjectListMutation.mutateAsync(serverUrl);

      if (!projects || projects.length === 0) {
        throw new Error("프로젝트가 존재하지 않습니다.");
      }

      // 2. 첫 번째 프로젝트 선택
      const firstProject = projects[0];
      console.log("📁 첫 번째 프로젝트 선택:", firstProject);

      // 3. 해당 프로젝트의 채널 목록 조회
      console.log("📺 채널 목록 조회 중...");
      const channels = await getChannelListMutation.mutateAsync({
        serverUrl,
        projectPk: firstProject.projectPk,
      });

      let targetChannel;

      // 4. 채널이 비어있는지 확인
      if (!channels || channels.length === 0) {
        console.log("📺 채널이 없어서 기본 채널 생성 중...");

        // 5. 채널 생성
        targetChannel = await createChannelMutation.mutateAsync({
          serverUrl,
          projectPk: firstProject.projectPk,
          channelData: {
            channelKind: "text",
            isPrivate: false,
            channelRole: "member",
          },
        });

        console.log("✅ 기본 채널 생성 완료:", targetChannel);
      } else {
        // 6. 첫 번째 채널 선택
        targetChannel = channels[0];
        console.log("📺 첫 번째 채널 선택:", targetChannel);
      }

      // 7. 서버 정보를 sessionStorage에 저장하고 라우팅
      const serverInfo: ServerInfo = {
        serverName,
        serverUrl,
        projectName: firstProject.projectName,
        projectPk: firstProject.projectPk,
        channelName: targetChannel.channelName,
      };

      // sessionStorage에 서버 정보 저장
      if (typeof window !== "undefined") {
        sessionStorage.setItem("currentServerInfo", JSON.stringify(serverInfo));
      }

      const encodedChannelName = encodeURIComponent(targetChannel.channelName);
      const targetUrl = `/${serverUrl}/projects/${firstProject.projectPk}/channels/${encodedChannelName}`;
      console.log("🔄 라우팅 URL:", targetUrl);
      console.log("💾 서버 정보 저장:", serverInfo);

      router.push(targetUrl);
      console.log("🎉 서버 연결 완료!");
    } catch (error) {
      console.error("❌ 서버 연결 실패:", error);
      throw error;
    }
  };

  return {
    handleAddServer,
    handleGetProjectList,
    isAddingServer: addServerMutation.isPending,
    isAddServerSuccess: addServerMutation.isSuccess,
    isAddServerError: addServerMutation.isError,
    addServerError: addServerMutation.error,
    addServerMutation,
    resetAddServer: addServerMutation.reset,
    // 추가 상태들
    isGettingProjectList: getProjectListMutation.isPending,
    isGettingChannelList: getChannelListMutation.isPending,
    isCreatingChannel: createChannelMutation.isPending,
    projectListError: getProjectListMutation.error,
    channelListError: getChannelListMutation.error,
    createChannelError: createChannelMutation.error,
  };
};
