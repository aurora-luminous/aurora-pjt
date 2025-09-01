/**
 * 서버 멤버 타입 인터페이스
 */
export interface ServerMemberType {
  serverMemberPk: number;
  userPk: number;
  serverPk: number;
  status: ServerMemberStatusType;
  serverRole: 'member' | 'admin' | 'owner';
}

/**
 * 프로젝트 멤버 타입 인터페이스
 */
export interface ProjectMemberType {
  projectMemberPk: number;
  userPk: number;
  projectPk: number;
  pStatus: ProjectMemberStatusType;
  projectRole: 'member' | 'admin';
  lastAccessedChannelPk?: number;
}

/**
 * 채널 멤버 타입 인터페이스
 */
export interface ChannelMemberType {
  channelMemberPk: number;
  userPk: number;
  channelPk: number;
  cStatus: ChannelMemberStatusType;
  channelRole: 'member' | 'admin';
  lastReadMessage?: number;
  isMute: boolean;
}

/**
 * 엔티티 타입 인터페이스
 */
export interface ServerType {
  serverPk: number;
  serverUrl: string;
  serverName: string;
  isDeletedServer: boolean;
}

export interface ProjectType {
  projectPk: number;
  projectName: string;
  serverPk: number;
  isDeletedProject: boolean;
}

export interface ChannelEntityType {
  channelPk: number;
  channelName: string;
  projectPk: number;
  isPrivate: boolean;
  isDeletedChannel: boolean;
}

export interface UserType {
  userPk: number;
  userName: string;
  userEmail: string;
  profileImagePath?: string;
  isDeleted: boolean;
}

/**
 * 멤버 상태 관리 타입 (enum과 충돌을 피하기 위해 다른 이름 사용)
 */
export type ServerMemberStatusType =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Banned';
export type ProjectMemberStatusType = 'Active' | 'Inactive' | 'Banned';
export type ChannelMemberStatusType = 'Active' | 'Inactive' | 'Banned';

/**
 * 역할 타입
 */
export type ServerRoleType = 'member' | 'admin' | 'owner';
export type ProjectRoleType = 'member' | 'admin';
export type ChannelRoleType = 'member' | 'admin';
