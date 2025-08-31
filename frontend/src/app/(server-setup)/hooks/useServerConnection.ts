import { useRouter } from "next/navigation";
import { useServerListQuery } from "./useServerMutation";
import { useState } from "react";
import {
  checkServerAccess,
  createPendingPageUrl,
} from "../utils/serverAccessUtils";

/**
 * 서버 연결 및 접근 권한 확인을 담당하는 훅
 */
export const useServerConnection = () => {
  const [isValidating, setIsValidating] = useState(false);
  const serverListQuery = useServerListQuery(false); // 기본적으로 비활성화
  const router = useRouter();

  /**
   * 서버 접근 권한 확인
   */
  const validateServerAccess = async (
    serverUrl: string,
    serverName: string
  ): Promise<boolean> => {
    try {
      setIsValidating(true);
      console.log("🔍 사용자 서버 목록 조회 중...");

      // 서버 목록 조회 실행
      console.log("📡 서버 목록 refetch 실행");
      const result = await serverListQuery.refetch();
      const serverList = result.data;

      if (!serverList) {
        throw new Error("서버 목록을 가져올 수 없습니다.");
      }

      const hasAccess = checkServerAccess(serverList, serverUrl, serverName);

      if (!hasAccess) {
        console.log(
          "❌ 서버에 접근 권한이 없습니다. 승인 대기 페이지로 이동합니다."
        );
        const pendingUrl = createPendingPageUrl(serverUrl, serverName);
        router.push(pendingUrl);
        return false;
      }

      console.log("✅ 서버 접근 권한 확인됨.");
      return true;
    } catch (error) {
      console.error("❌ 서버 접근 권한 확인 실패:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateServerAccess,
    isValidating,
    validationError: serverListQuery.error,
  };
};
