import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface ChatHeaderProps {
  channelName: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ channelName }) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div
      className={`
      border-b border-gray-300 flex items-center justify-between
      ${isMobile ? "p-2" : "p-3"}
    `}
    >
      <div className="flex items-center min-w-0 flex-1">
        <span
          className={`
          text-gray-600 mr-2 flex-shrink-0
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          #
        </span>
        <span
          className={`
          text-gray-800 font-semibold truncate
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          {channelName}
        </span>
        {/* 설명 텍스트 - 모바일에서는 숨김 */}
        {!isMobile && (
          <div
            className={`
            flex items-center ml-8 text-sm text-gray-500 min-w-0
            ${isTablet ? "hidden" : "block"}
          `}
          >
            <span className="truncate">
              Figma | GitHub | Canva | 프로젝트 협업 사이트
            </span>
          </div>
        )}
      </div>
      <div
        className={`
        flex items-center flex-shrink-0
        ${isMobile ? "space-x-1" : "space-x-3"}
      `}
      >
        <button
          className={`
          text-gray-500 hover:text-gray-700 transition-colors
          ${isMobile ? "p-1 text-sm" : "p-1 text-base"}
        `}
        >
          📎
        </button>
        <button
          className={`
          text-gray-500 hover:text-gray-700 transition-colors
          ${isMobile ? "p-1 text-sm" : "p-1 text-base"}
        `}
        >
          🔔
        </button>
        <button
          className={`
          text-gray-500 hover:text-gray-700 transition-colors
          ${isMobile ? "p-1 text-sm" : "p-1 text-base"}
        `}
        >
          📌
        </button>
      </div>
    </div>
  );
};
