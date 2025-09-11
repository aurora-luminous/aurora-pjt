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
  inviteLink: string;
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