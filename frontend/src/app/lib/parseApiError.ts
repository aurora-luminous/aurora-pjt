import { AxiosError } from "axios";

interface ApiErrorData {
  message?: string;
  error?: string;
  code?: string;
}

/**
 * API 에러(AxiosError 또는 일반 Error)에서 사용자에게 보여줄 메시지를 추출합니다.
 *
 * 우선순위:
 *   1. response.data.message (Spring 표준 에러 바디)
 *   2. response.data.error
 *   3. error.message (네트워크 오류 등)
 *   4. fallback 문자열
 */
export function parseApiError(
  error: unknown,
  fallback = "오류가 발생했습니다. 잠시 후 다시 시도해주세요."
): string {
  if (!error) return fallback;

  const axiosErr = error as AxiosError<ApiErrorData>;

  if (axiosErr.response?.data) {
    const data = axiosErr.response.data;
    if (data.message) return data.message;
    if (data.error) return data.error;
  }

  if (axiosErr.message) return axiosErr.message;

  return fallback;
}
