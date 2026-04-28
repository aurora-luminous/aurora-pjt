import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Message, ChatMessage } from "@/app/(servers)/types";
import { mapMessageResponseToMessage, mapChatMessageToMessage } from "@/app/(servers)/services/chat.service";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import type { Channel } from "@/app/(server-setup)/types";
import { useChannels } from "@/app/(servers)/hooks/useChannels";
import { useWebSocket } from "@/app/lib/useWebSocket";
import { useChannelMessagesQuery, useOlderChannelMessagesMutation } from "./useChatQuery";

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
    return Number.isNaN(pk) ? 0 : pk;
  }, [projectId]);

  const {
    channels,
    loading: loadingChannels,
    loadChannels,
    findChannel,
    findChannelByPk,
  } = useChannels(serverInfo?.serverUrl, urlProjectPk);

  // 웹소켓 훅 사용 (전역 인스턴스 사용)
  const { sendMessage, isConnected, addMessageListener } = useWebSocket();

  // 상태 관리
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // 이전 메시지 조회 Mutation
  const olderMessagesMutation = useOlderChannelMessagesMutation();

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
    urlProjectPk,
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
    let channel = !Number.isNaN(channelPk) ? findChannelByPk(channelPk) : findChannel(channelId);

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
    } else if (!loadingChannels) {
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

  // 채널 최신 메시지 조회
  const {
    data: messageResponses,
    isLoading: loadingMessages,
  } = useChannelMessagesQuery(currentChannel?.channelPk ?? null);

  // API로 받은 메시지를 Message 형식으로 변환하고 순서 반전
  useEffect(() => {
    if (!messageResponses) {
      setMessages([]);
      return;
    }

    console.log(
      `✅ 채널 ${currentChannel?.channelPk} 최신 메시지 조회 성공:`,
      messageResponses.messages.length,
      "개"
    );

    const loadedMessages: Message[] = [...messageResponses.messages]
      .reverse()
      .map(mapMessageResponseToMessage);

    setMessages(loadedMessages);
    setHasMoreMessages(true);
  }, [messageResponses, currentChannel?.channelPk]);

  // 이전 메시지 로드 함수
  const loadOlderMessages = useCallback(async () => {
    if (!currentChannel?.channelPk || olderMessagesMutation.isPending || !hasMoreMessages) {
      return;
    }

    const oldestMessage = messages[0];
    if (!oldestMessage) {
      return;
    }

    let oldestMessageTime: string | null = null;

    const oldestMessageResponse = messageResponses?.messages.find(
      (msg) => msg.messagePk === oldestMessage.id
    );

    if (oldestMessageResponse) {
      oldestMessageTime = oldestMessageResponse.createdAt;
    } else {
      if (messageResponses && messageResponses.messages.length > 0) {
        oldestMessageTime = messageResponses.messages[0].createdAt;
      } else {
        console.warn("⚠️ 이전 메시지의 시간을 찾을 수 없습니다.");
        return;
      }
    }

    try {
      console.log(`📥 채널 ${currentChannel.channelPk} 이전 메시지 조회 시작 (기준 시간: ${oldestMessageTime})`);

      const olderMessages = await olderMessagesMutation.mutateAsync({
        channelPk: currentChannel.channelPk,
        lastMessageTime: oldestMessageTime,
      });

      console.log(
        `✅ 채널 ${currentChannel.channelPk} 이전 메시지 조회 성공:`,
        olderMessages.length,
        "개"
      );

      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      const loadedOlderMessages: Message[] = [...olderMessages]
        .reverse()
        .map(mapMessageResponseToMessage);

      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id));
        const newMessages = loadedOlderMessages.filter(
          (msg) => !existingIds.has(msg.id)
        );

        if (newMessages.length === 0) {
          console.log("⚠️ 이전 메시지가 모두 중복되어 추가하지 않음");
          setHasMoreMessages(false);
          return prev;
        }

        console.log(`✅ ${newMessages.length}개의 새로운 이전 메시지 추가 (중복 ${loadedOlderMessages.length - newMessages.length}개 제거)`);
        return [...newMessages, ...prev];
      });

      if (olderMessages.length < 40) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("❌ 채널 이전 메시지 조회 실패:", error);
    }
  }, [currentChannel?.channelPk, messages, messageResponses, olderMessagesMutation, hasMoreMessages]);

  // 웹소켓 메시지 수신 리스너 등록
  useEffect(() => {
    if (!isConnected) return;

    const channelPk = currentChannel?.channelPk;

    const unsubscribe = addMessageListener((chatMessage: ChatMessage) => {
      if (channelPk && chatMessage.channelPk === channelPk) {
        const newMessage = mapChatMessageToMessage(chatMessage);

        console.log(`📨 채널 ${channelPk} 메시지 수신 및 추가:`, newMessage);

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === chatMessage.messagePk);
          if (exists) {
            console.log(`⚠️ 메시지 ${chatMessage.messagePk}는 이미 존재합니다.`);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentChannel?.channelPk, isConnected, addMessageListener]);

  // 실제 채널 이름 가져오기
  const getChannelName = (id: string) => {
    const decodedId = (() => {
      try {
        return decodeURIComponent(id);
      } catch {
        return id;
      }
    })();

    const decodedPk = parseInt(decodedId, 10);

    if (!Number.isNaN(decodedPk)) {
      const foundChannelByPk = findChannelByPk(decodedPk);
      if (foundChannelByPk) return foundChannelByPk.channelName;
    }

    const foundChannelByName = findChannel(decodedId);
    if (foundChannelByName) {
      return foundChannelByName.channelName;
    }

    if (currentChannel && (currentChannel.channelName === decodedId || currentChannel.channelPk === decodedPk)) {
      return currentChannel.channelName;
    }

    if (decodedId && decodedId !== "" && Number.isNaN(decodedPk)) {
      return decodedId;
    }

    if (currentChannel) {
      return currentChannel.channelName;
    }

    return serverInfo?.channelName || "채널";
  };

  // 메시지 전송 처리
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!currentChannel || !currentChannel.channelPk) {
      console.error("❌ 채널 정보가 없어 메시지를 전송할 수 없습니다.");
      return;
    }

    if (!isConnected) {
      console.error("❌ 웹소켓이 연결되지 않아 메시지를 전송할 수 없습니다.");
      return;
    }

    const messageContent = newMessage.trim();
    sendMessage(currentChannel.channelPk, messageContent);
    setNewMessage("");

    console.log("📤 메시지 전송:", {
      channelPk: currentChannel.channelPk,
      channelId: channelId,
      channelName: getChannelName(channelId),
      serverUrl: serverInfo?.serverUrl,
      projectPk: serverInfo?.projectPk,
      message: messageContent,
    });
  };

  return {
    serverId,
    projectId,
    channelId,
    serverInfo,
    currentChannel,
    channels,
    loadingChannels,
    loadingMessages,
    loadingOlderMessages: olderMessagesMutation.isPending,
    hasMoreMessages,
    newMessage,
    setNewMessage,
    messages,
    getChannelName,
    handleSendMessage,
    loadOlderMessages,
  };
};
