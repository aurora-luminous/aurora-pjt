import React from "react";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface PrivateMessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  userName: string;
}

export const PrivateMessageInput: React.FC<PrivateMessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  userName,
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
          placeholder={`${userName}에게 메시지 보내기`}
          className={`
            flex-1 bg-gray-100 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2
            ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"}
          `}
        />
        <button
          type="submit"
          className={`
            bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center
            ${isMobile ? "px-3 py-2 text-sm" : "px-6 py-3 text-base"}
          `}
        >
          {isMobile ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            "전송"
          )}
        </button>
      </form>
    </div>
  );
};
