import { useQuery } from "@tanstack/react-query";
import { expressClient } from "@/app/lib/axiosClient";
import { ChannelInfo } from "../types/websocket";
import { useWebSocket } from "@/app/lib/useWebSocket";
import { useEffect } from "react";
import { ChatMessage } from "../types/websocket";

/**
 * 내가 속한 모든 채널 목록 조회
 */
export const useMyChannelsQuery = () => {
  return useQuery<ChannelInfo[]>({
    queryKey: ["myChannels"],
    queryFn: async () => {
      const response = await expressClient.get("/ex/my-channels");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

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

  // 웹소켓은 전역으로 관리되므로 언마운트 시 연결 해제하지 않음
  // (다른 컴포넌트에서도 사용할 수 있도록 유지)

  return {
    channels,
    isLoading,
    isConnected,
    isConnecting,
  };
};
