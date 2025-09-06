import { useRouter } from "next/navigation";
import { ServerInfo } from "./useServer";
import { useCallback, useState } from "react";
import { Project } from "../types/Projcets";
import {
  useProjectListQuery,
  useChannelListQuery,
  useCreateChannelMutation,
} from "./useServerMutation";
import { createChannelUrl } from "../utils/serverAccessUtils";
import { useServerListQuery } from "./useServerMutation";
/**
 * 프로젝트 조회 및 채널 입장을 담당하는 훅
 * 사용 시점에 serverUrl을 알고 있어야 함
 */
export const useProjectNavigation = (serverUrl?: string) => {
  const router = useRouter();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const serverListQuery = useServerListQuery(true);

  // 기본 mutation들 (serverUrl이 유효할 때만 활성화)
  // 빈 문자열이나 null/undefined일 때는 "DISABLED"로 설정하여 enabled 조건을 확실히 차단
  const safeServerUrl = serverUrl || "";
  const projectListMutation = useProjectListQuery(safeServerUrl);
  console.log("serverUrl", serverUrl);

  // 채널 관련 Hook들도 최상위에서 초기화
  const channelListQuery = useChannelListQuery(
    safeServerUrl,
    currentProject?.projectPk || 0
  );
  const createChannelMutation = useCreateChannelMutation(
    safeServerUrl,
    currentProject?.projectPk || 0
  );

  /**
   * 프로젝트와 채널을 조회하고 첫 번째 채널로 입장
   */
  const navigateToFirstChannel = useCallback(
    async (targetServerUrl: string, serverName: string): Promise<void> => {
      try {
        // 1. 프로젝트 목록 조회
        console.log("📋 프로젝트 목록 조회 중...");

        // 데이터가 없으면 refetch 실행
        let projects = projectListMutation.data;
        if (!projects) {
          console.log("📡 프로젝트 목록 데이터가 없음, refetch 실행");
          const result = await projectListMutation.refetch();
          projects = result.data;
        }

        if (!projects || projects.length === 0) {
          throw new Error("프로젝트가 존재하지 않습니다.");
        }

        const firstProject = projects[0];
        console.log("📁 첫 번째 프로젝트 선택:", firstProject);

        // 2. 현재 프로젝트 설정 (채널 Hook들이 업데이트됨)
        setCurrentProject(firstProject);

        // 3. 채널 조회 및 네비게이션
        await navigateToChannel(targetServerUrl, firstProject, serverName);
      } catch (error) {
        console.error("❌ 프로젝트 네비게이션 실패:", error);
        throw error;
      }
    },
    [projectListMutation, channelListQuery, createChannelMutation]
  );

  /**
   * 채널 네비게이션 로직
   */
  const navigateToChannel = useCallback(
    async (serverUrl: string, project: Project, serverName: string) => {
      try {
        console.log("📺 채널 목록 조회 중...");

        // 채널 데이터 조회 (이미 최상위에서 초기화된 Hook 사용)
        let channels = channelListQuery.data;
        if (!channels) {
          console.log("📡 채널 목록 데이터가 없음, refetch 실행");
          const result = await channelListQuery.refetch();
          channels = result.data;
        }

        let targetChannel;

        // 채널이 없으면 생성
        if (!channels || channels.length === 0) {
          console.log("📺 채널이 없어서 기본 채널 생성 중...");

          targetChannel = await createChannelMutation.mutateAsync({
            channelKind: "text",
            isPrivate: false,
            channelRole: "member",
            channelName: "general",
          });

          console.log("✅ 기본 채널 생성 완료:", targetChannel);
        } else {
          targetChannel = channels[0];
          console.log("📺 첫 번째 채널 선택:", targetChannel);
        }

        if (!targetChannel) {
          throw new Error("채널을 찾거나 생성할 수 없습니다.");
        }

        // 3. 서버 정보 저장 및 라우팅
        const serverInfo: ServerInfo = {
          serverName,
          serverUrl,
          projectName: project.projectName,
          projectPk: project.projectPk,
          channelName: targetChannel.channelName,
          role:
            serverListQuery.data?.find(
              (server) => server.serverUrl === serverUrl
            )?.serverRole || "",
        };

        // sessionStorage에 서버 정보 저장
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "currentServerInfo",
            JSON.stringify(serverInfo)
          );
        }

        // 채널로 이동 - 유틸 함수 사용
        console.log("targetChannel.channelKind", targetChannel.channelKind);
        const targetUrl = createChannelUrl(
          serverUrl,
          project.projectPk,
          targetChannel.channelName,
          targetChannel.channelKind
        );

        console.log("🔄 라우팅 URL:", targetUrl);
        console.log("💾 서버 정보 저장:", serverInfo);

        router.push(targetUrl);
        console.log("🎉 채널 입장 완료!");
      } catch (error) {
        console.error("❌ 채널 네비게이션 실패:", error);
        throw error;
      }
    },
    [router, channelListQuery, createChannelMutation]
  );

  return {
    navigateToFirstChannel,
    projectListMutation,
    isLoadingProjects: projectListMutation.isPending,
    projectError: projectListMutation.error,
    isLoadingChannels: channelListQuery.isPending,
    isCreatingChannel: createChannelMutation.isPending,
    channelError: channelListQuery.error,
    createChannelError: createChannelMutation.error,
  };
};
