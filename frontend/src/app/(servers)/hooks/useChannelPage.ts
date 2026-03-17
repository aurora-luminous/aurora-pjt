import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Message } from "../types";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { useChannels } from "./useChannels";
import { useWebSocket } from "@/app/lib/useWebSocket";
import { ChatMessage } from "../types/websocket";
import { useChannelMessagesQuery, useOlderChannelMessagesMutation } from "./useChatApi";

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

  // 채널 최신 메시지 조회
  const {
    data: messageResponses,
    isLoading: loadingMessages,
  } = useChannelMessagesQuery(currentChannel?.channelPk ?? null);
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

  // API로 받은 메시지를 Message 형식으로 변환하고 순서 반전 (최신 메시지가 아래로)
  useEffect(() => {
    if (!messageResponses) {
      setMessages([]);
      return;
    }

    console.log(`✅ 채널 ${currentChannel?.channelPk} 최신 메시지 조회 성공:`, messageResponses.length, "개");

    // MessageResponse를 Message 형식으로 변환
    // 백엔드에서 오래된 순서로 오므로 reverse()로 최신 메시지가 아래에 오도록 함
    const loadedMessages: Message[] = [...messageResponses]
      .reverse()
      .map((msg) => ({
        id: msg.messagePk,
        user: msg.userName,
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        isSystem: false,
      }));

    // 초기 로드 시에는 기존 메시지를 완전히 교체
    // (웹소켓 메시지는 이후에 추가됨)
    setMessages(loadedMessages);
    // 채널 변경 시 이전 메시지 로딩 상태 초기화
    setHasMoreMessages(true);
  }, [messageResponses, currentChannel?.channelPk]);

  // 이전 메시지 로드 함수
  const loadOlderMessages = useCallback(async () => {
    if (!currentChannel?.channelPk || olderMessagesMutation.isPending || !hasMoreMessages) {
      return;
    }

    // 가장 오래된 메시지 찾기 (첫 번째 메시지)
    const oldestMessage = messages[0];
    if (!oldestMessage) {
      return;
    }

    // messageResponses에서 createdAt을 찾기
    let oldestMessageTime: string | null = null;
    
    // 먼저 messageResponses에서 찾기
    const oldestMessageResponse = messageResponses?.find(
      (msg) => msg.messagePk === oldestMessage.id
    );
    
    if (oldestMessageResponse) {
      oldestMessageTime = oldestMessageResponse.createdAt;
    } else {
      // messageResponses에 없으면 (이전 메시지로 추가된 경우) 
      // messages에서 직접 시간을 추출할 수 없으므로 messageResponses의 가장 오래된 메시지 사용
      if (messageResponses && messageResponses.length > 0) {
        // messageResponses는 오래된 순서로 정렬되어 있으므로 첫 번째가 가장 오래된 것
        oldestMessageTime = messageResponses[0].createdAt;
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

      console.log(`✅ 채널 ${currentChannel.channelPk} 이전 메시지 조회 성공:`, olderMessages.length, "개");

      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      // MessageResponse를 Message 형식으로 변환하고 reverse
      const loadedOlderMessages: Message[] = [...olderMessages]
        .reverse()
        .map((msg) => ({
          id: msg.messagePk,
          user: msg.userName,
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: false,
        }));

      // 기존 메시지 앞에 추가 (중복 제거)
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

      // 40개 미만이면 더 이상 메시지가 없음
      if (olderMessages.length < 40) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("❌ 채널 이전 메시지 조회 실패:", error);
    }
  }, [currentChannel?.channelPk, messages, messageResponses, olderMessagesMutation, hasMoreMessages]);

  // 웹소켓 메시지 수신 리스너 등록 (모든 채널의 메시지를 받지만 현재 채널만 표시)
  useEffect(() => {
    if (!isConnected) return;

    const channelPk = currentChannel?.channelPk;
    
    // 전역 메시지 리스너 등록 (레이아웃에서 구독한 모든 채널의 메시지를 받음)
    const unsubscribe = addMessageListener((chatMessage: ChatMessage) => {
      // 현재 채널의 메시지만 처리
      if (channelPk && chatMessage.channelPk === channelPk) {
        // ChatMessage를 Message 형식으로 변환
        const newMessage: Message = {
          id: chatMessage.messagePk,
          user: chatMessage.userName,
          content: chatMessage.content,
          timestamp: new Date(chatMessage.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isSystem: false,
        };

        console.log(`📨 채널 ${channelPk} 메시지 수신 및 추가:`, newMessage);
        
        // 메시지 추가 (중복 방지)
        setMessages((prev) => {
          // 이미 존재하는 메시지인지 확인 (messagePk로)
          const exists = prev.some((msg) => msg.id === chatMessage.messagePk);
          if (exists) {
            console.log(`⚠️ 메시지 ${chatMessage.messagePk}는 이미 존재합니다.`);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
      // 다른 채널의 메시지는 무시 (나중에 알람 기능에서 사용 가능)
    });

    return () => {
      unsubscribe();
    };
  }, [currentChannel?.channelPk, isConnected, addMessageListener]);

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
    if (!newMessage.trim()) return;

    // 현재 채널이 없거나 channelPk가 없으면 전송 불가
    if (!currentChannel || !currentChannel.channelPk) {
      console.error("❌ 채널 정보가 없어 메시지를 전송할 수 없습니다.");
      return;
    }

    // 웹소켓이 연결되지 않았으면 전송 불가
    if (!isConnected) {
      console.error("❌ 웹소켓이 연결되지 않아 메시지를 전송할 수 없습니다.");
      return;
    }

    const messageContent = newMessage.trim();
    
    // 웹소켓을 통해 메시지 전송
    sendMessage(currentChannel.channelPk, messageContent);

    // 입력 필드만 초기화 (실제 메시지는 웹소켓을 통해 수신되어 자동으로 추가됨)
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
    // URL 파라미터 (디코딩된 값)
    serverId,
    projectId,
    channelId, // 디코딩된 channelId

    // 서버 정보
    serverInfo,
    currentChannel,
    channels,
    loadingChannels,
    loadingMessages,
    loadingOlderMessages: olderMessagesMutation.isPending,
    hasMoreMessages,

    // 상태
    newMessage,
    setNewMessage,
    messages,

    // 함수들
    getChannelName,
    handleSendMessage,
    loadOlderMessages,
  };
};
