import { VoiceParticipant } from "../../../../../types/voiceChannelTypes";
import { useEffect, useRef } from "react";

interface VoiceParticipantCardProps {
  participant: VoiceParticipant;
  isCompact?: boolean; // 화면 공유 모드일 때 작은 크기
  videoStream?: MediaStream; // 비디오 스트림
}

export const VoiceParticipantCard = ({
  participant,
  isCompact = false,
  videoStream,
}: VoiceParticipantCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 비디오 스트림 연결
  useEffect(() => {
    if (videoRef.current && videoStream) {
      console.log("📺 Setting video srcObject for:", participant.username);
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, participant.isVideoOn, participant.username]);

  const avatarSize = isCompact ? "w-12 h-12" : "w-24 h-24";
  const textSize = isCompact ? "text-xs" : "text-sm";
  const iconSize = isCompact ? "w-4 h-4" : "w-8 h-8";
  const namePosition = isCompact ? "bottom-2 left-2" : "bottom-4 left-4";

  return (
    <div
      className={`bg-gray-800 rounded-lg ${
        isCompact ? "p-4 aspect-video" : "aspect-video"
      } flex flex-col items-center justify-center relative overflow-hidden ${
        participant.isSpeaking ? "ring-2 ring-green-400" : ""
      }`}
    >
      {/* 사용자 비디오 또는 아바타 */}
      {participant.isVideoOn && videoStream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div
          className={`${avatarSize} bg-gray-600 rounded-full flex items-center justify-center ${
            isCompact ? "text-xl mb-2" : "text-3xl mb-4"
          }`}
        >
          {participant.username[0]}
        </div>
      )}

      {/* 이름과 상태 아이콘 컨테이너 */}
      <div className={`absolute ${namePosition} flex items-center gap-2`}>
        {/* 사용자 이름 */}
        <div className="bg-aurora-voice rounded-full px-5">
          <span className={`${textSize} text-white`}>
            {participant.username}
          </span>
        </div>

        {/* 상태 표시 아이콘들 */}
        <div className={`flex gap-${isCompact ? "1" : "2"}`}>
          {!participant.isMicOn && (
            <div
              className={`${iconSize} bg-red-500 rounded-full flex items-center justify-center`}
            >
              <svg
                className={`${isCompact ? "w-3 h-3" : "w-4 h-4"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {!participant.isVideoOn && (
            <div
              className={`${iconSize} bg-gray-500 rounded-full flex items-center justify-center`}
            >
              <svg
                className={`${isCompact ? "w-3 h-3" : "w-4 h-4"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 발언 중 애니메이션 */}
      {participant.isSpeaking && (
        <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse"></div>
      )}
    </div>
  );
};
