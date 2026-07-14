import React from "react";
import { Message } from "../../../../../types";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { isMobile } = useResponsive();

  if (message.isSystem) {
    return (
      <div className={isMobile ? "mb-3" : "mb-4"}>
        <div className="text-gray-500 text-sm">
          <div className="flex items-center mb-1">
            <div
              className={`
              bg-gray-400 rounded-full flex items-center justify-center mr-3
              ${isMobile ? "w-6 h-6" : "w-8 h-8"}
            `}
            >
              <span
                className={`
                text-white
                ${isMobile ? "text-xs" : "text-xs"}
              `}
              >
                시
              </span>
            </div>
            <div>
              <div className="flex items-center">
                <span
                  className={`
                  text-blue-600 font-semibold mr-2
                  ${isMobile ? "text-sm" : "text-base"}
                `}
                >
                  시스템
                </span>
                <span
                  className={`
                  text-gray-400
                  ${isMobile ? "text-xs" : "text-xs"}
                `}
                >
                  {message.timestamp}
                </span>
              </div>
              <p
                className={`
                text-gray-600
                ${isMobile ? "text-sm" : "text-base"}
              `}
              >
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "mb-3" : "mb-4"}>
      <div className="flex">
        <div
          className={`
          bg-white rounded-full flex items-center justify-center mr-3 flex-shrink-0
          ${isMobile ? "w-8 h-8" : "w-10 h-10"}
        `}
        >
          <span
            className={`
            text-gray-800
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            {message.user[0]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className={`flex items-center ${isMobile ? "mb-1" : "mb-1"}`}>
            <span
              className={`
              text-gray-800 font-semibold mr-2
              ${isMobile ? "text-sm" : "text-base"}
            `}
            >
              {message.user}
            </span>
            <span
              className={`
              text-gray-400
              ${isMobile ? "text-xs" : "text-xs"}
            `}
            >
              {message.timestamp}
            </span>
          </div>
          <p
            className={`
            text-gray-700 break-words
            ${isMobile ? "text-sm leading-relaxed" : "text-base"}
          `}
          >
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};
