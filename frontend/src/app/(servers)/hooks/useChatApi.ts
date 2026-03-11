import { useQuery } from "@tanstack/react-query";
import { springClient } from "@/app/lib/axiosClient";
import { MessageResponse } from "../types";

/**
 * 채팅 관련 API를 관리하는 훅
 */

// 채널 최신 메시지 조회 API 함수
export const getChannelMessages = async (
  channelPk: number
): Promise<MessageResponse[]> => {
  const response = await springClient.get<MessageResponse[]>(
    `/chat/channel/${channelPk}/messages`
  );
  return response.data;
};

// 채널 이전 메시지 조회 API 함수 (무한스크롤용)
export const getOlderChannelMessages = async (
  channelPk: number,
  lastMessageTime: string
): Promise<MessageResponse[]> => {
  const response = await springClient.get<MessageResponse[]>(
    `/chat/channel/${channelPk}/messages/older`,
    {
      params: {
        lastMessageTime,
      },
    }
  );
  return response.data;
};

// DM방 최신 메시지 조회 API 함수
export const getDmMessages = async (
  dmRoomPk: number
): Promise<MessageResponse[]> => {
  const response = await springClient.get<MessageResponse[]>(
    `/chat/dm/${dmRoomPk}/messages`
  );
  return response.data;
};

// DM방 이전 메시지 조회 API 함수 (무한스크롤용)
export const getOlderDmMessages = async (
  dmRoomPk: number,
  lastMessageTime: string
): Promise<MessageResponse[]> => {
  const response = await springClient.get<MessageResponse[]>(
    `/chat/dm/${dmRoomPk}/messages/older`,
    {
      params: {
        lastMessageTime,
      },
    }
  );
  return response.data;
};

/**
 * 채널 최신 메시지 조회 Query Hook
 */
export const useChannelMessagesQuery = (channelPk: number | null) => {
  return useQuery({
    queryKey: ["channelMessages", channelPk],
    queryFn: () => getChannelMessages(channelPk!),
    enabled: !!channelPk,
    staleTime: 0, // 항상 최신 데이터 조회
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
};

/**
 * 채널 이전 메시지 조회 Query Hook (무한스크롤용)
 */
export const useOlderChannelMessagesQuery = (
  channelPk: number | null,
  lastMessageTime: string | null,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ["olderChannelMessages", channelPk, lastMessageTime],
    queryFn: () => getOlderChannelMessages(channelPk!, lastMessageTime!),
    enabled: enabled && !!channelPk && !!lastMessageTime,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};

/**
 * DM방 최신 메시지 조회 Query Hook
 */
export const useDmMessagesQuery = (dmRoomPk: number | null) => {
  return useQuery({
    queryKey: ["dmMessages", dmRoomPk],
    queryFn: () => getDmMessages(dmRoomPk!),
    enabled: !!dmRoomPk,
    staleTime: 0, // 항상 최신 데이터 조회
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
};

/**
 * DM방 이전 메시지 조회 Query Hook (무한스크롤용)
 */
export const useOlderDmMessagesQuery = (
  dmRoomPk: number | null,
  lastMessageTime: string | null,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ["olderDmMessages", dmRoomPk, lastMessageTime],
    queryFn: () => getOlderDmMessages(dmRoomPk!, lastMessageTime!),
    enabled: enabled && !!dmRoomPk && !!lastMessageTime,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};
