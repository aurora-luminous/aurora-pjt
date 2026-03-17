import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";

export const MessageSkeleton: React.FC = () => {
  const { isMobile } = useResponsive();

  return (
    <div className={`${isMobile ? "mb-3" : "mb-4"}`}>
      <div className="flex">
        {/* 아바타 스켈레톤 */}
        <div
          className={`
          bg-gray-300 rounded-full animate-pulse mr-3 flex-shrink-0
          ${isMobile ? "w-8 h-8" : "w-10 h-10"}
        `}
        />

        {/* 메시지 내용 스켈레톤 */}
        <div className="min-w-0 flex-1">
          {/* 사용자명과 시간 스켈레톤 */}
          <div className={`flex items-center ${isMobile ? "mb-1" : "mb-1"}`}>
            <div
              className={`
              bg-gray-300 rounded animate-pulse mr-2
              ${isMobile ? "h-4 w-20" : "h-4 w-24"}
            `}
            />
            <div
              className={`
              bg-gray-300 rounded animate-pulse
              ${isMobile ? "h-3 w-12" : "h-3 w-14"}
            `}
            />
          </div>
          {/* 메시지 텍스트 스켈레톤 */}
          <div className="space-y-1">
            <div
              className={`
              bg-gray-300 rounded animate-pulse
              ${isMobile ? "h-4 w-full" : "h-4 w-3/4"}
            `}
            />
            <div
              className={`
              bg-gray-300 rounded animate-pulse
              ${isMobile ? "h-4 w-2/3" : "h-4 w-1/2"}
            `}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
