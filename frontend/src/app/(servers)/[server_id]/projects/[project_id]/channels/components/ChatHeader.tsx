import React from "react";

interface ChatHeaderProps {
  channelName: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ channelName }) => {
  return (
    <div className="border-b border-gray-300 p-3 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-gray-600 mr-2">#</span>
        <span className="text-gray-800 font-semibold">{channelName}</span>
        <div className="flex items-center ml-8 text-sm text-gray-500">
          <span>Figma | GitHub | Canva | 프로젝트 협업 사이트</span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          📎
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          🔔
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          📌
        </button>
      </div>
    </div>
  );
};
