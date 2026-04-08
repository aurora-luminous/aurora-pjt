import { springClient } from "@/app/lib/axiosClient";
import type { MessageResponse } from "../types";

export const getChannelMessagesApi = (channelPk: number): Promise<MessageResponse[]> =>
  springClient
    .get<MessageResponse[]>(`/chat/channel/${channelPk}/messages`)
    .then((res) => res.data);

export const getOlderChannelMessagesApi = (
  channelPk: number,
  lastMessageTime: string
): Promise<MessageResponse[]> =>
  springClient
    .get<MessageResponse[]>(`/chat/channel/${channelPk}/messages/older`, {
      params: { lastMessageTime },
    })
    .then((res) => res.data);

export const getDmMessagesApi = (dmRoomPk: number): Promise<MessageResponse[]> =>
  springClient
    .get<MessageResponse[]>(`/chat/dm/${dmRoomPk}/messages`)
    .then((res) => res.data);

export const getOlderDmMessagesApi = (
  dmRoomPk: number,
  lastMessageTime: string
): Promise<MessageResponse[]> =>
  springClient
    .get<MessageResponse[]>(`/chat/dm/${dmRoomPk}/messages/older`, {
      params: { lastMessageTime },
    })
    .then((res) => res.data);
