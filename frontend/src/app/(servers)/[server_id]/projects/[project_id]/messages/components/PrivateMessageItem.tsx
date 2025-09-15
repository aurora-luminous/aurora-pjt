import React from "react";
import { PrivateMessage } from "../../../../../types";
import { useResponsive } from "../../../../../../lib/useResponsive";

interface PrivateMessageItemProps {
  message: PrivateMessage;
}

export const PrivateMessageItem: React.FC<PrivateMessageItemProps> = ({
  message,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`flex ${message.isOwn ? "justify-end" : "justify-start"} ${
        isMobile ? "mb-3" : "mb-4"
      }`}
    >
      {!message.isOwn && (
        <div
          className={`
          bg-white rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0
          ${isMobile ? "w-8 h-8" : "w-10 h-10"}
        `}
        >
          <span
            className={`
            text-gray-800
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            {message.sender[0]}
          </span>
        </div>
      )}
      <div
        className={`
        ${message.isOwn ? "order-1" : ""}
        ${isMobile ? "max-w-xs" : "max-w-xs lg:max-w-md"}
      `}
      >
        {!message.isOwn && (
          <div className="flex items-center mb-1">
            <span
              className={`
              text-gray-800 font-semibold mr-2
              ${isMobile ? "text-sm" : "text-base"}
            `}
            >
              {message.sender}
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
        )}
        <div
          className={`
            rounded-lg
            ${isMobile ? "px-3 py-2" : "px-4 py-2"}
            ${
              message.isOwn
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-300 text-gray-800"
            }
          `}
        >
          <p
            className={`
            break-words
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            {message.content}
          </p>
          {message.isOwn && (
            <div
              className={`
              text-blue-200 mt-1 text-right
              ${isMobile ? "text-xs" : "text-xs"}
            `}
            >
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
      {message.isOwn && (
        <div
          className={`
          bg-white rounded-full flex items-center justify-center ml-3 mt-1 flex-shrink-0
          ${isMobile ? "w-8 h-8" : "w-10 h-10"}
        `}
        >
          <span
            className={`
            text-gray-800
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            심
          </span>
        </div>
      )}
    </div>
  );
};
