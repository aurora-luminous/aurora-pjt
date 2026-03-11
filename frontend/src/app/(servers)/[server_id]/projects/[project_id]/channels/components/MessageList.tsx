import React, { useEffect, useRef } from "react";
import { Message } from "../../../../../types";
import { MessageItem } from "./MessageItem";
import { WelcomeMessage } from "./WelcomeMessage";
import { useResponsive } from "../../../../../../lib/useResponsive";
import { MessageListSkeleton } from "./MessageSkeleton";

interface MessageListProps {
  messages: Message[];
  channelName: string;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  channelName,
  isLoading = false,
}) => {
  const { isMobile } = useResponsive();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가되면 자동으로 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 채널 변경 시 스크롤을 맨 아래로 초기화
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [channelName]);

  return (
    <div
      ref={scrollContainerRef}
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
      {isLoading ? (
        <MessageListSkeleton />
      ) : (
        messages.map((message, index) => (
          <div
            key={message.id}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <MessageItem message={message} />
          </div>
        ))
      )}
    </div>
  );
};
