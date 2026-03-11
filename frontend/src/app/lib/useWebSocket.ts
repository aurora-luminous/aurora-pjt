"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "./tokenStorage";
import { ChannelInfo, ChatMessage, MessageRequest, WebSocketState } from "@/app/(servers)/types/websocket";

// SockJS를 전역으로 설정 (브라우저 환경에서만)
if (typeof window !== "undefined") {
  (window as Window & { SockJS?: typeof SockJS }).SockJS = SockJS;
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
  const isConnectingRef = useRef(false);
  const subscribedChannelsRef = useRef<number[]>([]);

  // 웹소켓 연결
  const connect = useCallback(() => {
    if (clientRef.current?.connected || isConnectingRef.current) {
      console.log("⚠️ 이미 연결 중이거나 연결되어 있습니다.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("❌ 액세스 토큰이 없습니다.");
      setState((prev) => ({ ...prev, error: "액세스 토큰이 없습니다." }));
      return;
    }

    isConnectingRef.current = true;
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    // 웹소켓 URL 설정
    // Next.js 프록시를 통해 연결 (같은 origin이므로 쿠키 자동 전송)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                  (typeof window !== "undefined" && window.location.hostname === "localhost"
                    ? ""  // 빈 문자열 = 같은 origin (Next.js 프록시 사용)
                    : "https://auro-ra.site");

    const socket = new SockJS(`${wsUrl}/ws`, null, {
      // 같은 origin이므로 쿠키가 자동으로 전송됩니다
    });
    
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
        isConnectingRef.current = false;
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      },
      onStompError: (frame) => {
        console.error("❌ STOMP 에러:", frame);
        isConnectingRef.current = false;
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: frame.headers["message"] || "웹소켓 연결 실패",
        }));
      },
      onDisconnect: () => {
        console.log("🔌 웹소켓 연결 해제");
        subscribedChannelsRef.current = [];
        setState((prev) => ({
          ...prev,
          isConnected: false,
          subscribedChannels: [],
        }));
      },
      onWebSocketClose: () => {
        console.log("🔌 웹소켓 소켓 닫힘");
        subscribedChannelsRef.current = [];
        setState((prev) => ({
          ...prev,
          isConnected: false,
          subscribedChannels: [],
        }));
      },
    });

    // 연결 전 준비 작업
    client.beforeConnect = () => {
      // 백엔드 HttpHandshakeInterceptor가 쿠키에서 'access_token'을 읽습니다
      // 쿠키는 SockJS가 자동으로 전송하므로 별도 설정 불필요
      console.log("🔐 웹소켓 연결 준비 중... (쿠키 자동 전송)");
    };

    client.activate();
    clientRef.current = client;
  }, []);

  // 웹소켓 연결 해제
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log("🔌 웹소켓 연결 해제 중...");
      clientRef.current.deactivate();
      clientRef.current = null;
      isConnectingRef.current = false;
      subscribedChannelsRef.current = [];
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

      if (subscribedChannelsRef.current.includes(channelPk)) {
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
      subscribedChannelsRef.current = [...subscribedChannelsRef.current, channelPk];
      setState((prev) => ({
        ...prev,
        subscribedChannels: [...prev.subscribedChannels, channelPk],
      }));

      console.log(`✅ 채널 ${channelPk} 구독 완료`);

      // 구독 해제 함수 반환
      return () => {
        subscription.unsubscribe();
        messageHandlersRef.current.delete(channelPk);
        subscribedChannelsRef.current = subscribedChannelsRef.current.filter((pk) => pk !== channelPk);
        setState((prev) => ({
          ...prev,
          subscribedChannels: prev.subscribedChannels.filter((pk) => pk !== channelPk),
        }));
        console.log(`🔌 채널 ${channelPk} 구독 해제`);
      };
    },
    []
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
