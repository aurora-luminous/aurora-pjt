/**
 * 멤버 상태 열거형 (프로젝트, 채널용)
 */
export enum MemberStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  BANNED = 'Banned',
}

/**
 * 서버 멤버 상태 열거형
 */
export enum ServerMemberStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  BANNED = 'Banned',
}

/**
 * 통합 멤버 상태 유틸리티
 */
export class MemberStatusUtils {
  // 활성 상태들
  static readonly ACTIVE_STATUSES = [
    MemberStatus.ACTIVE,
    ServerMemberStatus.ACTIVE,
  ];

  // 비활성 상태들
  static readonly INACTIVE_STATUSES = [
    MemberStatus.INACTIVE,
    ServerMemberStatus.PENDING,
    ServerMemberStatus.INACTIVE,
  ];

  // 차단 상태들
  static readonly BANNED_STATUSES = [
    MemberStatus.BANNED,
    ServerMemberStatus.BANNED,
  ];

  /**
   * 상태가 활성인지 확인
   */
  static isActive(status: MemberStatus | ServerMemberStatus): boolean {
    return this.ACTIVE_STATUSES.includes(status);
  }

  /**
   * 상태가 차단인지 확인
   */
  static isBanned(status: MemberStatus | ServerMemberStatus): boolean {
    return this.BANNED_STATUSES.includes(status);
  }

  /**
   * 상태가 비활성인지 확인
   */
  static isInactive(status: MemberStatus | ServerMemberStatus): boolean {
    return this.INACTIVE_STATUSES.includes(status);
  }

  /**
   * 서버 멤버 상태를 일반 멤버 상태로 변환
   */
  static serverToMemberStatus(serverStatus: ServerMemberStatus): MemberStatus {
    switch (serverStatus) {
      case ServerMemberStatus.ACTIVE:
        return MemberStatus.ACTIVE;
      case ServerMemberStatus.BANNED:
        return MemberStatus.BANNED;
      default:
        return MemberStatus.INACTIVE;
    }
  }
}
