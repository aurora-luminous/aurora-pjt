import React from "react";
import { Message } from "../../../../../types";

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  if (message.isSystem) {
    return (
      <div className="mb-4">
        <div className="text-gray-500 text-sm">
          <div className="flex items-center mb-1">
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs">시</span>
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-blue-600 font-semibold mr-2">시스템</span>
                <span className="text-gray-400 text-xs">
                  {message.timestamp}
                </span>
              </div>
              <p className="text-gray-600">{message.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
          <span className="text-gray-800 text-sm">{message.user[0]}</span>
        </div>
        <div>
          <div className="flex items-center mb-1">
            <span className="text-gray-800 font-semibold mr-2">
              {message.user}
            </span>
            <span className="text-gray-400 text-xs">{message.timestamp}</span>
          </div>
          <p className="text-gray-700">{message.content}</p>
        </div>
      </div>
    </div>
  );
};
