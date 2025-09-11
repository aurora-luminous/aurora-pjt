import { useQueryClient } from "@tanstack/react-query";
import {
  useKickChannelMemberMutation,
  useBanChannelMemberMutation,
  useUnbanChannelMemberMutation,
} from "./useServerMutation";

export const useChannelFlow = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const queryClient = useQueryClient();
  const kickChannelMemberMutation = useKickChannelMemberMutation(
    serverUrl,
    projectPk,
    channelPk
  );
  const banChannelMemberMutation = useBanChannelMemberMutation(
    serverUrl,
    projectPk,
    channelPk
  );
  const unbanChannelMemberMutation = useUnbanChannelMemberMutation(
    serverUrl,
    projectPk,
    channelPk
  );

  const handleKickMember = async (userEmail: string) => {
    try {
      const response = await kickChannelMemberMutation.mutateAsync(userEmail);
      queryClient.invalidateQueries({
        queryKey: ["channelMemberList", serverUrl, projectPk, channelPk],
      });
      return response;
    } catch (error) {
      console.error("❌ 채널 멤버 추방 실패:", error);
      throw error;
    }
  };

  const handleBanMember = async (userEmail: string) => {
    try {
      const response = await banChannelMemberMutation.mutateAsync(userEmail);
      queryClient.invalidateQueries({
        queryKey: ["channelMemberList", serverUrl, projectPk, channelPk],
      });
      return response;
    } catch (error) {
      console.error("❌ 채널 멤버 차단 실패:", error);
      throw error;
    }
  };

  const handleUnbanMember = async (userEmail: string) => {
    try {
      const response = await unbanChannelMemberMutation.mutateAsync(userEmail);
      queryClient.invalidateQueries({
        queryKey: ["channelMemberList", serverUrl, projectPk, channelPk],
      });
      return response;
    } catch (error) {
      console.error("❌ 채널 멤버 차단 해제 실패:", error);
      throw error;
    }
  };

  return {
    handleKickMember,
    handleBanMember,
    handleUnbanMember,
  };
};
