// 웹소켓 관련 타입 정의

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
