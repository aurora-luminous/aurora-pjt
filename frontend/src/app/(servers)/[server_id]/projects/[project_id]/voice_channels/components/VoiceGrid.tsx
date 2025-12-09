import { VoiceParticipantCard } from "./VoiceParticipantCard";
import { VoiceParticipant } from "../../../../../types/voiceChannelTypes";

interface VoiceGridProps {
  participants: { [userId: string]: VoiceParticipant };
  gridLayout: string;
  gridRows: string;
  currentUserId?: string; // 현재 사용자 ID
  cameraStream?: MediaStream | null; // 카메라 스트림
  mikeStream?: MediaStream | null; // 마이크 스트림
}

export const VoiceGrid = ({
  participants,
  gridLayout,
  gridRows,
  currentUserId,
  cameraStream,
  mikeStream,
}: VoiceGridProps) => {
  return (
    <div
      className={`grid ${gridLayout} ${gridRows} gap-4 w-full h-3/4 max-w-6xl`}
    >
      {Object.entries(participants).map(([userId, participant]) => (
        <VoiceParticipantCard
          key={userId}
          participant={participant}
          isCompact={false}
          videoStream={
            userId === currentUserId && participant.isVideoOn
              ? cameraStream || undefined
              : undefined
          }
          mikeStream={
            userId === currentUserId && participant.isMicOn
              ? mikeStream || undefined
              : undefined
          }
        />
      ))}
    </div>
  );
};
