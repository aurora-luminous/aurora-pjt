import { defaultMessages } from "@/app/(servers)/constants/channelData";
import { VoiceParticipant } from "@/app/(servers)/types";
import { useEffect } from "react";

interface UseVoiceChannelInitProps {
  channelId: string;
  initializeChannel: (messages: any[]) => void;
  joinChannel: (participant: VoiceParticipant) => void;
  leaveChannel: (userId: string) => void;
}

export const useVoiceChannelInit = ({
  channelId,
  initializeChannel,
  joinChannel,
  leaveChannel,
}: UseVoiceChannelInitProps) => {
  useEffect(() => {
    // 채널 초기화
    initializeChannel(defaultMessages);

    // 현재 사용자를 참여자로 추가
    const currentUser: VoiceParticipant = {
      userId: "current-user", // 실제로는 auth에서 가져와야 함
      username: "김병년", // 실제로는 auth에서 가져와야 함
      isMicOn: true,
      isVideoOn: false,
      isAudioOn: true,
      isSpeaking: false,
    };

    // 테스트용 추가 참여자들
    const testParticipants: VoiceParticipant[] = [
      {
        userId: "user-2",
        username: "심근원",
        isMicOn: false,
        isVideoOn: true,
        isAudioOn: true,
        isSpeaking: false,
      },
      {
        userId: "user-3",
        username: "이용재",
        isMicOn: true,
        isVideoOn: false,
        isAudioOn: true,
        isSpeaking: false,
      },
      {
        userId: "user-4",
        username: "김세현",
        isMicOn: true,
        isVideoOn: true,
        isAudioOn: true,
        isSpeaking: false,
      },
    ];

    // 참여자들 추가
    joinChannel(currentUser);
    testParticipants.forEach((participant) => joinChannel(participant));

    // 컴포넌트 언마운트 시 채널에서 나가기
    return () => {
      leaveChannel("current-user");
      testParticipants.forEach((participant) =>
        leaveChannel(participant.userId)
      );
    };
  }, [channelId, initializeChannel, joinChannel, leaveChannel]);
};
