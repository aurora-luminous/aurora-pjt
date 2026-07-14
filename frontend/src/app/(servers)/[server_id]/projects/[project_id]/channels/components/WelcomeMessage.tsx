import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface WelcomeMessageProps {
  channelName: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  channelName,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={`text-center ${isMobile ? "py-4" : "py-8"}`}>
      <h2
        className={`
        font-bold text-gray-800 mb-2
        ${isMobile ? "text-lg" : "text-2xl"}
      `}
      >
        {channelName} 에
      </h2>
      <h2
        className={`
        font-bold text-gray-800 mb-4
        ${isMobile ? "text-lg" : "text-2xl"}
      `}
      >
        오신것을 환영합니다!
      </h2>
      <p
        className={`
        text-gray-600 mb-6
        ${isMobile ? "text-sm" : "text-base"}
      `}
      >
        ⏰ 2025년 7월 12일 {channelName}을 심근원 님이 생성하였습니다.
      </p>

      <div
        className={`
        flex justify-center mb-8
        ${isMobile ? "flex-col space-y-2 space-x-0" : "space-x-4 space-y-0"}
      `}
      >
        <button
          className={`
          bg-gray-300 text-gray-700 rounded flex items-center justify-center hover:bg-gray-400 transition-colors
          ${isMobile ? "px-3 py-2 text-sm w-full" : "px-4 py-2 text-base"}
        `}
        >
          <span className="mr-2">👥</span>
          초대 하기
        </button>
        <button
          className={`
          bg-gray-300 text-gray-700 rounded flex items-center justify-center hover:bg-gray-400 transition-colors
          ${isMobile ? "px-3 py-2 text-sm w-full" : "px-4 py-2 text-base"}
        `}
        >
          <span className="mr-2">✏️</span>
          메모 설정
        </button>
        <button
          className={`
          bg-gray-300 text-gray-700 rounded flex items-center justify-center hover:bg-gray-400 transition-colors
          ${isMobile ? "px-3 py-2 text-sm w-full" : "px-4 py-2 text-base"}
        `}
        >
          <span className="mr-2">📌</span>
          일정 설정
        </button>
      </div>
    </div>
  );
};
