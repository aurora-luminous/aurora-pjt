"use client";

import React, { useState } from "react";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";

const SettingsPage = () => {
  const serverInfo = useCurrentServerInfo();
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteServer = async () => {
    if (confirmDeleteText !== serverInfo?.serverName) {
      alert("서버 이름이 정확하지 않습니다.");
      return;
    }

    if (
      !confirm(
        "정말로 이 서버를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // 실제 API 호출 로직
      // await deleteServer(serverId);
      console.log("서버 삭제 완료");
      // 실제로는 서버 목록 페이지로 리다이렉트
    } catch (error) {
      console.error("서버 삭제 실패:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">서버 설정</h1>
        <p className="text-gray-400">
          서버의 고급 설정을 관리하세요. 주의깊게 진행해주세요.
        </p>
      </div>

      {/* 일반 설정 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">일반 설정</h2>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            {/* 서버 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                서버 이름
              </label>
              <input
                type="text"
                value={serverInfo?.serverName || ""}
                disabled
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white opacity-50 cursor-not-allowed"
              />
              <p className="text-gray-400 text-xs mt-1">
                서버 이름은 현재 변경할 수 없습니다.
              </p>
            </div>

            {/* 서버 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                서버 설명
              </label>
              <textarea
                rows={3}
                placeholder="서버에 대한 설명을 입력하세요..."
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                변경사항 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 보안 설정 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">보안 설정</h2>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            {/* 자동 가입 승인 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">자동 가입 승인</h3>
                <p className="text-gray-400 text-sm">
                  새로운 멤버가 서버에 가입할 때 자동으로 승인합니다.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 초대 링크 만료 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                기본 초대 링크 만료 시간
              </label>
              <select className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="1h">1시간</option>
                <option value="6h">6시간</option>
                <option value="1d">1일</option>
                <option value="7d">7일</option>
                <option value="never">만료되지 않음</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 위험 영역 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-red-400 mb-4">위험 영역</h2>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <div className="space-y-6">
            {/* 경고 메시지 */}
            <div className="bg-red-800/30 border border-red-600/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-red-400 text-lg">⚠️</span>
                <div>
                  <h3 className="text-red-200 font-medium mb-1">서버 삭제</h3>
                  <p className="text-red-300 text-sm">
                    서버를 삭제하면 모든 채널, 메시지, 멤버 데이터가 영구적으로
                    삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 서버 삭제 */}
            <div>
              <h3 className="text-red-400 font-medium mb-3">서버 삭제</h3>
              <p className="text-gray-300 text-sm mb-4">
                서버를 삭제하려면 아래에 정확한 서버 이름을 입력하세요:
                <span className="font-bold text-white">
                  {" "}
                  {serverInfo?.serverName}
                </span>
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="서버 이름을 입력하세요"
                  className="w-full bg-gray-700 border border-red-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />

                <button
                  onClick={handleDeleteServer}
                  disabled={
                    confirmDeleteText !== serverInfo?.serverName || isDeleting
                  }
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isDeleting ? "삭제 중..." : "서버 영구 삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white font-medium mb-3">서버 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">서버 ID</div>
            <div className="text-white font-mono">
              {serverInfo?.serverUrl || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-gray-400">생성일</div>
            <div className="text-white">2023년 11월 15일</div>
          </div>
          <div>
            <div className="text-gray-400">소유자</div>
            <div className="text-white">김관리자</div>
          </div>
          <div>
            <div className="text-gray-400">멤버 수</div>
            <div className="text-white">47명</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
