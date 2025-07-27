import React from "react";

interface PrivateWelcomeMessageProps {
  userName: string;
}

export const PrivateWelcomeMessage: React.FC<PrivateWelcomeMessageProps> = ({
  userName,
}) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-gray-800 text-xl font-bold">{userName[0]}</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{userName}</h2>
      <p className="text-gray-600 mb-6">
        {userName}과의 개인 메시지입니다.
        <br />
        여기서 1:1 대화를 나누세요.
      </p>
      <div className="flex justify-center space-x-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600 transition-colors">
          <span className="mr-2">📞</span>
          음성 통화
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded flex items-center hover:bg-green-600 transition-colors">
          <span className="mr-2">📹</span>
          비디오 통화
        </button>
      </div>
    </div>
  );
};
