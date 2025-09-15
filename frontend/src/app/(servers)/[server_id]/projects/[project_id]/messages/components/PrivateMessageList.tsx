import React from "react";
import { PrivateMessage } from "../../../../../types";
import { PrivateMessageItem } from "./PrivateMessageItem";
import { PrivateWelcomeMessage } from "./PrivateWelcomeMessage";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface PrivateMessageListProps {
  messages: PrivateMessage[];
  userName: string;
}

export const PrivateMessageList: React.FC<PrivateMessageListProps> = ({
  messages,
  userName,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
      flex-1 overflow-y-auto bg-gray-50
      ${isMobile ? "p-3" : "p-4"}
    `}
    >
      {/* 웰컴 메시지 */}
      <PrivateWelcomeMessage userName={userName} />

      <div
        className={`
        text-center text-gray-500 mb-4
        ${isMobile ? "text-xs" : "text-sm"}
      `}
      >
        오늘
      </div>

      {/* 메시지 목록 */}
      {messages.map((message) => (
        <PrivateMessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};
