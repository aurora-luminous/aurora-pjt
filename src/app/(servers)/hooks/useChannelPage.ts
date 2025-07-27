import { useState } from "react";
import { useParams } from "next/navigation";
import { Message } from "../types";
import { channelNames, defaultMessages } from "../types/channelData";

export const useChannelPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;
  const channelId = params.channel_id as string;

  // 상태 관리
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(defaultMessages);

  // 채널 이름 가져오기
  const getChannelName = (id: string) => {
    return channelNames[id] || id;
  };

  // 메시지 전송 처리
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        user: "사용자", // 실제로는 현재 로그인한 사용자
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        isSystem: false,
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
      console.log("메시지 전송:", newMessage);
    }
  };

  return {
    // URL 파라미터
    serverId,
    projectId,
    channelId,

    // 상태
    newMessage,
    setNewMessage,
    messages,

    // 함수들
    getChannelName,
    handleSendMessage,
  };
};
