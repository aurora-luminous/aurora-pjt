// ─── Enums ───────────────────────────────────────────────────────────────────

export enum AccessType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum ChannelKind {
  TEXT = 'text',
  VOICE = 'voice',
  NOTIFICATION = 'notification',
}

export enum ChannelRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

// ─── Server ──────────────────────────────────────────────────────────────────

export interface ServerRequest {
  serverName: string;
  serverUrl: string;
}

export interface ServerResponse {
  message: string | '';
}

export interface ServerListItem {
  serverName: string;
  serverUrl: string;
  serverRole: string;
}

export interface InviteCode {
  inviteHash: string;
}

export interface UserInfo {
  userName: string;
  userEmail: string;
  ProfileImageUrl: string;
}

export interface MemberEmail {
  userEmail: string;
}

export interface MemberInfo {
  pStatus?: 'Active' | 'Inactive' | 'Pending';
  serverRole?: 'member' | 'admin' | 'owner';
  userInfo: UserInfo;
}

export interface ChannelMemberInfo {
  cStatus?: 'Active' | 'Inactive' | 'Banned';
  channelRole?: 'member' | 'admin';
  userInfo: UserInfo;
}

export interface ProjectMemberInfo {
  pStatus?: 'Active' | 'Inactive' | 'Banned';
  projectRole?: 'member' | 'admin';
  userInfo: UserInfo;
}

export interface Role {
  userEmail: string;
}

export interface UserRole extends Role {
  newRole: 'member' | 'admin';
}

export interface FailedRole extends Role {
  reason: string;
}

export interface RoleUsers {
  changes: UserRole[];
}

export interface RoleResponse {
  processed: number;
  failed: FailedRole[];
}

export interface RolePermisson {
  permissonPk: number;
  serverPk: number;
  serverRole: string;
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}

export interface RolePermessionResponse {
  rolePermissions: RolePermisson[];
}

export interface Permission {
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}

export interface ChangePermission {
  serverRole: string;
  permissions: Permission;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  projectPk: number;
  projectName: string;
}

export interface ProjectPayload {
  projectName: string;
}

// ─── Channel ─────────────────────────────────────────────────────────────────

export interface Channel {
  channelPk: number;
  channelName: string;
  channelKind: ChannelKind;
  accessType: AccessType;
  channelRole: ChannelRole;
}

export interface ChannelRequest {
  channelName: string;
  channelKind: ChannelKind;
  accessType: AccessType;
}

export interface LastChannelResponse {
  serverUrl: string;
  projectPk: number;
  channelPk: number;
}

export interface ChannelPayload {
  channelName: string;
}

// ─── Server Info (Session) ────────────────────────────────────────────────────

export interface ServerInfo {
  serverName: string;
  serverUrl: string;
  projectName: string;
  projectPk: number;
  channelName: string;
  role: string;
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export type ModalType =
  | 'SERVER_ADD'
  | 'SERVER_EDIT'
  | 'SERVER_DELETE'
  | 'CHANNEL_ADD'
  | 'PROJECT_ADD'
  | 'PROJECT_INVITE'
  | 'PROJECT_MANAGE'
  | 'CHANNEL_MANAGE'
  | 'SETTING'
  | null;

export interface ServerData {
  id?: string;
  name: string;
  url: string;
  description?: string;
}

export interface ChannelData {
  serverUrl: string;
  projectPk: number;
  channelPk: number;
  channelName: string;
  channelKind: ChannelKind;
  accessType: AccessType;
}

export interface ProjectData {
  serverUrl: string;
  projectName: string;
  projectDescription?: string;
}

export interface ProjectInviteData {
  serverUrl: string;
  projectPk: number;
  projectName: string;
}

export interface ProjectManageData {
  serverUrl: string;
  projectPk: number;
}

export interface ChannelManageData {
  serverUrl: string;
  projectPk: number;
  channelPk: number;
}

export type ModalData =
  | ServerData
  | ChannelData
  | ProjectData
  | ProjectInviteData
  | ProjectManageData
  | ChannelManageData;

export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data: ModalData | null;
  loading: boolean;
  error: string | null;
}
