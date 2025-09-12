import { VoiceParticipantCard } from "./VoiceParticipantCard";
import { VoiceParticipant } from "../../../../../types/voiceChannelTypes";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface ScreenShareViewProps {
  participants: { [userId: string]: VoiceParticipant };
  currentUserId?: string; // 현재 사용자 ID
  cameraStream?: MediaStream | null; // 카메라 스트림
}

export const ScreenShareView = ({
  participants,
  currentUserId,
  cameraStream,
}: ScreenShareViewProps) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
      w-full flex flex-col gap-4
      ${isMobile ? "h-full" : "h-3/4"}
    `}
    >
      {/* 메인 화면 공유 영역 */}
      <div className="flex-1 bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div
            className={`
            bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center
            ${isMobile ? "w-20 h-20" : "w-32 h-32"}
          `}
          >
            <span className={`${isMobile ? "text-2xl" : "text-4xl"}`}>🖥️</span>
          </div>
          <p
            className={`
            text-gray-300
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            화면 공유 중...
          </p>
        </div>
      </div>

      {/* 하단에 참여자들 */}
      <div
        className={`
        flex gap-3 overflow-x-auto pb-2
        ${isMobile ? "h-20" : "h-32"}
      `}
      >
        {Object.entries(participants).map(([userId, participant]) => (
          <div
            key={userId}
            className={`
            flex-shrink-0
            ${isMobile ? "w-32" : "w-48"}
          `}
          >
            <VoiceParticipantCard
              participant={participant}
              isCompact={true}
              videoStream={
                userId === currentUserId && participant.isVideoOn
                  ? cameraStream || undefined
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
