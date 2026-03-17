export interface ServerRequest {
  serverName: string;
  serverUrl: string;
}

export interface ServerResponse {
  message: string | "";
}

export interface ServerListItem {
  serverName: string;
  serverUrl: string;
  serverRole: string;
}

export interface InviteCode {
  inviteHash: string;
}

export interface MemberInfo {
  pStatus?: "Active" | "Inactive" | "Pending";
  serverRole?: "member" | "admin" | "owner";
  userInfo: UserInfo;
}

export interface UserInfo {
  userName: string;
  userEmail: string;
  ProfileImageUrl: string;
}

export interface MemberEmail {
  userEmail: string;
}

export interface ChannelMemberInfo {
  cStatus?: "Active" | "Inactive" | "Banned";
  channelRole?: "member" | "admin";
  userInfo: UserInfo;
}

export interface ProjectMemberInfo {
  pStatus?: "Active" | "Inactive" | "Banned";
  projectRole?: "member" | "admin";
  userInfo: UserInfo;
}

export interface RoleUsers {
  changes: UserRole[];
}

export interface Role {
  userEmail: string;
}

export interface UserRole extends Role {
  newRole: "member" | "admin";
}

export interface FailedRole extends Role {
  reason: string;
}

export interface RoleResponse {
  processed: number;
  failed: FailedRole[];
}

export interface RolePermessionResponse {
  rolePermissions: RolePermisson[];
}

export interface RolePermisson {
  permissonPk: number;
  serverPk: number;
  serverRole: string;
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}

export interface ChangePermission {
  serverRole: string;
  permissions: Permission;
}

export interface Permission {
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}
