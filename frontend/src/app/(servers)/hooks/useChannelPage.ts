import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Message } from "../types";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { useChannels } from "./useChannels";

export const useChannelPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;
  const channelIdRaw = params.channel_id as string;

  // URL 인코딩된 channelId를 디코딩
  const channelId = useMemo(() => {
    try {
      return decodeURIComponent(channelIdRaw);
    } catch (error) {
      console.warn("채널 ID 디코딩 실패:", channelIdRaw, error);
      return channelIdRaw;
    }
  }, [channelIdRaw]);

  const serverInfo = useCurrentServerInfo();

  const {
    channels,
    loading: loadingChannels,
    loadChannels,
    findChannel,
  } = useChannels(serverInfo?.serverUrl, serverInfo?.projectPk);

  // 상태 관리
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // 채널 목록 로딩 (Redux 사용)
  useEffect(() => {
    const loadChannelList = async () => {
      if (!serverInfo?.serverUrl || !serverInfo?.projectPk) return;

      try {
        console.log(
          `🔄 채널 페이지에서 채널 목록 로드 - 프로젝트: ${serverInfo.projectPk}, 찾는 채널: "${channelId}" (원본: "${channelIdRaw}")`
        );
        await loadChannels(serverInfo.serverUrl, serverInfo.projectPk);
      } catch (error) {
        console.error("채널 정보 로딩 실패:", error);
      }
    };

    // 채널 목록이 비어있으면 로드
    if (channels.length === 0) {
      loadChannelList();
    }
  }, [
    serverInfo?.serverUrl,
    serverInfo?.projectPk,
    channels.length,
    loadChannels,
    channelId,
    channelIdRaw,
  ]);

  // 현재 채널 설정 및 메시지 초기화
  useEffect(() => {
    console.log(
      `🔍 현재 채널 찾기: "${channelId}" (디코딩됨), 전체 채널 수: ${channels.length}`
    );

    // Redux에서 현재 채널 찾기 (디코딩된 이름으로)
    const channel = findChannel(channelId);

    if (channel) {
      console.log(`✅ 채널 찾음: "${channel.channelName}"`);
      setCurrentChannel(channel);

      // 채널별 환영 메시지 설정
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
          content: `이 채널은 ${getChannelTypeText(channel.channelKind)} ${
            channel.isPrivate ? "비공개" : "공개"
          } 채널입니다.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: true,
        },
        {
          id: 3,
          user: "시스템",
          content: "실제 메시지 API 연동 전이므로 임시 메시지입니다.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: true,
        },
      ];
      setMessages(welcomeMessages);
    } else if (channels.length > 0) {
      console.log(`❌ 채널 못찾음: "${channelId}", 첫 번째 채널 사용`);
      const fallbackChannel = channels[0];
      setCurrentChannel(fallbackChannel);

      const errorMessages: Message[] = [
        {
          id: 1,
          user: "시스템",
          content: `요청하신 "${channelId}" 채널을 찾을 수 없습니다.`,
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
          content: `${fallbackChannel.channelName} 채널로 이동하였습니다.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: true,
        },
      ];
      setMessages(errorMessages);
    } else if (!loadingChannels) {
      // 채널 목록이 비어있고 로딩 중이 아닐 때
      setCurrentChannel(null);
      const noChannelMessages: Message[] = [
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
        {
          id: 2,
          user: "시스템",
          content: `현재 URL 채널: "${channelId}" (원본: "${channelIdRaw}")`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: true,
        },
      ];
      setMessages(noChannelMessages);
    }
  }, [channelId, channels, findChannel, loadingChannels, channelIdRaw]);

  // 채널 타입 텍스트 변환
  const getChannelTypeText = (channelKind: string) => {
    switch (channelKind) {
      case "text":
        return "텍스트";
      case "voice":
        return "음성";
      case "notice":
        return "공지";
      default:
        return "일반";
    }
  };

  // 실제 채널 이름 가져오기 (디코딩된 이름 사용)
  const getChannelName = (id: string) => {
    // 입력받은 id도 디코딩 시도
    const decodedId = (() => {
      try {
        return decodeURIComponent(id);
      } catch {
        return id;
      }
    })();

    // 1순위: Redux에서 디코딩된 채널명으로 찾기
    const foundChannel = findChannel(decodedId);
    if (foundChannel) {
      return foundChannel.channelName;
    }

    // 2순위: currentChannel 사용
    if (currentChannel && currentChannel.channelName === decodedId) {
      return currentChannel.channelName;
    }

    // 3순위: 디코딩된 channelId 그대로 사용
    if (decodedId && decodedId !== "") {
      return decodedId;
    }

    // 4순위: currentChannel이 있으면 그것 사용
    if (currentChannel) {
      return currentChannel.channelName;
    }

    // 5순위: 서버 정보의 채널명
    return serverInfo?.channelName || "채널";
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
        channelId: channelId, // 디코딩된 channelId 사용
        channelName: getChannelName(channelId),
        serverUrl: serverInfo?.serverUrl,
        projectPk: serverInfo?.projectPk,
        message: newMessage,
      });
    }
  };

  return {
    // URL 파라미터 (디코딩된 값)
    serverId,
    projectId,
    channelId, // 디코딩된 channelId

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
  };
};
