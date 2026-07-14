import { useAddServerMutation } from "./useServerMutation";
import type { ServerRequest } from "../types";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resolveServerConnection } from "../services/server.service";

/**
 * 서버 관련 전체 플로우를 통합 관리하는 훅
 */
export const useServerFlow = () => {
  const addServerMutation = useAddServerMutation();
  const router = useRouter();

  /**
   * 서버 추가 처리
   */
  const handleAddServer = async (data: ServerRequest) => {
    try {
      const response = await addServerMutation.mutateAsync(data);
      return response;
    } catch (error) {
      console.error("❌ 서버 추가 실패:", error);
      throw error;
    }
  };

  /**
   * 서버 연결 처리 - 순수 비즈니스 로직은 server.service.ts에서 처리
   */
  const serverConnectionMutation = useMutation({
    mutationFn: ({ serverUrl, serverName }: { serverUrl: string; serverName: string }) =>
      resolveServerConnection(serverUrl, serverName),
    onError: (error) => {
      console.error("❌ 서버 연결 실패:", error);
    },
  });

  const handleServerConnection = async (serverUrl: string, serverName: string) => {
    const outcome = await serverConnectionMutation.mutateAsync({ serverUrl, serverName });

    if (outcome.type === "deleted") {
      throw outcome.error;
    }

    if (outcome.type === "pending") {
      router.push(outcome.pendingUrl);
      return;
    }

    // type === "connected"
    const { serverInfo, targetUrl } = outcome.result;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("currentServerInfo", JSON.stringify(serverInfo));
    }

    router.push(targetUrl);
    return { serverInfo, targetUrl };
  };

  return {
    handleAddServer,
    handleServerConnection,

    isAddingServer: addServerMutation.isPending,
    isValidatingAccess: serverConnectionMutation.isPending,
    isLoadingProjects: serverConnectionMutation.isPending,
    isLoadingChannels: serverConnectionMutation.isPending,
    isCreatingChannel: serverConnectionMutation.isPending,

    isLoading: addServerMutation.isPending || serverConnectionMutation.isPending,
    hasError: !!addServerMutation.error || !!serverConnectionMutation.error,

    addServerError: addServerMutation.error,
    validationError: serverConnectionMutation.error,
    projectError: serverConnectionMutation.error,
    channelError: serverConnectionMutation.error,
    createChannelError: serverConnectionMutation.error,

    isAddServerSuccess: addServerMutation.isSuccess,
    resetAddServer: addServerMutation.reset,
  };
};
