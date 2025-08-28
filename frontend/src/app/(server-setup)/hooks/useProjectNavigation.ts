import { useRouter } from "next/navigation";
import {
  useGetProjectListMutation,
  useGetChannelListMutation,
  useCreateChannelMutation,
} from "./useServerMutation";
import { ServerInfo } from "./useServer";

/**
 * 프로젝트 조회 및 채널 입장을 담당하는 훅
 */
export const useProjectNavigation = () => {
  const getProjectListMutation = useGetProjectListMutation();
  const getChannelListMutation = useGetChannelListMutation();
  const createChannelMutation = useCreateChannelMutation();
  const router = useRouter();

  /**
   * 프로젝트와 채널을 조회하고 첫 번째 채널로 입장
   */
  const navigateToFirstChannel = async (
    serverUrl: string,
    serverName: string
  ): Promise<void> => {
    try {
      // 1. 프로젝트 목록 조회
      console.log("📋 프로젝트 목록 조회 중...");
      const projects = await getProjectListMutation.mutateAsync(serverUrl);

      const firstProject = projects[0];
      console.log("📁 첫 번째 프로젝트 선택:", firstProject);

      // 2. 채널 목록 조회
      console.log("📺 채널 목록 조회 중...");
      const channels = await getChannelListMutation.mutateAsync({
        serverUrl,
        projectPk: firstProject.projectPk,
      });

      let targetChannel;

      // 3. 채널이 없으면 생성
      if (!channels || channels.length === 0) {
        console.log("📺 채널이 없어서 기본 채널 생성 중...");

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
        targetChannel = channels[0];
        console.log("📺 첫 번째 채널 선택:", targetChannel);
      }

      // 4. 서버 정보 저장 및 라우팅
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

      // 채널로 이동
      const encodedChannelName = encodeURIComponent(targetChannel.channelName);
      const targetUrl = `/${serverUrl}/projects/${firstProject.projectPk}/channels/${encodedChannelName}`;

      console.log("🔄 라우팅 URL:", targetUrl);
      console.log("💾 서버 정보 저장:", serverInfo);

      router.push(targetUrl);
      console.log("🎉 채널 입장 완료!");
    } catch (error) {
      console.error("❌ 프로젝트 네비게이션 실패:", error);
      throw error;
    }
  };

  return {
    navigateToFirstChannel,
    isLoadingProjects: getProjectListMutation.isPending,
    isLoadingChannels: getChannelListMutation.isPending,
    isCreatingChannel: createChannelMutation.isPending,
    projectError: getProjectListMutation.error,
    channelError: getChannelListMutation.error,
    createChannelError: createChannelMutation.error,
  };
};
