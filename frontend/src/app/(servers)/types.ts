// ============================================================
// 서버 / 역할 / 권한 타입
// ============================================================

export interface RolePermisson {
  permissonPk: number;
  serverPk: number;
  serverRole: string;
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}

export interface RolePermissions {
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

export interface ServerAccess {
  sStatus: string;
  userInfo?: UserInfo;
  defaultProject?: { projectPk: number; projectName: string };
  defaultChannel?: { channelPk: number; channelName: string; channelKind?: string };
}

export interface UserInfo {
  user_name: string;
  user_email: string;
  profile_image_path: string;
}

export type ServerStatus = "Active" | "Pending" | "Inactive" | "Banned";

// ============================================================
// 서버 / 프로젝트 / 채널 / 사용자 타입
// ============================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  members: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  status: "online" | "away" | "busy" | "offline";
  role?: string;
}

export interface DirectMessage {
  id: string;
  name: string;
  status: "online" | "away" | "busy" | "offline";
  lastMessage?: string;
  timestamp?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice" | "notice";
}

export type TabType = "favorites" | "messages";

export interface OnlineUser {
  id: number;
  name: string;
  status: "online" | "away" | "busy" | "offline";
  role: string;
}

export interface DirectMessageItem {
  id: number;
  name: string;
  lastMessage: string;
  status: "online" | "away" | "busy" | "offline";
}

// ============================================================
// 채팅 / 메시지 타입
// ============================================================

export interface Message {
  id: number;
  user: string;
  content: string;
  timestamp: string;
  isSystem: boolean;
}

export interface MessageListResponse {
  lastReadMessagePk: number | null;
  messages: MessageResponse[];
}

export interface MessageResponse {
  messagePk: number;
  userEmail: string;
  userName: string;
  userProfileImage: string;
  content: string;
  messageType: string;
  createdAt: string;
}

export interface PrivateMessage {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface ChatUser {
  id: number;
  name: string;
  status: "online" | "away" | "busy" | "offline";
}

// ============================================================
// 매핑 타입
// ============================================================

export type ServerNameMap = { [key: string]: string };
export type ProjectNameMap = { [key: string]: string };
export type ChannelNameMap = { [key: string]: string };

// ============================================================
// 음성 채널 타입
// ============================================================

export interface VoiceParticipant {
  userId: string;
  username: string;
  isMicOn: boolean;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSpeaking: boolean;
}

export interface VoiceChannelState {
  channels: {
    [channelId: string]: {
      participants: { [userId: string]: VoiceParticipant };
      isScreenShareActive: boolean;
      activeScreenSharer: string | null;
      isSettingsOpen: boolean;
      isFullScreen: boolean;
      messages: Message[];
    };
  };
  currentUser: {
    userId: string;
    isSpeakerOn: boolean;
    isScreenShareOpen: boolean;
  };
}

// ============================================================
// 역할 관리 UI 타입 (RoleCard 컴포넌트용)
// ============================================================

export interface RolePermissionUI {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface RoleUI {
  id: string;
  name: string;
  color: string;
  permissions: RolePermissionUI[];
  memberCount: number;
  isDefault?: boolean;
  isOwner?: boolean;
}

// ============================================================
// 웹소켓 타입
// ============================================================

export interface ChannelInfo {
  channelPk: number;
  channelName: string;
}

export interface MessageRequest {
  channelPk: number;
  dmRoomPk?: number;
  content: string;
}

export interface ChatMessage {
  messagePk: number;
  userPk: number;
  userName: string;
  channelPk: number;
  dmRoomPk?: number;
  content: string;
  createdAt: string;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  subscribedChannels: number[];
}
