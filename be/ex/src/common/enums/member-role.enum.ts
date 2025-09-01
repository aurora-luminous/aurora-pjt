/**
 * 서버 전용 역할 (3단계: owner > admin > member)
 */
export enum ServerRole {
  OWNER = 'owner', // 서버 소유자 (슈퍼계정)
  ADMIN = 'admin',
  MEMBER = 'member',
}

/**
 * 프로젝트/채널 공용 역할 (2단계: admin > member)
 */
export enum MemberRole {
  ADMIN = 'admin', // 생성자 및 관리자
  MEMBER = 'member', // 일반 멤버
}

/**
 * 타입 정의
 */
export type ServerRoleType = 'owner' | 'admin' | 'member';
export type ProjectRoleType = 'admin' | 'member';
export type ChannelRoleType = 'admin' | 'member';

/**
 * 서버 역할 권한 유틸리티
 */
export class ServerRoleUtils {
  // 관리자 역할들 (admin + owner)
  static readonly ADMIN_ROLES = [ServerRole.ADMIN, ServerRole.OWNER];

  // 소유자 역할
  static readonly OWNER_ROLES = [ServerRole.OWNER];

  // 일반 멤버 역할들
  static readonly MEMBER_ROLES = [ServerRole.MEMBER];

  /**
   * 관리자 권한이 있는지 확인
   */
  static hasAdminPermission(role: ServerRoleType): boolean {
    return this.ADMIN_ROLES.includes(role as ServerRole);
  }

  /**
   * 소유자 권한이 있는지 확인
   */
  static hasOwnerPermission(role: ServerRoleType): boolean {
    return this.OWNER_ROLES.includes(role as ServerRole);
  }

  /**
   * 역할 간 권한 비교 (높을수록 더 많은 권한)
   * owner > admin > member
   */
  static getRoleLevel(role: ServerRoleType): number {
    switch (role) {
      case 'owner':
        return 3;
      case 'admin':
        return 2;
      case 'member':
        return 1;
      default:
        return 0;
    }
  }
}

/**
 * 프로젝트/채널 역할 권한 유틸리티
 */
export class MemberRoleUtils {
  // 관리자 역할들 (admin만)
  static readonly ADMIN_ROLES = [MemberRole.ADMIN];

  // 일반 멤버 역할들
  static readonly MEMBER_ROLES = [MemberRole.MEMBER];

  /**
   * 관리자 권한이 있는지 확인
   */
  static hasAdminPermission(role: ProjectRoleType | ChannelRoleType): boolean {
    return this.ADMIN_ROLES.includes(role as MemberRole);
  }

  /**
   * 역할 간 권한 비교 (높을수록 더 많은 권한)
   * admin > member
   */
  static getRoleLevel(role: ProjectRoleType | ChannelRoleType): number {
    switch (role) {
      case 'admin':
        return 2;
      case 'member':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * 역할 변경이 가능한지 확인 (admin만 다른 멤버 관리 가능)
   */
  static canManageMember(
    adminRole: ProjectRoleType | ChannelRoleType,
    targetRole: ProjectRoleType | ChannelRoleType,
  ): boolean {
    // admin만 멤버를 관리할 수 있음
    if (adminRole !== 'admin') {
      return false;
    }

    // admin끼리는 서로 관리할 수 없음
    if (targetRole === 'admin') {
      return false;
    }

    return true;
  }
}
