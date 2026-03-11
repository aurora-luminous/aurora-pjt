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
  onLoadOlder?: () => void;
  isLoadingOlder?: boolean;
  hasMoreMessages?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  channelName,
  isLoading = false,
  onLoadOlder,
  isLoadingOlder = false,
  hasMoreMessages = true,
}) => {
  const { isMobile } = useResponsive();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  const previousFirstMessageIdRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const isLoadingOlderRef = useRef<boolean>(false);
  const previousScrollHeightRef = useRef<number>(0);

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
    previousFirstMessageIdRef.current = null;
    isLoadingOlderRef.current = false;
    // 채널 변경 시 즉시 맨 아래로 이동 (애니메이션 없이)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [channelName]);

  // 이전 메시지 로딩 상태 추적
  useEffect(() => {
    isLoadingOlderRef.current = isLoadingOlder;
  }, [isLoadingOlder]);

  // 이전 메시지가 추가되었을 때 스크롤 위치 유지
  useEffect(() => {
    if (!scrollContainerRef.current || messages.length === 0) {
      previousScrollHeightRef.current = scrollContainerRef.current?.scrollHeight || 0;
      previousFirstMessageIdRef.current = messages[0]?.id || null;
      return;
    }

    const currentFirstMessageId = messages[0]?.id;
    const isOlderMessagesAdded = 
      previousFirstMessageIdRef.current !== null &&
      currentFirstMessageId !== previousFirstMessageIdRef.current &&
      messages.length > previousMessagesLengthRef.current;

    if (isOlderMessagesAdded) {
      // 이전 메시지가 앞에 추가된 경우 스크롤 위치 유지
      const currentScrollTop = scrollContainerRef.current.scrollTop;
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      const scrollDifference = currentScrollHeight - previousScrollHeightRef.current;

      // 스크롤 위치를 조정하여 새로 추가된 메시지 위에 유지
      if (scrollDifference > 0) {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = currentScrollTop + scrollDifference;
          }
        });
      }
    }

    previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    previousFirstMessageIdRef.current = currentFirstMessageId;
  }, [messages.length, messages]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !onLoadOlder || !hasMoreMessages) return;

    const handleScroll = () => {
      // 초기 로드 중이거나 이전 메시지 로딩 중이면 무시
      if (isInitialLoadRef.current || isLoadingOlderRef.current) {
        return;
      }

      // 스크롤이 맨 위에 가까워지면 (50px 이내)
      if (container.scrollTop < 50) {
        console.log("📜 스크롤 맨 위 도달, 이전 메시지 로드");
        onLoadOlder();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [onLoadOlder, hasMoreMessages]);

  // 새 메시지가 추가될 때만 부드럽게 스크롤 (초기 로드가 아닐 때, 이전 메시지가 추가되지 않았을 때)
  useEffect(() => {
    if (!messages.length) {
      previousMessagesLengthRef.current = 0;
      return;
    }

    const currentFirstMessageId = messages[0]?.id;
    const isOlderMessagesAdded = 
      previousFirstMessageIdRef.current !== null &&
      currentFirstMessageId !== previousFirstMessageIdRef.current &&
      messages.length > previousMessagesLengthRef.current;

    // 이전 메시지가 추가된 경우가 아니고, 새 메시지가 추가된 경우에만 스크롤
    if (
      !isInitialLoadRef.current &&
      !isOlderMessagesAdded &&
      messages.length > previousMessagesLengthRef.current &&
      lastMessageRef.current
    ) {
      // 메시지가 맨 뒤에 추가된 경우에만 스크롤 (새 메시지)
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

      {/* 이전 메시지 로딩 중 표시 */}
      {isLoadingOlder && (
        <div className="flex justify-center py-4">
          <div className="text-gray-400 text-sm">이전 메시지 불러오는 중...</div>
        </div>
      )}

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
