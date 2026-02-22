"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useModal } from "../hooks/useModal";
import { useServerFlow } from "../hooks/useServerFlow";
import AddServerModal from "../components/AddServerModal";
import { useResponsive } from "../../lib/useResponsive";

const ServerConnectPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const { openServerAddModal, close, isServerAddModal } = useModal();
  const {
    handleServerConnection,
    isValidatingAccess,
    isLoadingProjects,
    isLoadingChannels,
    isCreatingChannel,
    validationError,
    projectError,
    channelError,
    createChannelError,
  } = useServerFlow();

  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");

  const handleServerAdd = (e: React.FormEvent) => {
    e.preventDefault();
    openServerAddModal();
  };

  const handleServerJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 데이터 검증
    if (!serverUrl || !serverName) {
      alert("서버 URL과 서버 이름을 모두 입력해주세요.");
      return;
    }

    try {
      console.log("서버 연결 시도:", { serverUrl, serverName });

      // useServerFlow의 handleServerConnection 사용
      await handleServerConnection(serverUrl, serverName);
    } catch (error) {
      console.error("서버 연결 실패:", error);

      // 구체적인 에러 메시지 표시
      let errorMessage = "서버 연결에 실패했습니다.";

      if (validationError) {
        errorMessage = "서버 목록을 가져올 수 없습니다.";
      } else if (projectError) {
        errorMessage = "프로젝트 목록을 가져올 수 없습니다.";
      } else if (channelError) {
        errorMessage = "채널 목록을 가져올 수 없습니다.";
      } else if (createChannelError) {
        errorMessage = "채널 생성에 실패했습니다.";
      }

     console.error(errorMessage)
    }
  };

  // 로딩 상태 확인
  const isLoading =
    isValidatingAccess ||
    isLoadingProjects ||
    isLoadingChannels ||
    isCreatingChannel;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 gap-2">
          {/* 서버 입장 폼 */}
          <div className={`${isMobile ? "space-y-4" : "space-y-6"}`}>
            <div className="text-center lg:text-center">
              <h1
                className={`
                font-bold text-white mb-4
                ${isMobile ? "text-2xl" : isTablet ? "text-2xl" : "text-3xl"}
              `}
              >
                서버 입장
              </h1>
              <hr className="w-full border-white/20" />
            </div>

            <form
              onSubmit={handleServerJoin}
              className={`${isMobile ? "space-y-3" : "space-y-4"}`}
            >
              <div>
                <label
                  className={`
                  block font-medium text-white/90 mb-2
                  ${isMobile ? "text-sm" : "text-sm"}
                `}
                >
                  서버 도메인 URL을 입력해주세요.
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="서버 URL"
                  className={`
                    w-full bg-white border border-white/20 rounded-lg text-gray-500 placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                    backdrop-blur-sm transition-colors
                    ${isMobile ? "px-3 py-2.5 text-sm" : "px-4 py-3 text-base"}
                  `}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  className={`
                  block font-medium text-white/90 mb-2
                  ${isMobile ? "text-sm" : "text-sm"}
                `}
                >
                  서버 호스팅 이름을 입력해주세요.
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="서버 호스팅 이름"
                  className={`
                    w-full bg-white border border-gray-500 rounded-lg text-gray-500 placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                    backdrop-blur-sm transition-colors
                    ${isMobile ? "px-3 py-2.5 text-sm" : "px-4 py-3 text-base"}
                  `}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 로딩 상태 표시 */}
              {isLoading && (
                <div
                  className={`text-center text-white/80 ${
                    isMobile ? "text-sm" : "text-sm"
                  }`}
                >
                  {isValidatingAccess && "🔍 서버 접근 권한 확인 중..."}
                  {!isValidatingAccess &&
                    isLoadingProjects &&
                    "📋 프로젝트 목록 조회 중..."}
                  {!isValidatingAccess &&
                    !isLoadingProjects &&
                    isLoadingChannels &&
                    "📺 채널 목록 조회 중..."}
                  {!isValidatingAccess &&
                    !isLoadingProjects &&
                    !isLoadingChannels &&
                    isCreatingChannel &&
                    "🔨 기본 채널 생성 중..."}
                </div>
              )}

              <div className="w-full text-end">
                <p
                  className={`text-white text-right ${
                    isMobile ? "text-xs" : "text-xs"
                  }`}
                >
                  서버가 없으신가요?{" "}
                  <span
                    className="text-purple-300 cursor-pointer hover:text-purple-200"
                    onClick={handleServerAdd}
                  >
                    서버 추가하기
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 
                  disabled:cursor-not-allowed text-white font-semibold rounded-lg 
                  transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400
                  ${isMobile ? "py-2.5 px-3 text-sm" : "py-3 px-4 text-base"}
                `}
              >
                {isLoading ? "연결 중..." : "서버 입장"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* 모달 렌더링 */}
      <AddServerModal />
    </>
  );
};

export default ServerConnectPage;
