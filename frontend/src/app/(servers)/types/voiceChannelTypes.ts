import { Message } from "./index";

// Voice Channel 참여자 상태 타입
export interface VoiceParticipant {
  userId: string;
  username: string;
  isMicOn: boolean;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSpeaking: boolean;
}

// Voice Channel 상태 타입
export interface VoiceChannelState {
  // 채널별 상태 관리
  channels: {
    [channelId: string]: {
      // 참여자 관리
      participants: { [userId: string]: VoiceParticipant };

      // 화면 공유 관리
      isScreenShareActive: boolean;
      activeScreenSharer: string | null;

      // 채널 설정
      isSettingsOpen: boolean;
      isFullScreen: boolean;

      // 메시지 관리
      messages: Message[];
    };
  };

  // 현재 사용자의 로컬 상태
  currentUser: {
    userId: string;
    isSpeakerOn: boolean;
    isScreenShareOpen: boolean;
  };
}
