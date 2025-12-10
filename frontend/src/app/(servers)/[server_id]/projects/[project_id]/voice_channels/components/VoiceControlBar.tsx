import { useResponsive } from "../../../../../../lib/useResponsive";
import { ChangeIcon } from "./icons/ChangeIcon";
import { ScreenIcon } from "./icons/ScreenShareIcon";
import { StopIcon } from "./icons/StopIcon";

interface VoiceControlBarProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChangeScreenShare: () => void;
  onEndCall?: () => void;
}

export const VoiceControlBar = ({
  isMicOn,
  isVideoOn,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChangeScreenShare,
  onEndCall,
}: VoiceControlBarProps) => {
  const { isMobile } = useResponsive();

  const handleEndCall = () => {
    if (onEndCall) {
      onEndCall();
    } else {
      // 기본 동작: 뒤로가기
      window.history.back();
    }
  };

  return (
    <div
      className={`
      absolute left-1/2 transform -translate-x-1/2 z-10
      ${isMobile ? "bottom-4" : "bottom-6"}
    `}
    >
      <div
        className={`
        flex items-center bg-gray-800 rounded-full
        ${isMobile ? "gap-2 px-4 py-3" : "gap-4 px-6 py-4"}
      `}
      >
        {/* 마이크 */}
        <button
          onClick={onToggleMic}
          className={`
            rounded-full flex items-center justify-center transition-colors
            ${isMobile ? "w-10 h-10" : "w-12 h-12"}
            ${
              isMicOn
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-red-500 hover:bg-red-600"
            }
          `}
          aria-label={isMicOn ? "마이크 끄기" : "마이크 켜기"}
        >
          {isMicOn ? (
            <svg
              className={`
              fill-current
              ${isMobile ? "w-5 h-5" : "w-6 h-6"}
            `}
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className={`
              fill-current
              ${isMobile ? "w-5 h-5" : "w-6 h-6"}
            `}
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.293 2.293a1 1 0 011.414 0L7 5.586V4a3 3 0 116 0v4c0 .57-.16 1.104-.44 1.563l1.828 1.828A6.966 6.966 0 0015 8a1 1 0 012 0 8.94 8.94 0 01-1.22 4.522l1.927 1.927a1 1 0 01-1.414 1.414L3.707 3.707a1 1 0 010-1.414zM10 11.414L7.586 9A3.001 3.001 0 007 8v3a3 3 0 003 .414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* 비디오 */}
        <button
          onClick={onToggleVideo}
          className={`
            rounded-full flex items-center justify-center transition-colors
            ${isMobile ? "w-10 h-10" : "w-12 h-12"}
            ${
              isVideoOn
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-red-500 hover:bg-red-600"
            }
          `}
          aria-label={isVideoOn ? "비디오 끄기" : "비디오 켜기"}
        >
          {isVideoOn ? (
            <svg
              className={`
              fill-current
              ${isMobile ? "w-5 h-5" : "w-6 h-6"}
            `}
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg
              className={`
              fill-current
              ${isMobile ? "w-5 h-5" : "w-6 h-6"}
            `}
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* 화면 공유 */}
        {!isScreenSharing ? (
          // 화면 공유 시작 버튼
          <button
            onClick={onToggleScreenShare}
            className={`rounded-full flex items-center justify-center transition-colors
      ${isMobile ? "w-10 h-10" : "w-12 h-12"}
      bg-gray-600 hover:bg-gray-500
    `}
          >
            {/* 화면 공유 시작 아이콘 */}
            <ScreenIcon className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
          </button>
        ) : (
          // 화면 공유 중일 때 → 두 개의 버튼
          <div className="flex gap-2">
            {/* 화면 공유 종료 */}
            <button
              onClick={onToggleScreenShare}
              className={`rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors
        ${isMobile ? "w-10 h-10" : "w-12 h-12"}
      `}
            >
              {/* STOP 아이콘 */}
              <StopIcon className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
            </button>

            {/* 화면 공유 변경 */}
            <button
              onClick={onToggleChangeScreenShare}
              className={`rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors
        ${isMobile ? "w-10 h-10" : "w-12 h-12"}
      `}
            >
              {/* CHANGE 아이콘 */}
              <ChangeIcon className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
            </button>
          </div>
        )}

        {/* 통화 종료 */}
        <button
          onClick={handleEndCall}
          className={`
            rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors
            ${isMobile ? "w-10 h-10" : "w-12 h-12"}
          `}
          aria-label="통화 종료"
        >
          <svg
            className={`
            fill-current
            ${isMobile ? "w-5 h-5" : "w-6 h-6"}
          `}
            viewBox="0 0 20 20"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
