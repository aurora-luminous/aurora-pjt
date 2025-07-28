import React from "react";
import { ChatUser } from "../../../../../types";

interface PrivateMessageHeaderProps {
  user: ChatUser | undefined;
  userName: string;
}

export const PrivateMessageHeader: React.FC<PrivateMessageHeaderProps> = ({
  user,
  userName,
}) => {
  return (
    <div className="bg-white border-b border-gray-300 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
            <span className="text-gray-800 text-sm">{userName[0]}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-800 font-semibold">{userName}</span>
            {user && (
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
        <div className="flex items-center space-x-4">
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="음성 통화"
          >
            📞
          </button>
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="비디오 통화"
          >
            📹
          </button>
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="설정"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};
