import React from "react";
import { Message } from "../../../../../types";
import { MessageItem } from "./MessageItem";
import { WelcomeMessage } from "./WelcomeMessage";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface MessageListProps {
  messages: Message[];
  channelName: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  channelName,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
      bg-chatting-background flex-1 overflow-y-auto
      ${isMobile ? "p-3" : "p-4"}
    `}
    >
      {/* 웰컴 메시지 */}
      <WelcomeMessage channelName={channelName} />

      <div
        className={`
        text-center text-gray-500 mb-4
        ${isMobile ? "text-xs" : "text-sm"}
      `}
      >
        7월 12일
      </div>

      {/* 메시지 목록 */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};
