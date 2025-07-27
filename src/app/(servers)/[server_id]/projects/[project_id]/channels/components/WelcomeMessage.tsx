import React from "react";

interface WelcomeMessageProps {
  channelName: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  channelName,
}) => {
  return (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {channelName} 에
      </h2>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        오신것을 환영합니다!
      </h2>
      <p className="text-gray-600 mb-6">
        ⏰ 2025년 7월 12일 {channelName}을 심근원 님이 생성하였습니다.
      </p>

      <div className="flex justify-center space-x-4 mb-8">
        <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex items-center hover:bg-gray-400 transition-colors">
          <span className="mr-2">👥</span>
          초대 하기
        </button>
        <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex items-center hover:bg-gray-400 transition-colors">
          <span className="mr-2">✏️</span>
          메모 설정
        </button>
        <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex items-center hover:bg-gray-400 transition-colors">
          <span className="mr-2">📌</span>
          일정 설정
        </button>
      </div>
    </div>
  );
};
