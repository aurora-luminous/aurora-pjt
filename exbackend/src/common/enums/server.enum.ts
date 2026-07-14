/**
 * 서버 삭제 상태
 */
export const ServerStatus = {
  ACTIVE: false,
  DELETED: true,
} as const;

/**
 * 서버 상태 유틸리티
 */
export class ServerStatusUtils {
  static getActiveCondition() {
    return { isDeletedServer: ServerStatus.ACTIVE };
  }
  static getDeletedCondition() {
    return { isDeletedServer: ServerStatus.DELETED };
  }
}
