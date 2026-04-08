"use client";

import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";
import {
  PrivateMessageHeader,
  PrivateMessageList,
  PrivateMessageInput,
} from "../components";
import { useMessagePage } from "../hooks/useMessagePage";

const MessagePage = () => {
  const { isMobile } = useResponsive();
  const {
    userId,
    newMessage,
    setNewMessage,
    messages,
    getUserName,
    getUser,
    handleSendMessage,
  } = useMessagePage();

  const userName = getUserName(userId);
  const user = getUser(userId);

  return (
    <div className="h-full flex rounded-tr-lg rounded-tl-lg bg-chatting-background">
      {/* 중앙: 1:1 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white">
        {/* 채팅 헤더 */}
        <PrivateMessageHeader user={user} userName={userName} />

        {/* 채팅 메시지 영역 */}
        <PrivateMessageList messages={messages} userName={userName} />

        {/* 메시지 입력 영역 */}
        <PrivateMessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          userName={userName}
        />
      </div>
    </div>
  );
};

export default MessagePage;
