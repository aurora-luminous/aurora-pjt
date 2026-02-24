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

  // URL의 projectId를 숫자로 변환
  const urlProjectPk = useMemo(() => {
    const pk = parseInt(projectId, 10);
    return isNaN(pk) ? 0 : pk;
  }, [projectId]);

  const {
    channels,
    loading: loadingChannels,
    loadChannels,
    findChannel,
    findChannelByPk,
  } = useChannels(serverInfo?.serverUrl, urlProjectPk);

  // 상태 관리
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // 채널 목록 로딩 (Redux 사용)
  useEffect(() => {
    const loadChannelList = async () => {
      if (!serverInfo?.serverUrl || !urlProjectPk) return;

      try {
        console.log(
          `🔄 채널 페이지에서 채널 목록 로드 - 프로젝트: ${urlProjectPk}, 찾는 채널: "${channelId}" (원본: "${channelIdRaw}")`
        );
        await loadChannels(serverInfo.serverUrl, urlProjectPk);
      } catch (error) {
        console.error("채널 정보 로딩 실패:", error);
      }
    };

    // URL 프로젝트 ID가 변경되면 항상 새로 로드
    if (serverInfo?.serverUrl && urlProjectPk > 0) {
      loadChannelList();
    }
  }, [
    serverInfo?.serverUrl,
    urlProjectPk, // 프로젝트 변경 감지
    loadChannels,
    channelId,
    channelIdRaw,
  ]);

  // 현재 채널 설정 및 메시지 초기화
  useEffect(() => {
    console.log(
      `🔍 현재 채널 찾기: "${channelId}" (디코딩됨), 전체 채널 수: ${channels.length}`
    );
    console.log(
      "📋 사용 가능한 채널 목록:",
      channels.map((ch) => ch.channelName)
    );
    console.log("🔍 찾는 채널명/PK:", channelId, "타입:", typeof channelId);

    // URL의 channel_id를 숫자로 변환
    const channelPk = parseInt(channelId, 10);
    console.log(`🔍 찾는 채널 PK: ${channelPk}, 타입: ${typeof channelPk}`);

    // Redux에서 현재 채널 찾기 (PK 또는 이름으로)
    let channel = !isNaN(channelPk) ? findChannelByPk(channelPk) : findChannel(channelId);

    // 정확히 매칭되지 않으면 fallback 매칭 시도
    if (!channel && channels.length > 0) {
      console.log("❌ 정확한 매칭 실패, fallback 매칭 시도...");

      // 1. 소문자로 변환해서 매칭
      channel = channels.find(
        (ch) => ch.channelName.toLowerCase() === channelId.toLowerCase()
      );

      if (!channel) {
        // 2. "일반" -> "general" 매핑
        const channelMap: Record<string, string> = {
          일반: "general",
          general: "일반",
          공지: "notice",
          notice: "공지",
          음성: "voice",
          voice: "음성",
        };

        const mappedName = channelMap[channelId];
        if (mappedName) {
          channel = findChannel(mappedName);
          console.log(
            `🔄 매핑된 채널명으로 재시도: "${channelId}" -> "${mappedName}":`,
            !!channel
          );
        }
      }

      if (!channel) {
        // 3. 부분 문자열 매칭
        channel = channels.find(
          (ch) =>
            ch.channelName.includes(channelId) ||
            channelId.includes(ch.channelName)
        );
        console.log("🔄 부분 매칭 결과:", !!channel);
      }

      if (!channel) {
        // 4. 첫 번째 텍스트 채널 또는 첫 번째 채널 사용
        channel =
          channels.find((ch) => ch.channelKind === "text") || channels[0];
        console.log("🔄 기본 채널 사용:", channel?.channelName);
      }
    }

    if (channel) {
      const wasExactMatch = channel.channelPk === channelPk || channel.channelName === channelId;
      console.log(
        `✅ 채널 찾음: "${channel.channelName}", 정확한 매칭: ${wasExactMatch}`
      );
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
            channel.accessType === "private" ? "비공개" : "공개"
          } 채널입니다.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: true,
        },
      ];

      // 정확한 매칭이 아닌 경우 안내 메시지 추가
      if (!wasExactMatch && channelId !== channel.channelName && channelPk !== channel.channelPk) {
        welcomeMessages.splice(1, 0, {
          id: 1.5,
          user: "시스템",
          content: `"${channelId}" 채널을 찾지 못해 "${channel.channelName}" 채널로 연결되었습니다.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: true,
        });
      }

      welcomeMessages.push({
        id: 3,
        user: "시스템",
        content: "실제 메시지 API 연동 전이므로 임시 메시지입니다.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        isSystem: true,
      });

      setMessages(welcomeMessages);
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
  }, [channelId, channels, findChannel, findChannelByPk, loadingChannels, channelIdRaw]);

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

    const decodedPk = parseInt(decodedId, 10);

    // 1순위: Redux에서 PK로 찾기
    if (!isNaN(decodedPk)) {
      const foundChannelByPk = findChannelByPk(decodedPk);
      if (foundChannelByPk) return foundChannelByPk.channelName;
    }

    // 2순위: Redux에서 디코딩된 채널명으로 찾기
    const foundChannelByName = findChannel(decodedId);
    if (foundChannelByName) {
      return foundChannelByName.channelName;
    }

    // 3순위: currentChannel 사용
    if (currentChannel && (currentChannel.channelName === decodedId || currentChannel.channelPk === decodedPk)) {
      return currentChannel.channelName;
    }

    // 4순위: 디코딩된 channelId 그대로 사용 (숫자가 아니면)
    if (decodedId && decodedId !== "" && isNaN(decodedPk)) {
      return decodedId;
    }

    // 5순위: currentChannel이 있으면 그것 사용
    if (currentChannel) {
      return currentChannel.channelName;
    }

    // 6순위: 서버 정보의 채널명
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
