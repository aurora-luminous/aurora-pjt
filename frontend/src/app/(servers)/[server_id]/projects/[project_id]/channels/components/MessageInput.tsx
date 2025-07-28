import React from "react";

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
  return (
    <div className="p-4 bg-white border-t border-gray-300">
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`${channelName}에 메시지 보내기`}
          className="flex-1 bg-gray-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
        />
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            📎
          </button>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            😊
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};
