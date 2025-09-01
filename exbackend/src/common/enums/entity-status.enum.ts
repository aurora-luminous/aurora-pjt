/**
 * 엔티티 삭제 상태 상수
 */
export const EntityStatus = {
  ACTIVE: false, // isDeleted = false
  DELETED: true, // isDeleted = true
} as const;

/**
 * 채널 타입 상수
 */
export const ChannelType = {
  PUBLIC: false, // isPrivate = false
  PRIVATE: true, // isPrivate = true
} as const;

/**
 * 엔티티 상태 유틸리티
 */
export class EntityStatusUtils {
  /**
   * 엔티티가 활성 상태인지 확인
   */
  static isActive(isDeleted: boolean): boolean {
    return !isDeleted;
  }

  /**
   * 엔티티가 삭제 상태인지 확인
   */
  static isDeleted(isDeleted: boolean): boolean {
    return isDeleted;
  }

  /**
   * 채널이 공개인지 확인
   */
  static isPublicChannel(isPrivate: boolean): boolean {
    return !isPrivate;
  }

  /**
   * 채널이 비공개인지 확인
   */
  static isPrivateChannel(isPrivate: boolean): boolean {
    return isPrivate;
  }

  /**
   * 활성 엔티티 조건 객체 반환
   */
  static getActiveCondition(deletedField: string = 'isDeleted') {
    return { [deletedField]: EntityStatus.ACTIVE };
  }

  /**
   * 삭제된 엔티티 조건 객체 반환
   */
  static getDeletedCondition(deletedField: string = 'isDeleted') {
    return { [deletedField]: EntityStatus.DELETED };
  }

  /**
   * 공개 채널 조건 객체 반환
   */
  static getPublicChannelCondition(privateField: string = 'isPrivate') {
    return { [privateField]: ChannelType.PUBLIC };
  }

  /**
   * 비공개 채널 조건 객체 반환
   */
  static getPrivateChannelCondition(privateField: string = 'isPrivate') {
    return { [privateField]: ChannelType.PRIVATE };
  }
}
