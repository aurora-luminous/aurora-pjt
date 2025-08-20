import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Message } from "../types";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useServerApi } from "@/app/(server-setup)/hooks/useServerApi";
import { Channel } from "@/app/(server-setup)/types/Channel";

export const useChannelPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;
  const channelId = params.channel_id as string;

  const serverInfo = useCurrentServerInfo();
  const { getChannelList, createChannel } = useServerApi();

  // 상태 관리
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // 채널 목록 로딩
  useEffect(() => {
    const loadChannels = async () => {
      if (!serverInfo?.serverUrl || !serverInfo?.projectPk) return;

      setLoadingChannels(true);
      try {
        // 실제 projectPk 사용
        const channelList = await getChannelList(
          serverInfo.serverUrl,
          serverInfo.projectPk
        );
        setChannels(channelList);

        // 현재 채널 찾기
        const channel =
          channelList.find((c) => c.channelName === channelId) ||
          channelList[0];
        setCurrentChannel(channel);

        // 기본 환영 메시지 설정
        if (channel) {
          const welcomeMessages: Message[] = [
            {
              id: 1,
              user: "시스템",
              content: `${channel.channelName} 채널에 오신 것을 환영합니다!`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              isSystem: true,
            },
            {
              id: 2,
              user: "시스템",
              content: `이 채널은 ${
                channel.isPrivate ? "비공개" : "공개"
              } 채널입니다.`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              isSystem: true,
            },
          ];
          setMessages(welcomeMessages);
        }
      } catch (error) {
        console.error("채널 정보 로딩 실패:", error);
        // 에러 시 기본 메시지만 표시
        const errorMessages: Message[] = [
          {
            id: 1,
            user: "시스템",
            content: "채널 정보를 불러올 수 없습니다.",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            isSystem: true,
          },
        ];
        setMessages(errorMessages);
      } finally {
        setLoadingChannels(false);
      }
    };

    loadChannels();
  }, [serverInfo?.serverUrl, serverInfo?.projectPk, channelId]);

  // 실제 채널 이름 가져오기
  const getChannelName = (id: string) => {
    if (currentChannel) {
      return currentChannel.channelName;
    }
    return serverInfo?.channelName || id || "채널";
  };

  // 메시지 전송 처리
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        user: "사용자", // TODO: 실제 로그인한 사용자 이름 사용
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

      // TODO: 실제 메시지 전송 API 호출
      console.log("메시지 전송:", {
        channelId: currentChannel?.channelName || channelId,
        serverUrl: serverInfo?.serverUrl,
        projectPk: serverInfo?.projectPk,
        message: newMessage,
      });
    }
  };

  const addChannel = async (channelName: string) => {
    const newChannel: Channel = {
      channelName,
      channelKind: "text",
      isPrivate: false,
      channelRole: "text",
    };

    const response = await createChannel(
      serverInfo?.serverUrl || "",
      serverInfo?.projectPk || 0,
      newChannel
    );

    if (response) {
      console.log("채널 생성 성공:", response);
      setChannels((prev) => [...prev, newChannel]);
    }
  };

  return {
    // URL 파라미터
    serverId,
    projectId,
    channelId,

    // 서버 정보
    serverInfo,
    currentChannel,
    channels,
    loadingChannels,

    // 상태
    newMessage,
    setNewMessage,
    messages,

    // 함수들
    getChannelName,
    handleSendMessage,
    addChannel,
  };
};
