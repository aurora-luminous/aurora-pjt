import { useState } from "react";
import { useParams } from "next/navigation";
import { PrivateMessage } from "@/app/(servers)/types";
import { chatUsers, getDefaultPrivateMessages } from "@/app/(servers)/constants/messageData";

export const useMessagePage = () => {
  const params = useParams();
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;
  const userId = params.user_id as string;

  // 상태 관리
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<PrivateMessage[]>(
    getDefaultPrivateMessages(userId)
  );

  // 사용자 이름 가져오기
  const getUserName = (id: string) => {
    const user = chatUsers.find((u) => u.id === parseInt(id));
    return user?.name || `사용자 ${id}`;
  };

  // 사용자 정보 가져오기
  const getUser = (id: string) => {
    return chatUsers.find((u) => u.id === parseInt(id));
  };

  // 메시지 전송 처리
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg: PrivateMessage = {
        id: messages.length + 1,
        sender: "심근원", // 현재 로그인한 사용자
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        isOwn: true,
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
      console.log("개인 메시지 전송:", newMessage);
    }
  };

  return {
    // URL 파라미터
    serverId,
    projectId,
    userId,

    // 상태
    newMessage,
    setNewMessage,
    messages,

    // 함수들
    getUserName,
    getUser,
    handleSendMessage,
  };
};
