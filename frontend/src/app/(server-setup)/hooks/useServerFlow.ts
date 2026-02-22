import { useAddServerMutation } from "./useServerMutation";
import { ServerRequest, ServerListItem } from "../types/Server";
import { useRouter } from "next/navigation";
import { ServerInfo } from "./useServer";
import { useMutation } from "@tanstack/react-query";
import { expressClient } from "@/app/lib/axiosClient";
import {
  checkServerAccess,
  createPendingPageUrl,
  createChannelUrl,
} from "../utils/serverAccessUtils";

/**
 * 서버 관련 전체 플로우를 통합 관리하는 훅
 */
export const useServerFlow = () => {
  const addServerMutation = useAddServerMutation();
  const router = useRouter();

  /**
   * 서버 추가 처리
   */
  const handleAddServer = async (data: ServerRequest) => {
    console.log("서버 추가 프로세스 시작 - 데이터:", data);
    try {
      const response = await addServerMutation.mutateAsync(data);
      console.log("✅ 서버 추가 성공:", response);
      return response;
    } catch (error) {
      console.error("❌ 서버 추가 실패:", error);
      throw error;
    }
  };

  /**
   * 서버 연결 처리 - expressClient 직접 호출 (mutationFn에서 React Hook 사용 불가)
   */
  const serverConnectionMutation = useMutation({
    mutationFn: async ({
      serverUrl,
      serverName,
    }: {
      serverUrl: string;
      serverName: string;
    }) => {
      console.log("🚀 서버 연결 프로세스 시작:", { serverUrl, serverName });

      // 1. 서버 목록 조회 및 권한 확인
      console.log("🔍 서버 목록 조회 중...");
      const serverListResponse = await expressClient.get("/ex/servers");
      const serverList = serverListResponse.data;

      if (!serverList) {
        throw new Error("서버 목록을 가져올 수 없습니다.");
      }

      const hasAccess = checkServerAccess(serverList, serverUrl, serverName);

      if (!hasAccess) {
        console.log("❌ 서버 접근 권한 없음, 승인 대기 페이지로 이동");
        const pendingUrl = createPendingPageUrl(serverUrl, serverName);
        router.push(pendingUrl);
        return;
      }

      console.log("✅ 서버 접근 권한 확인됨");

      // 2. 프로젝트 목록 조회
      console.log("📋 프로젝트 목록 조회 중...");
      const projectResponse = await expressClient.get(
        `/ex/servers/${serverUrl}/projects`
      );
      const projects = projectResponse.data;

      if (!projects || projects.length === 0) {
        const pendingUrl = createPendingPageUrl(serverUrl, serverName);
        router.push(pendingUrl);
      }

      const firstProject = projects[0];
      console.log("📁 첫 번째 프로젝트 선택:", firstProject);

      // 3. 채널 목록 조회
      console.log("📺 채널 목록 조회 중...");
      const channelResponse = await expressClient.get(
        `/ex/servers/${serverUrl}/projects/${firstProject.projectPk}/channels`
      );
      const channels = channelResponse.data;

      let targetChannel;

      // 4. 채널이 없으면 생성
      if (!channels || channels.length === 0) {
        console.log("📺 채널이 없어서 기본 채널 생성 중...");

        const createChannelResponse = await expressClient.post(
          `/ex/servers/${serverUrl}/projects/${firstProject.projectPk}/channels`,
          {
            channelKind: "text",
            isPrivate: false,
            channelRole: "member",
            channelName: "general",
          }
        );
        targetChannel = createChannelResponse.data;

        console.log("✅ 기본 채널 생성 완료:", targetChannel);
      } else {
        targetChannel = channels[0];
        console.log("📺 첫 번째 채널 선택:", targetChannel);
      }

      if (!targetChannel) {
        throw new Error("채널을 찾거나 생성할 수 없습니다.");
      }

      // 5. 서버 정보 저장 및 라우팅
      const serverInfo: ServerInfo = {
        serverName,
        serverUrl,
        projectName: firstProject.projectName,
        projectPk: firstProject.projectPk,
        channelName: targetChannel.channelName,
        role:
          serverList?.find(
            (server: ServerListItem) => server.serverUrl === serverUrl
          )?.serverRole || "",
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem("currentServerInfo", JSON.stringify(serverInfo));
      }

      const targetUrl = createChannelUrl(
        serverUrl,
        firstProject.projectPk,
        targetChannel.channelPk,
        targetChannel.channelKind
      );

      console.log("🔄 라우팅 URL:", targetUrl);
      console.log("💾 서버 정보 저장:", serverInfo);

      router.push(targetUrl);
      console.log("🎉 서버 연결 완료!");

      return { serverInfo, targetUrl };
    },
    onError: (error) => {
      console.error("❌ 서버 연결 실패:", error);
    },
  });

  const handleServerConnection = async (
    serverUrl: string,
    serverName: string
  ) => {
    await serverConnectionMutation.mutateAsync({ serverUrl, serverName });
  };

  return {
    // 주요 액션
    handleAddServer,
    handleServerConnection,

    // 상세 상태
    isAddingServer: addServerMutation.isPending,
    isValidatingAccess: serverConnectionMutation.isPending,
    isLoadingProjects: serverConnectionMutation.isPending,
    isLoadingChannels: serverConnectionMutation.isPending,
    isCreatingChannel: serverConnectionMutation.isPending,

    // 통합 상태
    isLoading:
      addServerMutation.isPending || serverConnectionMutation.isPending,
    hasError: !!addServerMutation.error || !!serverConnectionMutation.error,

    // 에러
    addServerError: addServerMutation.error,
    validationError: serverConnectionMutation.error,
    projectError: serverConnectionMutation.error,
    channelError: serverConnectionMutation.error,
    createChannelError: serverConnectionMutation.error,

    // 성공 상태
    isAddServerSuccess: addServerMutation.isSuccess,
    resetAddServer: addServerMutation.reset,
  };
};
