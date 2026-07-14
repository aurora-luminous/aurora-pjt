"use client";

import { useResponsive } from "../../../../../../lib/useResponsive";

interface VoiceHeaderProps {
  channelName: string;
  onClose?: () => void;
}

export const VoiceHeader = ({ channelName, onClose }: VoiceHeaderProps) => {
  const { isMobile } = useResponsive();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // 기본 동작: 뒤로가기
      window.history.back();
    }
  };

  return (
    <div
      className={`
      absolute z-10
      ${isMobile ? "top-2 left-2" : "top-4 left-4"}
    `}
    >
      <div
        className={`
        flex items-center gap-2 text-white
        ${isMobile ? "text-sm" : "text-base"}
      `}
      >
        <div
          className={`
          bg-gray-700 rounded-full flex items-center justify-center
          ${isMobile ? "w-5 h-5" : "w-6 h-6"}
        `}
        >
          🔊
        </div>
        <span
          className={`
          font-medium truncate max-w-32
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          {channelName}
        </span>
        <button
          onClick={handleClose}
          className={`
            ml-2 text-gray-400 hover:text-white transition-colors
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          aria-label="채널 나가기"
        >
          <svg
            className={`
            fill-current
            ${isMobile ? "w-3 h-3" : "w-4 h-4"}
          `}
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414L11.414 12l3.293 3.293a1 1 0 01-1.414 1.414L10 13.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 12 5.293 8.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
