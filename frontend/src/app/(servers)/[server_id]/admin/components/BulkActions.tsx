"use client";

import React from "react";
import { useResponsive } from "../../../../lib/useResponsive";

interface BulkActionsProps {
  selectedCount: number;
  onBulkKick: () => void;
  onBulkBan: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onBulkKick,
  onBulkBan,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
      mb-4 bg-blue-900/50 border border-blue-500/50 rounded-lg
      ${isMobile ? "p-3" : "p-4"}
    `}
    >
      <div
        className={`
        ${
          isMobile
            ? "flex flex-col space-y-3"
            : "flex items-center justify-between"
        }
      `}
      >
        <div
          className={`
          ${
            isMobile ? "flex flex-col space-y-2" : "flex items-center space-x-4"
          }
        `}
        >
          <span
            className={`
            text-white font-medium
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            {selectedCount}명의 멤버가 선택됨
          </span>
          <div
            className={`
            flex
            ${isMobile ? "space-x-2 w-full" : "space-x-2"}
          `}
          >
            <button
              onClick={onBulkKick}
              className={`
                bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2
                ${isMobile ? "px-3 py-2 text-sm flex-1" : "px-4 py-2 text-base"}
              `}
            >
              <span>👢</span>
              <span>일괄 킥</span>
            </button>
            <button
              onClick={onBulkBan}
              className={`
                bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2
                ${isMobile ? "px-3 py-2 text-sm flex-1" : "px-4 py-2 text-base"}
              `}
            >
              <span>🚫</span>
              <span>일괄 차단</span>
            </button>
          </div>
        </div>
        {!isMobile && (
          <div className="text-blue-200 text-sm">
            선택된 멤버들에게 일괄 작업을 수행할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActions;
