import { useRouter } from "next/navigation";
import { useAddServerMutation } from "./useServerMutation";
import { ServerRequest } from "../types/Server";

/**
 * 서버 관련 모든 로직을 통합 관리하는 커스텀 훅
 * useAuth와 동일한 패턴으로 서버 추가, 입장, 나가기 등을 처리합니다.
 */
export const useServer = () => {
  const addServerMutation = useAddServerMutation();

  /**
   * 서버 추가 처리 함수
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

  return {
    handleAddServer,
    isAddingServer: addServerMutation.isPending,
    isAddServerSuccess: addServerMutation.isSuccess,
    addServerMutation,
    resetAddServer: addServerMutation.reset,
  };
};
