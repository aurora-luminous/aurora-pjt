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
  const previousMessagesLengthRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // 로딩이 끝나고 메시지가 처음 로드될 때 맨 아래로 즉시 이동 (애니메이션 없이)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isInitialLoadRef.current) {
      // 다음 프레임에서 실행하여 DOM이 완전히 렌더링된 후 스크롤
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        isInitialLoadRef.current = false;
      });
    }
  }, [isLoading, messages.length]);

  // 채널 변경 시 초기 로드 플래그 리셋
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessagesLengthRef.current = 0;
    // 채널 변경 시 즉시 맨 아래로 이동 (애니메이션 없이)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [channelName]);

  // 새 메시지가 추가될 때만 부드럽게 스크롤 (초기 로드가 아닐 때)
  useEffect(() => {
    if (
      !isInitialLoadRef.current &&
      messages.length > previousMessagesLengthRef.current &&
      lastMessageRef.current
    ) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages]);

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
