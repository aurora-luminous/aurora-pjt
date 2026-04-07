import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPendingPageUrl } from "../utils/serverAccessUtils";
import { joinServerApi } from "../api/server.api";
import type { ServerAccess } from "@/app/(servers)/types/ServerAccess";

/**
 * 서버 연결 및 접근 권한 확인을 담당하는 훅
 */
export const useServerConnection = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<unknown>(null);
  const router = useRouter();

  /**
   * 서버 접근 권한 확인
   */
  const validateServerAccess = async (
    serverUrl: string,
    serverName: string,
  ): Promise<boolean> => {
    try {
      setIsValidating(true);
      setValidationError(null);

      const result = await joinServerApi(serverUrl);

      // 서버가 존재하지 않는 경우 ({ message } 응답)
      if ("message" in result && !("sStatus" in result)) {
        alert("존재하지 않는 서버입니다.");
        return false;
      }

      const { sStatus } = result as ServerAccess;

      switch (sStatus) {
        case "Active":
          console.log("✅ 서버 접근 권한 확인됨.");
          return true;
        case "Pending":
          console.log("❌ 승인 대기 중. 승인 대기 페이지로 이동합니다.");
          router.push(createPendingPageUrl(serverUrl, serverName));
          return false;
        case "Inactive":
        case "Banned":
          alert("가입이 거절된 서버입니다.");
          return false;
        default:
          router.push(createPendingPageUrl(serverUrl, serverName));
          return false;
      }
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 400) {
        alert("존재하지 않는 서버입니다.");
        return false;
      }
      setValidationError(err);
      console.error("❌ 서버 접근 권한 확인 실패:", err);
      throw err;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateServerAccess,
    isValidating,
    validationError,
  };
};
