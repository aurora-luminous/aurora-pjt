import { useRouter } from "next/navigation";
import { useGetServerListMutation } from "./useServerMutation";

/**
 * 서버 연결 및 접근 권한 확인을 담당하는 훅
 */
export const useServerConnection = () => {
  const getServerListMutation = useGetServerListMutation();
  const router = useRouter();

  /**
   * 서버 접근 권한 확인
   */
  const validateServerAccess = async (
    serverUrl: string,
    serverName: string
  ): Promise<boolean> => {
    try {
      console.log("🔍 사용자 서버 목록 조회 중...");
      const serverList = await getServerListMutation.mutateAsync();

      const isServerAvailable = serverList.some(
        (server) =>
          server.serverUrl === serverUrl || server.serverName === serverName
      );

      if (!isServerAvailable) {
        console.log(
          "❌ 서버에 접근 권한이 없습니다. 승인 대기 페이지로 이동합니다."
        );
        router.push(
          `/pending?serverUrl=${encodeURIComponent(
            serverUrl
          )}&serverName=${encodeURIComponent(serverName)}`
        );
        return false;
      }

      console.log("✅ 서버 접근 권한 확인됨.");
      return true;
    } catch (error) {
      console.error("❌ 서버 접근 권한 확인 실패:", error);
      throw error;
    }
  };

  return {
    validateServerAccess,
    isValidating: getServerListMutation.isPending,
    validationError: getServerListMutation.error,
  };
};
