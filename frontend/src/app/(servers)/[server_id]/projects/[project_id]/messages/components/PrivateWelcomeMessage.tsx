import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface PrivateWelcomeMessageProps {
  userName: string;
}

export const PrivateWelcomeMessage: React.FC<PrivateWelcomeMessageProps> = ({
  userName,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={`text-center ${isMobile ? "py-6" : "py-8"}`}>
      <div
        className={`
        bg-white rounded-full flex items-center justify-center mx-auto mb-4
        ${isMobile ? "w-12 h-12" : "w-16 h-16"}
      `}
      >
        <span
          className={`
          text-gray-800 font-bold
          ${isMobile ? "text-lg" : "text-xl"}
        `}
        >
          {userName[0]}
        </span>
      </div>
      <h2
        className={`
        font-bold text-gray-800 mb-2
        ${isMobile ? "text-lg" : "text-xl"}
      `}
      >
        {userName}
      </h2>
      <p
        className={`
        text-gray-600 mb-6
        ${isMobile ? "text-sm" : "text-base"}
      `}
      >
        {userName}과의 개인 메시지입니다.
        <br />
        여기서 1:1 대화를 나누세요.
      </p>
      <div
        className={`
        flex justify-center
        ${isMobile ? "flex-col space-y-2 space-x-0" : "space-x-4 space-y-0"}
      `}
      >
        <button
          className={`
          bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 transition-colors
          ${isMobile ? "px-3 py-2 text-sm w-full" : "px-4 py-2 text-base"}
        `}
        >
          <span className="mr-2">📞</span>
          음성 통화
        </button>
        <button
          className={`
          bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 transition-colors
          ${isMobile ? "px-3 py-2 text-sm w-full" : "px-4 py-2 text-base"}
        `}
        >
          <span className="mr-2">📹</span>
          비디오 통화
        </button>
      </div>
    </div>
  );
};
