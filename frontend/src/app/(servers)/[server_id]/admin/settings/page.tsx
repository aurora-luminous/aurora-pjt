"use client";

import React, { useState } from "react";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useResponsive } from "../../../../lib/useResponsive";
import { useAdminPermission } from "../../../hooks/useAdmin";

const SettingsPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isAdmin, currentServerRole, isLoading } = useAdminPermission();
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

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="flex h-full bg-gray-900 items-center justify-center">
        <div className={`text-white text-center ${isMobile ? "px-4" : "px-0"}`}>
          <div className={`mb-4 ${isMobile ? "text-base" : "text-lg"}`}>
            권한을 확인하는 중...
          </div>
          <div
            className={`
            border-2 border-white border-t-transparent rounded-full animate-spin mx-auto
            ${isMobile ? "w-6 h-6" : "w-8 h-8"}
          `}
          ></div>
        </div>
      </div>
    );
  }

  // 권한이 없는 경우
  if (!isAdmin) {
    return (
      <div className="flex h-full bg-gray-900 items-center justify-center">
        <div
          className={`
          text-center bg-red-900/20 border border-red-600 rounded-lg
          ${isMobile ? "p-6 mx-4 max-w-sm" : "p-8 max-w-md"}
        `}
        >
          <div
            className={`
            text-red-400 mb-4
            ${isMobile ? "text-4xl" : "text-6xl"}
          `}
          >
            🚫
          </div>
          <h1
            className={`
            text-white font-bold mb-2
            ${isMobile ? "text-xl" : "text-2xl"}
          `}
          >
            접근 권한이 없습니다
          </h1>
          <p
            className={`
            text-gray-300 mb-4
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            관리자 페이지는 서버 소유자 또는 관리자만 접근할 수 있습니다.
          </p>
          <p
            className={`
            text-gray-400
            ${isMobile ? "text-xs" : "text-sm"}
          `}
          >
            현재 권한:{" "}
            <span className="text-yellow-400">
              {currentServerRole || "member"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isMobile ? "p-4" : "p-6"}`}>
      {/* 헤더 */}
      <div className={`mb-6 ${isMobile ? "mb-4" : "mb-6"}`}>
        <h1
          className={`font-bold text-white mb-2 ${
            isMobile ? "text-xl" : "text-2xl"
          }`}
        >
          서버 설정
        </h1>
        <p className={`text-gray-400 ${isMobile ? "text-sm" : "text-base"}`}>
          서버의 고급 설정을 관리하세요. 주의깊게 진행해주세요.
        </p>
      </div>

      {/* 일반 설정 */}
      <div className={`mb-8 ${isMobile ? "mb-6" : "mb-8"}`}>
        <h2
          className={`font-bold text-white mb-4 ${
            isMobile ? "text-lg" : "text-xl"
          }`}
        >
          일반 설정
        </h2>
        <div className={`bg-gray-800 rounded-lg ${isMobile ? "p-4" : "p-6"}`}>
          <div className="space-y-6">
            {/* 서버 이름 */}
            <div>
              <label
                className={`block font-medium text-gray-300 mb-2 ${
                  isMobile ? "text-sm" : "text-sm"
                }`}
              >
                서버 이름
              </label>
              <input
                type="text"
                value={serverInfo?.serverName || ""}
                disabled
                className={`w-full bg-gray-700 border border-gray-600 rounded-md text-white opacity-50 cursor-not-allowed ${
                  isMobile ? "px-3 py-2 text-sm" : "px-3 py-2"
                }`}
              />
              <p
                className={`text-gray-400 mt-1 ${
                  isMobile ? "text-xs" : "text-xs"
                }`}
              >
                서버 이름은 현재 변경할 수 없습니다.
              </p>
            </div>

            {/* 서버 설명 */}
            <div>
              <label
                className={`block font-medium text-gray-300 mb-2 ${
                  isMobile ? "text-sm" : "text-sm"
                }`}
              >
                서버 설명
              </label>
              <textarea
                rows={isMobile ? 2 : 3}
                placeholder="서버에 대한 설명을 입력하세요..."
                className={`w-full bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isMobile ? "px-3 py-2 text-sm" : "px-3 py-2"
                }`}
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button
                className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  isMobile ? "px-3 py-2 text-sm" : "px-4 py-2"
                }`}
              >
                변경사항 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 위험 영역 */}
      <div className={`mb-8 ${isMobile ? "mb-6" : "mb-8"}`}>
        <h2
          className={`font-bold text-red-400 mb-4 ${
            isMobile ? "text-lg" : "text-xl"
          }`}
        >
          위험 영역
        </h2>
        <div
          className={`bg-red-900/20 border border-red-500/30 rounded-lg ${
            isMobile ? "p-4" : "p-6"
          }`}
        >
          <div className="space-y-6">
            {/* 경고 메시지 */}
            <div
              className={`bg-red-800/30 border border-red-600/50 rounded-lg ${
                isMobile ? "p-3" : "p-4"
              }`}
            >
              <div
                className={`flex items-start ${
                  isMobile ? "space-x-2" : "space-x-3"
                }`}
              >
                <span
                  className={`text-red-400 ${
                    isMobile ? "text-base" : "text-lg"
                  }`}
                >
                  ⚠️
                </span>
                <div>
                  <h3
                    className={`text-red-200 font-medium mb-1 ${
                      isMobile ? "text-sm" : "text-base"
                    }`}
                  >
                    서버 삭제
                  </h3>
                  <p
                    className={`text-red-300 ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    서버를 삭제하면 모든 채널, 메시지, 멤버 데이터가 영구적으로
                    삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 서버 삭제 */}
            <div>
              <h3
                className={`text-red-400 font-medium mb-3 ${
                  isMobile ? "text-sm" : "text-base"
                }`}
              >
                서버 삭제
              </h3>
              <p
                className={`text-gray-300 mb-4 ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
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
                  className={`w-full bg-gray-700 border border-red-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isMobile ? "px-3 py-2 text-sm" : "px-3 py-2"
                  }`}
                />

                <button
                  onClick={handleDeleteServer}
                  disabled={
                    confirmDeleteText !== serverInfo?.serverName || isDeleting
                  }
                  className={`w-full bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                    isMobile ? "px-3 py-2 text-sm" : "px-4 py-3"
                  }`}
                >
                  {isDeleting ? "삭제 중..." : "서버 영구 삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className={`bg-gray-800 rounded-lg ${isMobile ? "p-4" : "p-6"}`}>
        <h3
          className={`text-white font-medium mb-3 ${
            isMobile ? "text-sm" : "text-base"
          }`}
        >
          서버 정보
        </h3>
        <div
          className={`gap-4 text-sm ${
            isMobile ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2"
          }`}
        >
          <div>
            <div
              className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
            >
              서버 ID
            </div>
            <div
              className={`text-white font-mono ${
                isMobile ? "text-xs break-all" : "text-sm"
              }`}
            >
              {serverInfo?.serverUrl || "N/A"}
            </div>
          </div>
          <div>
            <div
              className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
            >
              생성일
            </div>
            <div className={`text-white ${isMobile ? "text-xs" : "text-sm"}`}>
              2023년 11월 15일
            </div>
          </div>
          <div>
            <div
              className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
            >
              소유자
            </div>
            <div className={`text-white ${isMobile ? "text-xs" : "text-sm"}`}>
              김관리자
            </div>
          </div>
          <div>
            <div
              className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
            >
              멤버 수
            </div>
            <div className={`text-white ${isMobile ? "text-xs" : "text-sm"}`}>
              47명
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
