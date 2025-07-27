"use client";

import React from "react";
import { useChannelPage } from "../../../../../hooks/useChannelPage";
import { ChatHeader, MessageList, MessageInput } from "../components";

const ChannelPage = () => {
  const {
    channelId,
    newMessage,
    setNewMessage,
    messages,
    getChannelName,
    handleSendMessage,
  } = useChannelPage();

  const channelName = getChannelName(channelId);

  return (
    <div className="h-full flex">
      {/* 중앙: 채팅 영역 */}
      <div className="flex-1 flex flex-col rounded-tl-lg rounded-tr-lg overflow-hidden bg-chatting-background">
        {/* 채팅 헤더 */}
        <ChatHeader channelName={channelName} />

        {/* 채팅 메시지 영역 */}
        <MessageList messages={messages} channelName={channelName} />

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
