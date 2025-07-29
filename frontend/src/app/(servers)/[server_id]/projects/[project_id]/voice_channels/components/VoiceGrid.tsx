import { VoiceParticipantCard } from "./VoiceParticipantCard";
import { VoiceParticipant } from "../../../../../types/voiceChannelTypes";

interface VoiceGridProps {
  participants: { [userId: string]: VoiceParticipant };
  gridLayout: string;
  gridRows: string;
}

export const VoiceGrid = ({
  participants,
  gridLayout,
  gridRows,
}: VoiceGridProps) => {
  return (
    <div
      className={`grid ${gridLayout} ${gridRows} gap-4 w-full h-full max-w-6xl`}
    >
      {Object.entries(participants).map(([userId, participant]) => (
        <VoiceParticipantCard
          key={userId}
          participant={participant}
          isCompact={false}
        />
      ))}
    </div>
  );
};
