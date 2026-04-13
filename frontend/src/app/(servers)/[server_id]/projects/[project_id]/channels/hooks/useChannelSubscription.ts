import { useWebSocket } from "@/app/lib/useWebSocket";
import { useEffect } from "react";
import type { ChatMessage } from "@/app/(servers)/types";
import { useMyChannelsQuery } from "@/app/(server-setup)/hooks/useServerMutation";

/**
 * 웹소켓 연결 및 채널 구독을 관리하는 훅
 */
export const useChannelSubscription = (
  onMessage?: (message: ChatMessage) => void
) => {
  const { data: channels, isLoading } = useMyChannelsQuery();
  const {
    isConnected,
    isConnecting,
    connect,
    subscribeToChannels,
  } = useWebSocket();

  // 웹소켓 연결
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      console.log("🔌 웹소켓 연결 시작...");
      connect();
    }
  }, [isConnected, isConnecting, connect]);

  // 채널 구독
  useEffect(() => {
    if (!isConnected || !channels || channels.length === 0) {
      return;
    }

    console.log(`📡 ${channels.length}개 채널 구독 시작...`);

    const unsubscribeFunctions = subscribeToChannels(
      channels,
      (message) => {
        console.log("📨 메시지 수신:", message);
        onMessage?.(message);
      }
    );

    return () => {
      console.log("🔌 모든 채널 구독 해제");
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, channels, subscribeToChannels]);

  return {
    channels,
    isLoading,
    isConnected,
    isConnecting,
  };
};
