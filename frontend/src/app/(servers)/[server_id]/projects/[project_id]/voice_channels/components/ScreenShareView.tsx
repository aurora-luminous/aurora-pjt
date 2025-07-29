import { VoiceParticipantCard } from "./VoiceParticipantCard";
import { VoiceParticipant } from "../../../../../types/voiceChannelTypes";

interface ScreenShareViewProps {
  participants: { [userId: string]: VoiceParticipant };
}

export const ScreenShareView = ({ participants }: ScreenShareViewProps) => {
  return (
    <div className="w-full h-full flex gap-4">
      {/* 메인 화면 공유 영역 */}
      <div className="flex-1 bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🖥️</span>
          </div>
          <p className="text-gray-300">화면 공유 중...</p>
        </div>
      </div>

      {/* 사이드바에 참여자들 */}
      <div className="w-72 flex flex-col gap-3">
        {Object.entries(participants).map(([userId, participant]) => (
          <VoiceParticipantCard
            key={userId}
            participant={participant}
            isCompact={true}
          />
        ))}
      </div>
    </div>
  );
};
