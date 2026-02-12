"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "./tokenStorage";
import { ChannelInfo, ChatMessage, MessageRequest, WebSocketState } from "@/app/(servers)/types/websocket";

// SockJS를 전역으로 설정 (브라우저 환경에서만)
if (typeof window !== "undefined") {
  (window as any).SockJS = SockJS;
}

export const useWebSocket = () => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    subscribedChannels: [],
  });

  const clientRef = useRef<Client | null>(null);
  const messageHandlersRef = useRef<Map<number, (message: ChatMessage) => void>>(new Map());

  // 웹소켓 연결
  const connect = useCallback(() => {
    if (clientRef.current?.connected || state.isConnecting) {
      console.log("⚠️ 이미 연결 중이거나 연결되어 있습니다.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("❌ 액세스 토큰이 없습니다.");
      setState((prev) => ({ ...prev, error: "액세스 토큰이 없습니다." }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    // 웹소켓 URL 설정 (프로덕션/개발 환경 자동 감지)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                  (typeof window !== "undefined" && window.location.hostname === "localhost" 
                    ? "http://localhost:8080" 
                    : "https://auro-ra.site");

    // SockJS를 사용하여 웹소켓 연결
    const socket = new SockJS(`${wsUrl}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("🔌 STOMP:", str);
        }
      },
      onConnect: () => {
        console.log("✅ 웹소켓 연결 성공");
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      },
      onStompError: (frame) => {
        console.error("❌ STOMP 에러:", frame);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: frame.headers["message"] || "웹소켓 연결 실패",
        }));
      },
      onDisconnect: () => {
        console.log("🔌 웹소켓 연결 해제");
        setState((prev) => ({
          ...prev,
          isConnected: false,
          subscribedChannels: [],
        }));
      },
      onWebSocketClose: () => {
        console.log("🔌 웹소켓 소켓 닫힘");
        setState((prev) => ({
          ...prev,
          isConnected: false,
          subscribedChannels: [],
        }));
      },
    });

    // 연결 시 JWT 토큰을 세션에 저장하기 위한 헤더 설정
    client.beforeConnect = () => {
      // SockJS 연결 시 쿠키로 JWT 토큰 전달 (백엔드에서 쿠키로 읽음)
      // 또는 헤더로 전달할 수 있도록 설정
      console.log("🔐 웹소켓 연결 준비 중...");
    };

    client.activate();
    clientRef.current = client;
  }, [state.isConnecting]);

  // 웹소켓 연결 해제
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log("🔌 웹소켓 연결 해제 중...");
      clientRef.current.deactivate();
      clientRef.current = null;
      setState({
        isConnected: false,
        isConnecting: false,
        error: null,
        subscribedChannels: [],
      });
      messageHandlersRef.current.clear();
    }
  }, []);

  // 채널 구독
  const subscribeToChannel = useCallback(
    (channelPk: number, onMessage: (message: ChatMessage) => void) => {
      if (!clientRef.current?.connected) {
        console.error("❌ 웹소켓이 연결되지 않았습니다.");
        return () => {};
      }

      if (state.subscribedChannels.includes(channelPk)) {
        console.log(`⚠️ 채널 ${channelPk}는 이미 구독 중입니다.`);
        return () => {};
      }

      const subscription = clientRef.current.subscribe(
        `/topic/channel/${channelPk}`,
        (message: IMessage) => {
          try {
            const chatMessage: ChatMessage = JSON.parse(message.body);
            console.log(`📨 채널 ${channelPk} 메시지 수신:`, chatMessage);
            onMessage(chatMessage);
          } catch (error) {
            console.error("❌ 메시지 파싱 실패:", error);
          }
        }
      );

      messageHandlersRef.current.set(channelPk, onMessage);
      setState((prev) => ({
        ...prev,
        subscribedChannels: [...prev.subscribedChannels, channelPk],
      }));

      console.log(`✅ 채널 ${channelPk} 구독 완료`);

      // 구독 해제 함수 반환
      return () => {
        subscription.unsubscribe();
        messageHandlersRef.current.delete(channelPk);
        setState((prev) => ({
          ...prev,
          subscribedChannels: prev.subscribedChannels.filter((pk) => pk !== channelPk),
        }));
        console.log(`🔌 채널 ${channelPk} 구독 해제`);
      };
    },
    [state.subscribedChannels]
  );

  // 여러 채널 일괄 구독
  const subscribeToChannels = useCallback(
    (channels: ChannelInfo[], onMessage: (message: ChatMessage) => void) => {
      if (!clientRef.current?.connected) {
        console.error("❌ 웹소켓이 연결되지 않았습니다.");
        return [];
      }

      const unsubscribeFunctions = channels.map((channel) =>
        subscribeToChannel(channel.channelPk, onMessage)
      );

      return unsubscribeFunctions;
    },
    [subscribeToChannel]
  );

  // 메시지 전송
  const sendMessage = useCallback(
    (channelPk: number, content: string) => {
      if (!clientRef.current?.connected) {
        console.error("❌ 웹소켓이 연결되지 않았습니다.");
        return;
      }

      const messageRequest: MessageRequest = {
        channelPk,
        content,
      };

      clientRef.current.publish({
        destination: `/app/chat/channel/${channelPk}`,
        body: JSON.stringify(messageRequest),
      });

      console.log(`📤 채널 ${channelPk} 메시지 전송:`, content);
    },
    []
  );

  // 컴포넌트 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    subscribeToChannel,
    subscribeToChannels,
    sendMessage,
  };
};
