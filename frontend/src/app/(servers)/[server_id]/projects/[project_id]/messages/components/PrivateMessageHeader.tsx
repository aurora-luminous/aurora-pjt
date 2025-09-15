import React from "react";
import { ChatUser } from "../../../../../types";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface PrivateMessageHeaderProps {
  user: ChatUser | undefined;
  userName: string;
}

export const PrivateMessageHeader: React.FC<PrivateMessageHeaderProps> = ({
  user,
  userName,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
      bg-white border-b border-gray-300
      ${isMobile ? "p-2" : "p-3"}
    `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0 flex-1">
          <div
            className={`
            bg-white rounded-full flex items-center justify-center mr-3 flex-shrink-0
            ${isMobile ? "w-7 h-7" : "w-8 h-8"}
          `}
          >
            <span
              className={`
              text-gray-800
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              {userName[0]}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`
              text-gray-800 font-semibold truncate
              ${isMobile ? "text-sm" : "text-base"}
            `}
            >
              {userName}
            </span>
            {/* 상태 - 모바일에서는 숨김 */}
            {user && !isMobile && (
              <span
                className={`text-xs ${
                  user.status === "online"
                    ? "text-green-500"
                    : user.status === "away"
                    ? "text-yellow-500"
                    : user.status === "busy"
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {user.status === "online"
                  ? "온라인"
                  : user.status === "away"
                  ? "자리비움"
                  : user.status === "busy"
                  ? "바쁨"
                  : "오프라인"}
              </span>
            )}
          </div>
        </div>
        <div
          className={`
          flex items-center flex-shrink-0
          ${isMobile ? "space-x-2" : "space-x-4"}
        `}
        >
          <button
            className={`
              text-gray-500 hover:text-gray-700 transition-colors
              ${isMobile ? "p-1 text-sm" : "p-1 text-base"}
            `}
            title="음성 통화"
          >
            📞
          </button>
          <button
            className={`
              text-gray-500 hover:text-gray-700 transition-colors
              ${isMobile ? "p-1 text-sm" : "p-1 text-base"}
            `}
            title="비디오 통화"
          >
            📹
          </button>
          <button
            className={`
              text-gray-500 hover:text-gray-700 transition-colors
              ${isMobile ? "p-1 text-sm" : "p-1 text-base"}
            `}
            title="설정"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};
