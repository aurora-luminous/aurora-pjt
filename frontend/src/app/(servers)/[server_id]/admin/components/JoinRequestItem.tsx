import React from "react";
import Image from "next/image";
import { useJoinRequestItem, JoinRequest } from "@/app/(servers)/hooks/useAdmin";

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
  const {
    isProcessing,
    handleApprove,
    handleReject,
    handleCheckboxChange,
    getStatusBadge,
  } = useJoinRequestItem(request, onApprove, onReject, onSelect);

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
      <div className="flex items-start justify-between">
        {/* 사용자 정보 */}
        <div className="flex items-start space-x-3 flex-1">
          {/* 체크박스 */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
          />

          {/* 아바타 */}
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            {request.userAvatar ? (
              <Image
                src={request.userAvatar}
                alt={request.userName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-white font-medium text-sm">
                {request.userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* 사용자 정보 및 메시지 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-medium">{request.userName}</h3>
              {statusBadge && (
                <span className={statusBadge.className}>
                  {statusBadge.text}
                </span>
              )}
            </div>
            <p className="text-gray-300 text-sm mt-1 break-words">
              {request.userEmail}
            </p>
            <p className="text-gray-300 text-sm mt-1 break-words">
              {request.message}
            </p>
            <p className="text-gray-500 text-xs mt-1">
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
        {request.status === "pending" && (
          <div className="flex space-x-2 ml-4 flex-shrink-0">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg flex items-center justify-center transition-colors"
              title="승인"
            >
              <svg
                className="w-5 h-5 text-white"
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
              className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg flex items-center justify-center transition-colors"
              title="거절"
            >
              <svg
                className="w-5 h-5 text-white"
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
