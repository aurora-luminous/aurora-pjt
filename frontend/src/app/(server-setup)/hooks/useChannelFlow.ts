import { useQueryClient } from "@tanstack/react-query";
import {
  useKickChannelMemberMutation,
  useBanChannelMemberMutation,
  useUnbanChannelMemberMutation,
  useLeaveChannelMutation,
  useDeleteChannelMutation,
  useUpdateChannelMutation,
} from "./useServerMutation";
import { useModal } from "./useModal";
import type { ChannelPayload } from "../types";

export const useChannelFlow = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const queryClient = useQueryClient();
  const { close } = useModal();
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

  const leaveChannelMutation = useLeaveChannelMutation(
    serverUrl,
    projectPk,
    channelPk
  );

  const deleteChannelMutation = useDeleteChannelMutation(
    serverUrl,
    projectPk,
  )

  const updateChannelMutation = useUpdateChannelMutation(
    serverUrl,
    projectPk,
    channelPk
  )

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

  const handleLeaveChannel = async (userEmail: string) => {
    try {
      const response = await leaveChannelMutation.mutateAsync(userEmail);
      queryClient.invalidateQueries({
        queryKey: ["channelList", serverUrl, projectPk],
      });
      return response;
    } catch (error) {
      console.error("❌ 채널 퇴장 실패:", error);
      throw error;
    }
  };

  const handleDeleteChannel = async (channelPk: number) => {
    const isConfirm = confirm("채널을 삭제하시겠습니까?");
    if (!isConfirm) return;
    try {
      const response = await deleteChannelMutation.mutateAsync(channelPk);
      queryClient.invalidateQueries({
        queryKey: ["channelList", serverUrl, projectPk],
      });
      close();
      return response;
    } catch (error) {
      console.error("❌ 채널 삭제 실패:", error);
      throw error;
    }
  };

  const handleUpdateChannel = async (payload: ChannelPayload) => {
      try {
        const response = await updateChannelMutation.mutateAsync(payload);
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }

  return {
    handleKickMember,
    handleBanMember,
    handleUnbanMember,
    handleLeaveChannel,
    handleDeleteChannel,
    handleUpdateChannel
  };
};
