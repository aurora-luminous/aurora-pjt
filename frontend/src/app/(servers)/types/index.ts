// 서버 관련 타입 정의
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

// 상태 관련 타입
export type TabType = "favorites" | "messages";

// 채팅 관련 타입
export interface Message {
  id: number;
  user: string;
  content: string;
  timestamp: string;
  isSystem: boolean;
}

// 백엔드 API 응답 타입
export interface MessageResponse {
  messagePk: number;
  channelPk: number | null;
  dmRoomPk: number | null;
  userPk: number;
  userName: string;
  content: string;
  createdAt: string;
  messageType: string;
}

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

// 개인 메시지 관련 타입
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

// 매핑 타입들
export type ServerNameMap = { [key: string]: string };
export type ProjectNameMap = { [key: string]: string };
export type ChannelNameMap = { [key: string]: string };

// Voice Channel 타입들
export * from "./voiceChannelTypes";
