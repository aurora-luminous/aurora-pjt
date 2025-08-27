import { useServerConnection } from "./useServerConnection";
import { useProjectNavigation } from "./useProjectNavigation";
import { useAddServerMutation } from "./useServerMutation";
import { ServerRequest } from "../types/Server";

/**
 * 서버 관련 전체 플로우를 통합 관리하는 훅
 * 기존의 복잡한 useServer 로직을 분리된 훅들로 조합
 */
export const useServerFlow = () => {
  const addServerMutation = useAddServerMutation();
  const { validateServerAccess, isValidating, validationError } =
    useServerConnection();
  const {
    navigateToFirstChannel,
    isLoadingProjects,
    isLoadingChannels,
    isCreatingChannel,
    projectError,
    channelError,
    createChannelError,
  } = useProjectNavigation();

  /**
   * 서버 추가 처리 (기존과 동일)
   */
  const handleAddServer = async (data: ServerRequest) => {
    console.log("서버 추가 프로세스 시작 - 데이터:", data);
    try {
      const response = await addServerMutation.mutateAsync(data);
      console.log("✅ 서버 추가 성공:", response);
      console.log("🎉 서버 추가 완료!");
    } catch (error) {
      console.error("❌ 서버 추가 실패:", error);
      throw error;
    }
  };

  /**
   * 서버 연결 처리 (분리된 로직들을 조합)
   */
  const handleServerConnection = async (
    serverUrl: string,
    serverName: string
  ) => {
    try {
      console.log("🚀 서버 연결 프로세스 시작:", { serverUrl, serverName });

      // 1. 서버 접근 권한 확인
      const hasAccess = await validateServerAccess(serverUrl, serverName);

      if (!hasAccess) {
        // validateServerAccess에서 이미 승인 대기 페이지로 리다이렉트함
        return;
      }

      // 2. 프로젝트/채널 조회 및 입장
      await navigateToFirstChannel(serverUrl, serverName);
    } catch (error) {
      console.error("❌ 서버 연결 실패:", error);
      throw error;
    }
  };

  // 모든 로딩 상태 통합
  const isLoading =
    isValidating || isLoadingProjects || isLoadingChannels || isCreatingChannel;

  // 모든 에러 상태 통합
  const hasError =
    validationError || projectError || channelError || createChannelError;

  return {
    // 🎯 주요 액션들
    handleAddServer,
    handleServerConnection, // 기존 handleGetProjectList 대체

    // 📊 상세 상태들
    isAddingServer: addServerMutation.isPending,
    isValidatingAccess: isValidating,
    isLoadingProjects,
    isLoadingChannels,
    isCreatingChannel,

    // 🔄 통합 상태들
    isLoading,
    hasError,

    // ❌ 에러들
    addServerError: addServerMutation.error,
    validationError,
    projectError,
    channelError,
    createChannelError,

    // ✅ 성공 상태
    isAddServerSuccess: addServerMutation.isSuccess,
    resetAddServer: addServerMutation.reset,
  };
};
