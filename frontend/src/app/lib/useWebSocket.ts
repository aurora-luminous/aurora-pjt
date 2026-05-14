"use client";

import { useEffect, useState, useCallback } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "./tokenStorage";
import type {
  ChannelInfo,
  ChatMessage,
  MessageRequest,
  WebSocketState,
} from "@/app/(servers)/types";

// SockJS를 전역으로 설정 (브라우저 환경에서만)
if (typeof window !== "undefined") {
  (window as Window & { SockJS?: typeof SockJS }).SockJS = SockJS;
}

// 전역 웹소켓 인스턴스 및 상태 관리 (싱글톤 패턴)
let globalClient: Client | null = null;
let globalState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  error: null,
  subscribedChannels: [],
};
const globalChannelListeners = new Map<number, Set<(message: ChatMessage) => void>>();
const globalChannelSubscriptions = new Map<number, StompSubscription>();
// 전역 메시지 이벤트 리스너 (모든 채널의 메시지를 받을 수 있음)
const globalMessageListeners = new Set<(message: ChatMessage) => void>();
let globalSubscribedChannels: number[] = [];
let globalIsConnecting = false;

// 상태 변경 리스너들
const stateListeners = new Set<(state: WebSocketState) => void>();

// 상태 업데이트 함수
const updateState = (updater: (prev: WebSocketState) => WebSocketState) => {
  globalState = updater(globalState);
  stateListeners.forEach((listener) => listener(globalState));
};

export const useWebSocket = () => {
  const [state, setState] = useState<WebSocketState>(globalState);

  // 상태 리스너 등록
  useEffect(() => {
    const listener = (newState: WebSocketState) => {
      setState(newState);
    };
    stateListeners.add(listener);
    // 초기 상태 설정
    setState(globalState);
    
    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  // 웹소켓 연결
  const connect = useCallback(() => {
    if (globalClient?.connected || globalIsConnecting) {
      console.log("⚠️ 이미 연결 중이거나 연결되어 있습니다.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("❌ 액세스 토큰이 없습니다.");
      updateState((prev) => ({ ...prev, error: "액세스 토큰이 없습니다." }));
      return;
    }

    globalIsConnecting = true;
    updateState((prev) => ({ ...prev, isConnecting: true, error: null }));

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
      // 브라우저 WebSocket/SockJS는 HTTP 업그레이드에 임의 헤더를 붙일 수 없음.
      // STOMP CONNECT 프레임 헤더로 Bearer 전달 (백엔드가 STOMP 헤더에서 읽도록 구성된 경우).
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
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
        globalIsConnecting = false;
        updateState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      },
      onStompError: (frame) => {
        console.error("❌ STOMP 에러:", frame);
        globalIsConnecting = false;
        updateState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: frame.headers["message"] || "웹소켓 연결 실패",
        }));
      },
      onDisconnect: () => {
        console.log("🔌 웹소켓 연결 해제");
        globalSubscribedChannels = [];
        updateState((prev) => ({
          ...prev,
          isConnected: false,
          subscribedChannels: [],
        }));
      },
      onWebSocketClose: () => {
        console.log("🔌 웹소켓 소켓 닫힘");
        globalSubscribedChannels = [];
        updateState((prev) => ({
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
    globalClient = client;
  }, []);

  // 웹소켓 연결 해제
  const disconnect = useCallback(() => {
    if (globalClient) {
      console.log("🔌 웹소켓 연결 해제 중...");
      globalClient.deactivate();
      globalClient = null;
      globalIsConnecting = false;
      globalSubscribedChannels = [];
      updateState(() => ({
        isConnected: false,
        isConnecting: false,
        error: null,
        subscribedChannels: [],
      }));
      globalChannelListeners.clear();
      globalChannelSubscriptions.clear();
    }
  }, []);

  // 채널 구독
  const subscribeToChannel = useCallback(
    (channelPk: number, onMessage: (message: ChatMessage) => void) => {
      if (!globalClient?.connected) {
        console.error("❌ 웹소켓이 연결되지 않았습니다.");
        return () => {};
      }

      // 채널별 리스너 Set 생성/추가
      let listeners = globalChannelListeners.get(channelPk);
      if (!listeners) {
        listeners = new Set();
        globalChannelListeners.set(channelPk, listeners);
      }
      listeners.add(onMessage);

      // 채널당 실제 STOMP 구독은 1회만 생성
      if (!globalChannelSubscriptions.has(channelPk)) {
        const subscription = globalClient.subscribe(
          `/topic/channel/${channelPk}`,
          (message: IMessage) => {
            try {
              const chatMessage: ChatMessage = JSON.parse(message.body);
              console.log(`📨 채널 ${channelPk} 메시지 수신:`, chatMessage);

              const channelListeners = globalChannelListeners.get(channelPk);
              channelListeners?.forEach((listener) => listener(chatMessage));
              globalMessageListeners.forEach((listener) => listener(chatMessage));
            } catch (error) {
              console.error("❌ 메시지 파싱 실패:", error);
            }
          }
        );

        globalChannelSubscriptions.set(channelPk, subscription);
        globalSubscribedChannels = [...new Set([...globalSubscribedChannels, channelPk])];
        updateState((prev) => ({
          ...prev,
          subscribedChannels: [...new Set([...prev.subscribedChannels, channelPk])],
        }));

        console.log(`✅ 채널 ${channelPk} 구독 완료`);
      } else {
        console.log(`⚠️ 채널 ${channelPk}는 이미 구독 중입니다. 리스너만 추가합니다.`);
      }

      // 구독 해제 함수 반환
      return () => {
        const channelListeners = globalChannelListeners.get(channelPk);
        if (!channelListeners) return;

        channelListeners.delete(onMessage);

        if (channelListeners.size === 0) {
          globalChannelListeners.delete(channelPk);
          const subscription = globalChannelSubscriptions.get(channelPk);
          subscription?.unsubscribe();
          globalChannelSubscriptions.delete(channelPk);
          globalSubscribedChannels = globalSubscribedChannels.filter((pk) => pk !== channelPk);
          updateState((prev) => ({
            ...prev,
            subscribedChannels: prev.subscribedChannels.filter((pk) => pk !== channelPk),
          }));
          console.log(`🔌 채널 ${channelPk} 구독 해제`);
        }
      };
    },
    []
  );

  // 여러 채널 일괄 구독
  const subscribeToChannels = useCallback(
    (channels: ChannelInfo[], onMessage: (message: ChatMessage) => void) => {
      if (!globalClient?.connected) {
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
      if (!globalClient?.connected) {
        console.error("❌ 웹소켓이 연결되지 않았습니다.");
        return;
      }

      const messageRequest: MessageRequest = {
        content,
        messageType: "TEXT",
      };

      globalClient.publish({
        destination: `/app/chat/channel/${channelPk}`,
        body: JSON.stringify(messageRequest),
        headers: { "content-type": "application/json" },
      });

      console.log(`📤 채널 ${channelPk} 메시지 전송:`, content);
    },
    []
  );

  // 전역 메시지 리스너 추가/제거 (모든 채널의 메시지를 받을 수 있음)
  const addMessageListener = useCallback(
    (listener: (message: ChatMessage) => void) => {
      globalMessageListeners.add(listener);
      return () => {
        globalMessageListeners.delete(listener);
      };
    },
    []
  );

  return {
    ...state,
    connect,
    disconnect,
    subscribeToChannel,
    subscribeToChannels,
    sendMessage,
    addMessageListener,
  };
};
