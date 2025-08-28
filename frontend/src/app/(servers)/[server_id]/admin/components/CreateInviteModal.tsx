"use client";

import React, { useState } from "react";

interface CreateInviteModalProps {
  onClose: () => void;
  onSubmit: (inviteData: { expiresAt?: string; maxUses?: number }) => void;
}

const CreateInviteModal: React.FC<CreateInviteModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [expirationType, setExpirationType] = useState<
    "never" | "30m" | "1h" | "6h" | "12h" | "1d" | "7d"
  >("1d");
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [temporaryInvite, setTemporaryInvite] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let expiresAt: string | undefined;

    if (expirationType !== "never") {
      const now = new Date();
      switch (expirationType) {
        case "30m":
          now.setMinutes(now.getMinutes() + 30);
          break;
        case "1h":
          now.setHours(now.getHours() + 1);
          break;
        case "6h":
          now.setHours(now.getHours() + 6);
          break;
        case "12h":
          now.setHours(now.getHours() + 12);
          break;
        case "1d":
          now.setDate(now.getDate() + 1);
          break;
        case "7d":
          now.setDate(now.getDate() + 7);
          break;
      }
      expiresAt = now.toISOString();
    }

    onSubmit({
      expiresAt,
      maxUses: temporaryInvite ? 1 : maxUses,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">초대 링크 만들기</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 만료 시간 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              만료 시간
            </label>
            <select
              value={expirationType}
              onChange={(e) =>
                setExpirationType(
                  e.target.value as
                    | "never"
                    | "30m"
                    | "1h"
                    | "6h"
                    | "12h"
                    | "1d"
                    | "7d"
                )
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="never">만료되지 않음</option>
              <option value="30m">30분 후</option>
              <option value="1h">1시간 후</option>
              <option value="6h">6시간 후</option>
              <option value="12h">12시간 후</option>
              <option value="1d">1일 후</option>
              <option value="7d">7일 후</option>
            </select>
          </div>

          {/* 최대 사용 횟수 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              최대 사용 횟수
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="uses"
                  checked={maxUses === undefined && !temporaryInvite}
                  onChange={() => {
                    setMaxUses(undefined);
                    setTemporaryInvite(false);
                  }}
                  className="text-blue-600"
                />
                <span className="text-white">무제한</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="uses"
                  checked={temporaryInvite}
                  onChange={() => {
                    setTemporaryInvite(true);
                    setMaxUses(1);
                  }}
                  className="text-blue-600"
                />
                <span className="text-white">1회용 (임시 초대)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="uses"
                  checked={maxUses !== undefined && !temporaryInvite}
                  onChange={() => {
                    setTemporaryInvite(false);
                    setMaxUses(5);
                  }}
                  className="text-blue-600"
                />
                <span className="text-white">사용자 지정:</span>
                {maxUses !== undefined && !temporaryInvite && (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </label>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-blue-200 text-sm">
              💡 초대 링크는 설정된 조건에 따라 자동으로 만료됩니다. 보안을 위해
              정기적으로 새로운 링크를 생성하는 것을 권장합니다.
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              초대 링크 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInviteModal;
