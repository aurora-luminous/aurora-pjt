import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import type { RootState, AppDispatch } from "../../lib/store";
import { Message } from "../types";
import { VoiceParticipant } from "../types/voiceChannelTypes";
import {
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
} from "../store/voiceChannelSlice";

// Redux Store와 Hook을 연결하는 커넥터 훅
export const useConnectRedux = (channelId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const voiceChannelState = useSelector(
    (state: RootState) => state.voiceChannel
  );
  const currentUserId = voiceChannelState.currentUser.userId;

  // 현재 채널 상태
  const channelState = voiceChannelState.channels[channelId];
  const currentParticipant = channelState?.participants[currentUserId];

  const actions = {
    // 채널 초기화
    initializeChannel: useCallback(
      (messages: Message[]) => {
        dispatch(initializeChannel({ channelId, messages }));
      },
      [dispatch, channelId]
    ),

    // 참여자 관리
    joinChannel: useCallback(
      (participant: VoiceParticipant) => {
        dispatch(addParticipant({ channelId, participant }));
      },
      [dispatch, channelId]
    ),

    leaveChannel: useCallback(
      (userId: string) => {
        dispatch(removeParticipant({ channelId, userId }));
      },
      [dispatch, channelId]
    ),

    // 현재 사용자 상태 토글
    toggleMyMic: useCallback(() => {
      dispatch(toggleParticipantMic({ channelId, userId: currentUserId }));
    }, [dispatch, channelId, currentUserId]),

    toggleMyVideo: useCallback(() => {
      dispatch(toggleParticipantVideo({ channelId, userId: currentUserId }));
    }, [dispatch, channelId, currentUserId]),

    toggleMyAudio: useCallback(() => {
      dispatch(toggleParticipantAudio({ channelId, userId: currentUserId }));
    }, [dispatch, channelId, currentUserId]),

    toggleSpeaker: useCallback(() => {
      dispatch(toggleSpeaker());
    }, [dispatch]),

    toggleMyScreenShare: useCallback(() => {
      dispatch(toggleScreenShare({ channelId, userId: currentUserId }));
    }, [dispatch, channelId, currentUserId]),

    toggleScreenShareOpen: useCallback(() => {
      dispatch(toggleScreenShareOpen());
    }, [dispatch]),

    // 채널 설정
    toggleFullScreen: useCallback(() => {
      dispatch(toggleFullScreen({ channelId }));
    }, [dispatch, channelId]),

    toggleSettings: useCallback(() => {
      dispatch(toggleSettings({ channelId }));
    }, [dispatch, channelId]),

    // 메시지
    sendMessage: useCallback(
      (message: Message) => {
        dispatch(addMessage({ channelId, message }));
      },
      [dispatch, channelId]
    ),

    // 발언 상태
    setSpeaking: useCallback(
      (userId: string, isSpeaking: boolean) => {
        dispatch(setSpeaking({ channelId, userId, isSpeaking }));
      },
      [dispatch, channelId]
    ),
  };

  return {
    // 상태
    participants: channelState?.participants || {},
    messages: channelState?.messages || [],
    isScreenShareActive: channelState?.isScreenShareActive || false,
    activeScreenSharer: channelState?.activeScreenSharer,
    isSettingsOpen: channelState?.isSettingsOpen || false,
    isFullScreen: channelState?.isFullScreen || false,
    isSpeakerOn: voiceChannelState.currentUser.isSpeakerOn,
    isScreenShareOpen: voiceChannelState.currentUser.isScreenShareOpen,

    // 현재 사용자 상태
    isMicOn: currentParticipant?.isMicOn || false,
    isVideoOn: currentParticipant?.isVideoOn || false,
    isAudioOn: currentParticipant?.isAudioOn || false,
    isSpeaking: currentParticipant?.isSpeaking || false,

    // 액션들
    ...actions,

    // 유틸리티
    isScreenSharing: channelState?.activeScreenSharer === currentUserId,
    participantCount: Object.keys(channelState?.participants || {}).length,
  };
};
