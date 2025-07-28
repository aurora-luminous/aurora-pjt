import React from "react";
import { PrivateMessage } from "../../../../../types";

interface PrivateMessageItemProps {
  message: PrivateMessage;
}

export const PrivateMessageItem: React.FC<PrivateMessageItemProps> = ({
  message,
}) => {
  return (
    <div
      className={`mb-4 flex ${message.isOwn ? "justify-end" : "justify-start"}`}
    >
      {!message.isOwn && (
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 mt-1">
          <span className="text-gray-800 text-sm">{message.sender[0]}</span>
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md ${message.isOwn ? "order-1" : ""}`}>
        {!message.isOwn && (
          <div className="flex items-center mb-1">
            <span className="text-gray-800 font-semibold mr-2">
              {message.sender}
            </span>
            <span className="text-gray-400 text-xs">{message.timestamp}</span>
          </div>
        )}
        <div
          className={`px-4 py-2 rounded-lg ${
            message.isOwn
              ? "bg-blue-500 text-white ml-auto"
              : "bg-gray-300 text-gray-800"
          }`}
        >
          <p>{message.content}</p>
          {message.isOwn && (
            <div className="text-xs text-blue-200 mt-1 text-right">
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
      {message.isOwn && (
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center ml-3 mt-1">
          <span className="text-gray-800 text-sm">심</span>
        </div>
      )}
    </div>
  );
};
