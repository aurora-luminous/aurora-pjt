import { useVoiceChannelParams } from "./useVoiceChannelParams";
import { useConnectRedux } from "./useConnectRedux";
import { useVoiceChannelInit } from "./useVoiceChannelInit";

export const useVoiceChannelPage = () => {
  // 🎯 1. URL 파라미터 관리
  const params = useVoiceChannelParams();

  // 🎯 2. Redux 연결 (직접 사용)
  const reduxData = useConnectRedux(params.channelId);

  // 🎯 3. 채널 초기화
  useVoiceChannelInit({
    channelId: params.channelId,
    initializeChannel: reduxData.initializeChannel,
    joinChannel: reduxData.joinChannel,
    leaveChannel: reduxData.leaveChannel,
  });

  // 🎯 4. UI에 최적화된 데이터 조합 및 반환
  return {
    // URL 파라미터
    serverId: params.serverId,
    projectId: params.projectId,
    channelId: params.channelId,
    getChannelName: params.getChannelName,

    // 사용자 ID
    currentUserId: reduxData.currentUserId,

    // 상태 (Redux에서 직접)
    isMicOn: reduxData.isMicOn,
    isSpeakerOn: reduxData.isSpeakerOn,
    isSettingsOpen: reduxData.isSettingsOpen,
    isFullScreen: reduxData.isFullScreen,
    isVideoOn: reduxData.isVideoOn,
    isAudioOn: reduxData.isAudioOn,
    isScreenShareOpen: reduxData.isScreenShareOpen,
    isScreenShareActive: reduxData.isScreenShareActive,
    isSpeaking: reduxData.isSpeaking,
    isScreenSharing: reduxData.isScreenSharing,

    // 참여자 및 채널 상태
    participants: reduxData.participants,
    participantCount: reduxData.participantCount,
    activeScreenSharer: reduxData.activeScreenSharer,
    messages: reduxData.messages,

    // 액션 (기존 API 호환성 유지)
    toggleMic: reduxData.toggleMyMic,
    toggleSpeaker: reduxData.toggleSpeaker,
    toggleScreenShare: reduxData.toggleMyScreenShare,
    toggleScreenShareOpen: reduxData.toggleScreenShareOpen,
    toggleFullScreen: reduxData.toggleFullScreen,
    toggleVideo: reduxData.toggleMyVideo,
    toggleAudio: reduxData.toggleMyAudio,
    toggleSettings: reduxData.toggleSettings,

    // 새로운 Redux 전용 액션들
    sendMessage: reduxData.sendMessage,
    setSpeaking: reduxData.setSpeaking,
    joinChannel: reduxData.joinChannel,
    leaveChannel: reduxData.leaveChannel,
  };
};
