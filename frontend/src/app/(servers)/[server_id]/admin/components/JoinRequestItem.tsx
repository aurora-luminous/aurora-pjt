import React from "react";
import Image from "next/image";
import {
  useJoinRequestItem,
  JoinRequest,
} from "@/app/(servers)/hooks/useAdmin";
import { useResponsive } from "../../../../lib/useResponsive";

interface JoinRequestItemProps {
  request: JoinRequest;
  isSelected?: boolean;
  onSelect?: (userEmail: string, selected: boolean) => void;
  onApprove: (userEmail: string) => Promise<void>;
  onReject: (userEmail: string) => Promise<void>;
}

const JoinRequestItem: React.FC<JoinRequestItemProps> = ({
  request,
  isSelected = false,
  onSelect,
  onApprove,
  onReject,
}) => {
  const { isMobile } = useResponsive();
  const {
    isProcessing,
    handleApprove,
    handleReject,
    handleCheckboxChange,
    getStatusBadge,
  } = useJoinRequestItem(request, onApprove, onReject, onSelect);

  const statusBadge = getStatusBadge();

  return (
    <div
      className={`
      bg-gray-700 rounded-lg border border-gray-600
      ${isMobile ? "p-3" : "p-4"}
    `}
    >
      <div className="flex items-start justify-between">
        {/* 사용자 정보 */}
        <div
          className={`
          flex items-start flex-1
          ${isMobile ? "space-x-2" : "space-x-3"}
        `}
        >
          {/* 체크박스 */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className={`
              text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500
              ${isMobile ? "mt-0.5 w-4 h-4" : "mt-1 w-4 h-4"}
            `}
          />

          {/* 아바타 */}
          <div
            className={`
            bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0
            ${isMobile ? "w-8 h-8" : "w-10 h-10"}
          `}
          >
            {request.userAvatar ? (
              <Image
                src={request.userAvatar}
                alt={request.userName}
                className={`rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"}`}
              />
            ) : (
              <span
                className={`
                text-white font-medium
                ${isMobile ? "text-xs" : "text-sm"}
              `}
              >
                {request.userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* 사용자 정보 및 메시지 */}
          <div className="flex-1 min-w-0">
            <div
              className={`
              flex items-center
              ${isMobile ? "space-x-1" : "space-x-2"}
            `}
            >
              <h3
                className={`
                text-white font-medium truncate
                ${isMobile ? "text-sm" : "text-base"}
              `}
              >
                {request.userName}
              </h3>
              {statusBadge && (
                <span
                  className={`
                  ${statusBadge.className}
                  ${isMobile ? "text-xs px-1.5 py-0.5" : ""}
                `}
                >
                  {statusBadge.text}
                </span>
              )}
            </div>
            <p
              className={`
              text-gray-300 mt-1 break-words
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              {request.userEmail}
            </p>
            <p
              className={`
              text-gray-300 mt-1 break-words
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              {request.message}
            </p>
            <p
              className={`
              text-gray-500 mt-1
              ${isMobile ? "text-xs" : "text-xs"}
            `}
            >
              {new Date(request.requestDate).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* 액션 버튼들 */}
        {request.sStatus === "Pending" && (
          <div
            className={`
            flex flex-shrink-0
            ${isMobile ? "space-x-1 ml-2" : "space-x-2 ml-4"}
          `}
          >
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className={`
                bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg flex items-center justify-center transition-colors
                ${isMobile ? "w-8 h-8" : "w-10 h-10"}
              `}
              title="승인"
            >
              <svg
                className={`text-white ${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className={`
                bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg flex items-center justify-center transition-colors
                ${isMobile ? "w-8 h-8" : "w-10 h-10"}
              `}
              title="거절"
            >
              <svg
                className={`text-white ${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinRequestItem;
