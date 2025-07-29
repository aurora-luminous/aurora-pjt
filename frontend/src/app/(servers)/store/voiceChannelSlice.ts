import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "../types";
import {
  VoiceChannelState,
  VoiceParticipant,
} from "../types/voiceChannelTypes";

// 초기 상태
const initialState: VoiceChannelState = {
  channels: {},
  currentUser: {
    userId: "current-user", // 실제로는 auth에서 가져와야 함
    isSpeakerOn: false,
    isScreenShareOpen: false,
  },
};

// Voice Channel 슬라이스 생성
const voiceChannelSlice = createSlice({
  name: "voiceChannel",
  initialState,
  reducers: {
    // 채널 초기화
    initializeChannel: (
      state,
      action: PayloadAction<{ channelId: string; messages: Message[] }>
    ) => {
      const { channelId, messages } = action.payload;
      if (!state.channels[channelId]) {
        state.channels[channelId] = {
          participants: {},
          isScreenShareActive: false,
          activeScreenSharer: null,
          isSettingsOpen: false,
          isFullScreen: false,
          messages,
        };
      }
    },

    // 참여자 추가
    addParticipant: (
      state,
      action: PayloadAction<{
        channelId: string;
        participant: VoiceParticipant;
      }>
    ) => {
      const { channelId, participant } = action.payload;
      if (state.channels[channelId]) {
        state.channels[channelId].participants[participant.userId] =
          participant;
      }
    },

    // 참여자 제거
    removeParticipant: (
      state,
      action: PayloadAction<{ channelId: string; userId: string }>
    ) => {
      const { channelId, userId } = action.payload;
      if (state.channels[channelId]) {
        delete state.channels[channelId].participants[userId];
      }
    },

    // 마이크 상태 토글
    toggleParticipantMic: (
      state,
      action: PayloadAction<{ channelId: string; userId: string }>
    ) => {
      const { channelId, userId } = action.payload;
      const participant = state.channels[channelId]?.participants[userId];
      if (participant) {
        participant.isMicOn = !participant.isMicOn;
      }
    },

    // 비디오 상태 토글
    toggleParticipantVideo: (
      state,
      action: PayloadAction<{ channelId: string; userId: string }>
    ) => {
      const { channelId, userId } = action.payload;
      const participant = state.channels[channelId]?.participants[userId];
      if (participant) {
        participant.isVideoOn = !participant.isVideoOn;
      }
    },

    // 오디오 상태 토글
    toggleParticipantAudio: (
      state,
      action: PayloadAction<{ channelId: string; userId: string }>
    ) => {
      const { channelId, userId } = action.payload;
      const participant = state.channels[channelId]?.participants[userId];
      if (participant) {
        participant.isAudioOn = !participant.isAudioOn;
      }
    },

    // 스피커 상태 토글 (로컬)
    toggleSpeaker: (state) => {
      state.currentUser.isSpeakerOn = !state.currentUser.isSpeakerOn;
    },

    // 화면 공유 상태 토글
    toggleScreenShare: (
      state,
      action: PayloadAction<{ channelId: string; userId: string }>
    ) => {
      const { channelId, userId } = action.payload;
      const channel = state.channels[channelId];
      if (channel) {
        if (channel.activeScreenSharer === userId) {
          // 현재 공유자가 다시 토글하면 중지
          channel.isScreenShareActive = false;
          channel.activeScreenSharer = null;
        } else {
          // 새로운 사용자가 화면 공유 시작
          channel.isScreenShareActive = true;
          channel.activeScreenSharer = userId;
        }
      }
    },

    // 화면 공유 창 토글 (로컬)
    toggleScreenShareOpen: (state) => {
      state.currentUser.isScreenShareOpen =
        !state.currentUser.isScreenShareOpen;
    },

    // 전체 화면 토글
    toggleFullScreen: (state, action: PayloadAction<{ channelId: string }>) => {
      const { channelId } = action.payload;
      if (state.channels[channelId]) {
        state.channels[channelId].isFullScreen =
          !state.channels[channelId].isFullScreen;
      }
    },

    // 설정 창 토글
    toggleSettings: (state, action: PayloadAction<{ channelId: string }>) => {
      const { channelId } = action.payload;
      if (state.channels[channelId]) {
        state.channels[channelId].isSettingsOpen =
          !state.channels[channelId].isSettingsOpen;
      }
    },

    // 메시지 추가
    addMessage: (
      state,
      action: PayloadAction<{ channelId: string; message: Message }>
    ) => {
      const { channelId, message } = action.payload;
      if (state.channels[channelId]) {
        state.channels[channelId].messages.push(message);
      }
    },

    // 발언 상태 설정
    setSpeaking: (
      state,
      action: PayloadAction<{
        channelId: string;
        userId: string;
        isSpeaking: boolean;
      }>
    ) => {
      const { channelId, userId, isSpeaking } = action.payload;
      const participant = state.channels[channelId]?.participants[userId];
      if (participant) {
        participant.isSpeaking = isSpeaking;
      }
    },
  },
});

// 액션 내보내기
export const {
  initializeChannel,
  addParticipant,
  removeParticipant,
  toggleParticipantMic,
  toggleParticipantVideo,
  toggleParticipantAudio,
  toggleSpeaker,
  toggleScreenShare,
  toggleScreenShareOpen,
  toggleFullScreen,
  toggleSettings,
  addMessage,
  setSpeaking,
} = voiceChannelSlice.actions;

// 리듀서 내보내기
export default voiceChannelSlice.reducer;
