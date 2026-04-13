"use client";

import React from "react";
import { ChatHeader, MessageList, MessageInput } from "../components";
import { useResponsive } from "../../../../../../lib/useResponsive";
import { useChannelPage } from "../hooks/useChannelPage";

const ChannelPage = () => {
  const { isMobile } = useResponsive();
  const {
    channelId,
    newMessage,
    setNewMessage,
    messages,
    getChannelName,
    handleSendMessage,
    loadingChannels,
    loadingMessages,
    loadOlderMessages,
    loadingOlderMessages,
    hasMoreMessages,
  } = useChannelPage();

  // URL의 channelId로 실제 채널명 가져오기
  const channelName = getChannelName(channelId);

  // 로딩 상태 표시
  if (loadingChannels) {
    return (
      <div className="h-full flex items-center justify-center bg-chatting-background">
        <div
          className={`
          text-white
          ${isMobile ? "text-base" : "text-lg"}
        `}
        >
          채널 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* 중앙: 채팅 영역 */}
      <div className="flex-1 flex flex-col rounded-tl-lg rounded-tr-lg overflow-hidden bg-chatting-background">
        {/* 채팅 헤더 - 실제 채널명 사용 */}
        <ChatHeader channelName={channelName} />

        {/* 채팅 메시지 영역 - 실제 서버 데이터 사용 */}
        <MessageList
          messages={messages}
          channelName={channelName}
          isLoading={loadingMessages}
          onLoadOlder={loadOlderMessages}
          isLoadingOlder={loadingOlderMessages}
          hasMoreMessages={hasMoreMessages}
        />

        {/* 메시지 입력 영역 */}
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          channelName={channelName}
        />
      </div>
    </div>
  );
};

export default ChannelPage;
