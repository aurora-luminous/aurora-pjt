import React from "react";

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
  return (
    <div className="p-4 bg-white border-t border-gray-300">
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`${userName}에게 메시지 보내기`}
          className="flex-1 bg-gray-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  );
};
