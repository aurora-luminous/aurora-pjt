import type { Message, MessageResponse, ChatMessage } from "../types";

const formatTimestamp = (isoString: string): string =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const mapMessageResponseToMessage = (msg: MessageResponse): Message => ({
  id: msg.messagePk,
  user: msg.userName,
  content: msg.content,
  timestamp: formatTimestamp(msg.createdAt),
  isSystem: false,
});

export const mapChatMessageToMessage = (msg: ChatMessage): Message => ({
  id: msg.messagePk,
  user: msg.userName,
  content: msg.content,
  timestamp: formatTimestamp(msg.createdAt),
  isSystem: false,
});
