import React from "react";
import { Message } from "../../../../../types";
import { MessageItem } from "./MessageItem";
import { WelcomeMessage } from "./WelcomeMessage";

interface MessageListProps {
  messages: Message[];
  channelName: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  channelName,
}) => {
  return (
    <div className="bg-chatting-background flex-1 overflow-y-auto p-4">
      {/* 웰컴 메시지 */}
      <WelcomeMessage channelName={channelName} />

      <div className="text-center text-gray-500 text-sm mb-4">7월 12일</div>

      {/* 메시지 목록 */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};
