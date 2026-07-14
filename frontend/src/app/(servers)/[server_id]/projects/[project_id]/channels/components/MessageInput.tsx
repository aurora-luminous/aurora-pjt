import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  channelName: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  channelName,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
      bg-white border-t border-gray-300
      ${isMobile ? "p-3" : "p-4"}
    `}
    >
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`${channelName}에 메시지 보내기`}
          className={`
            flex-1 bg-gray-100 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2
            ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"}
          `}
        />
        <div
          className={`flex items-center ${
            isMobile ? "space-x-1" : "space-x-2"
          }`}
        >
          <button
            type="button"
            className={`
              text-gray-500 hover:text-gray-700 transition-colors
              ${isMobile ? "p-2 text-sm" : "p-2 text-base"}
            `}
          >
            📎
          </button>
          <button
            type="button"
            className={`
              text-gray-500 hover:text-gray-700 transition-colors
              ${isMobile ? "p-2 text-sm" : "p-2 text-base"}
            `}
          >
            😊
          </button>
          <button
            type="submit"
            className={`
              bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors
              ${isMobile ? "p-2 text-sm" : "p-3 text-base"}
            `}
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};
