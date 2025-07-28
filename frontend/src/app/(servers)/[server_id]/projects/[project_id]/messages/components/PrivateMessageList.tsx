import React from "react";
import { PrivateMessage } from "../../../../../types";
import { PrivateMessageItem } from "./PrivateMessageItem";
import { PrivateWelcomeMessage } from "./PrivateWelcomeMessage";

interface PrivateMessageListProps {
  messages: PrivateMessage[];
  userName: string;
}

export const PrivateMessageList: React.FC<PrivateMessageListProps> = ({
  messages,
  userName,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {/* 웰컴 메시지 */}
      <PrivateWelcomeMessage userName={userName} />

      <div className="text-center text-gray-500 text-sm mb-4">오늘</div>

      {/* 메시지 목록 */}
      {messages.map((message) => (
        <PrivateMessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};
