import * as jwt from 'jsonwebtoken';
import { Logger } from '@nestjs/common';

const logger = new Logger('JwtHelper');

/**
 * JWT 토큰을 검증하고 디코딩하여 userId를 추출합니다.
 * @param token 클라이언트로부터 받은 JWT 문자열
 * @param actualJwtSecret 검증에 사용할 JWT 비밀 키
 * @returns 디코딩된 userId (string) 또는 유효하지 않을 경우 null
 */
export function verifyAndDecodeAuthToken(
  token: string,
  actualJwtSecret: string,
): { userId: string } | null {
  try {
    const decoded: any = jwt.verify(token, actualJwtSecret);

    if (decoded && decoded.sub) {
      // SFU의 경우 숫자 userId가 필요합니다. Spring은 'sub'(이메일)을 제공하기 때문에,
      // 내부 SFU 사용을 위해 'sub'를 숫자 ID로 변환합니다.
      const s = String(decoded.sub);
      let numericUserId = 0;
      for (let i = 0; i < s.length; i++) {
        numericUserId = (numericUserId << 5) - numericUserId + s.charCodeAt(i);
        numericUserId |= 0; // Convert to 32bit integer
      }
      // 양수임을 보장
      numericUserId = Math.abs(numericUserId);
      return { userId: String(numericUserId) }; // userId를 문자열로 반환하면, SfuGateway에서 숫자로 변환
    }
    logger.warn('토큰에 sub가 없거나 null입니다.');
    return null;
  } catch (error) {
    logger.error(
      `JWT 검증 실패: ${error.message}. Token: ${token.substring(0, 30)}...`,
    );
    return null;
  }
}

/**
 * 페이로드 객체에 필수 필드가 모두 포함되어 있는지 검증
 * @param payload 검증할 페이로드 객체
 * @param requiredFields 필수 필드 이름의 배열
 * @returns 모든 필수 필드가 존재하면 null, 누락된 필드가 있으면 해당 필드 이름을 포함한 오류 메시지
 */
export function validatePayload(
  payload: any,
  requiredFields: string[],
): string | null {
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return `요청 데이터에 필수 필드가 누락되었습니다: '${field}'`;
    }
  }
  return null; // 모든 필드가 유효함
}
