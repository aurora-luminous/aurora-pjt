"use client";

import React from "react";

export interface Invitation {
  id: string;
  code: string;
  url: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  isActive: boolean;
}

interface InviteCardProps {
  invitation: Invitation;
  onDelete: (invitationId: string) => void;
  onCopy: (url: string) => void;
}

const InviteCard: React.FC<InviteCardProps> = ({
  invitation,
  onDelete,
  onCopy,
}) => {
  const isExpired =
    invitation.expiresAt && new Date() > new Date(invitation.expiresAt);
  const isMaxUsesReached =
    invitation.maxUses && invitation.uses >= invitation.maxUses;
  const isInactive = !invitation.isActive || isExpired || isMaxUsesReached;

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <span className="px-2 py-1 bg-red-600 text-red-100 text-xs rounded">
          만료됨
        </span>
      );
    }
    if (isMaxUsesReached) {
      return (
        <span className="px-2 py-1 bg-orange-600 text-orange-100 text-xs rounded">
          사용 완료
        </span>
      );
    }
    if (!invitation.isActive) {
      return (
        <span className="px-2 py-1 bg-gray-600 text-gray-100 text-xs rounded">
          비활성
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
        활성
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const getRemainingTime = () => {
    if (!invitation.expiresAt) return "무제한";

    const now = new Date();
    const expiry = new Date(invitation.expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "만료됨";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg border p-4 ${
        isInactive ? "border-gray-600 opacity-70" : "border-gray-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* 초대 코드와 상태 */}
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-white font-medium">#{invitation.code}</h3>
            {getStatusBadge()}
          </div>

          {/* 초대 URL */}
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <code className="bg-gray-700 px-2 py-1 rounded text-sm text-gray-300 flex-1 truncate">
                {invitation.url}
              </code>
              <button
                onClick={() => onCopy(invitation.url)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                disabled={isInactive || !invitation.url}
              >
                복사
              </button>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
            <div>
              <div className="font-medium text-gray-300">생성자</div>
              <div>{invitation.createdBy}</div>
            </div>
            <div>
              <div className="font-medium text-gray-300">생성일</div>
              <div>{formatDate(invitation.createdAt)}</div>
            </div>
            <div>
              <div className="font-medium text-gray-300">남은 시간</div>
              <div>{getRemainingTime()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-300">사용 횟수</div>
              <div>
                {invitation.uses} / {invitation.maxUses || "무제한"}
              </div>
            </div>
          </div>
        </div>

        {/* 작업 버튼 */}
        <div className="ml-4">
          <button
            onClick={() => onDelete(invitation.id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            title="초대 삭제"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteCard;
