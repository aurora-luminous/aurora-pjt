import { useQuery, useMutation } from "@tanstack/react-query";
import { springClient } from "@/app/lib/axiosClient";
import { MessageResponse } from "../types";

/**
 * 채팅 관련 API를 관리하는 훅
 * 모든 API 호출은 React Query를 통해 관리됩니다.
 */

/**
 * 채널 최신 메시지 조회 Query Hook
 */
export const useChannelMessagesQuery = (channelPk: number | null) => {
  return useQuery({
    queryKey: ["channelMessages", channelPk],
    queryFn: async () => {
      const response = await springClient.get<MessageResponse[]>(
        `/chat/channel/${channelPk}/messages`
      );
      return response.data;
    },
    enabled: !!channelPk,
    staleTime: 0, // 항상 최신 데이터 조회
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
};

/**
 * 채널 이전 메시지 조회 Mutation Hook (무한스크롤용)
 * 수동 호출이 필요한 경우 사용
 */
export const useOlderChannelMessagesMutation = () => {
  return useMutation({
    mutationFn: async ({ channelPk, lastMessageTime }: { channelPk: number; lastMessageTime: string }) => {
      const response = await springClient.get<MessageResponse[]>(
        `/chat/channel/${channelPk}/messages/older`,
        {
          params: {
            lastMessageTime,
          },
        }
      );
      return response.data;
    },
  });
};

/**
 * DM방 최신 메시지 조회 Query Hook
 */
export const useDmMessagesQuery = (dmRoomPk: number | null) => {
  return useQuery({
    queryKey: ["dmMessages", dmRoomPk],
    queryFn: async () => {
      const response = await springClient.get<MessageResponse[]>(
        `/chat/dm/${dmRoomPk}/messages`
      );
      return response.data;
    },
    enabled: !!dmRoomPk,
    staleTime: 0, // 항상 최신 데이터 조회
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
};

/**
 * DM방 이전 메시지 조회 Mutation Hook (무한스크롤용)
 * 수동 호출이 필요한 경우 사용
 */
export const useOlderDmMessagesMutation = () => {
  return useMutation({
    mutationFn: async ({ dmRoomPk, lastMessageTime }: { dmRoomPk: number; lastMessageTime: string }) => {
      const response = await springClient.get<MessageResponse[]>(
        `/chat/dm/${dmRoomPk}/messages/older`,
        {
          params: {
            lastMessageTime,
          },
        }
      );
      return response.data;
    },
  });
};
