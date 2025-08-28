"use client";

import React from "react";

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
  return (
    <div className="mb-4 bg-blue-900/50 border border-blue-500/50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium">
            {selectedCount}명의 멤버가 선택됨
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onBulkKick}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <span>👢</span>
              <span>일괄 킥</span>
            </button>
            <button
              onClick={onBulkBan}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <span>🚫</span>
              <span>일괄 차단</span>
            </button>
          </div>
        </div>
        <div className="text-blue-200 text-sm">
          선택된 멤버들에게 일괄 작업을 수행할 수 있습니다.
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
