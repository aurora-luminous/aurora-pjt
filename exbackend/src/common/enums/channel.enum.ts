/**
 * 채널 삭제 상태
 */
export const ChannelStatus = {
  ACTIVE: false,
  DELETED: true,
} as const;

/**
 * 채널 종류 (엔티티 DB 값)
 */
export enum ChannelKind {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  NOTIFICATION = 'NOTIFICATION',
}

/**
 * 채널 접근 타입 (엔티티 DB 값)
 */
export enum AccessType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

/**
 * 응답 및 DTO용 소문자 타입 정의
 */
export type ChannelKindLowcase = 'text' | 'voice' | 'notification';
export type AccessTypeLowcase = 'public' | 'private';

/**
 * 채널 상태 유틸리티
 */
export class ChannelStatusUtils {
  static getActiveCondition() {
    return { isDeletedChannel: ChannelStatus.ACTIVE };
  }
  static getDeletedCondition() {
    return { isDeletedChannel: ChannelStatus.DELETED };
  }
}
