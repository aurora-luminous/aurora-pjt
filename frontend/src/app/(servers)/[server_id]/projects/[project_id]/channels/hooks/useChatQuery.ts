import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getChannelMessagesApi,
  getOlderChannelMessagesApi,
  getDmMessagesApi,
  getOlderDmMessagesApi,
} from "@/app/(servers)/api/chat.api";

export const useChannelMessagesQuery = (channelPk: number | null) => {
  return useQuery({
    queryKey: ["channelMessages", channelPk],
    queryFn: () => getChannelMessagesApi(channelPk!),
    enabled: !!channelPk,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useOlderChannelMessagesMutation = () => {
  return useMutation({
    mutationFn: ({
      channelPk,
      lastMessageTime,
    }: {
      channelPk: number;
      lastMessageTime: string;
    }) => getOlderChannelMessagesApi(channelPk, lastMessageTime),
  });
};

export const useDmMessagesQuery = (dmRoomPk: number | null) => {
  return useQuery({
    queryKey: ["dmMessages", dmRoomPk],
    queryFn: () => getDmMessagesApi(dmRoomPk!),
    enabled: !!dmRoomPk,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useOlderDmMessagesMutation = () => {
  return useMutation({
    mutationFn: ({
      dmRoomPk,
      lastMessageTime,
    }: {
      dmRoomPk: number;
      lastMessageTime: string;
    }) => getOlderDmMessagesApi(dmRoomPk, lastMessageTime),
  });
};
