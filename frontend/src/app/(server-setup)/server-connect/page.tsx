"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useModal } from "../hooks/useModal";
import { useServer } from "../hooks/useServer";
import AddServerModal from "../components/AddServerModal";

const ServerConnectPage = () => {
  const { openServerAddModal, close, isServerAddModal } = useModal();
  const {
    handleGetProjectList,
    isGettingProjectList,
    isGettingChannelList,
    isCreatingChannel,
    projectListError,
    channelListError,
    createChannelError,
  } = useServer();

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

      // useServer의 handleGetProjectList 사용
      await handleGetProjectList(serverUrl, serverName);
    } catch (error) {
      console.error("서버 연결 실패:", error);

      // 구체적인 에러 메시지 표시
      let errorMessage = "서버 연결에 실패했습니다.";

      if (projectListError) {
        errorMessage = "프로젝트 목록을 가져올 수 없습니다.";
      } else if (channelListError) {
        errorMessage = "채널 목록을 가져올 수 없습니다.";
      } else if (createChannelError) {
        errorMessage = "채널 생성에 실패했습니다.";
      }

      alert(`${errorMessage} 다시 시도해주세요.`);
    }
  };

  // 로딩 상태 확인
  const isLoading =
    isGettingProjectList || isGettingChannelList || isCreatingChannel;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 gap-2">
          {/* 왼쪽: 서버 추가 폼 */}
          <div className="space-y-6">
            <div className="text-center lg:text-center">
              <h1 className="text-3xl font-bold text-white mb-4">서버 입장</h1>
              <hr className="w-full border-white/20" />
            </div>

            <form onSubmit={handleServerJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  서버 도메인 URL을 입력해주세요.
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="서버 URL"
                  className="w-full px-4 py-3 bg-white border border-white/20 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  서버 호스팅 이름을 입력해주세요.
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="서버 호스팅 이름"
                  className="w-full px-4 py-3 bg-white border border-gray-500 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 로딩 상태 표시 */}
              {isLoading && (
                <div className="text-center text-white/80 text-sm">
                  {isGettingProjectList && "📋 프로젝트 목록 조회 중..."}
                  {isGettingChannelList && "📺 채널 목록 조회 중..."}
                  {isCreatingChannel && "🔨 기본 채널 생성 중..."}
                </div>
              )}

              <div className="w-full text-end">
                <p className="text-xs text-white text-right">
                  서버가 없으신가요?{" "}
                  <span
                    className="text-purple-300 cursor-pointer"
                    onClick={handleServerAdd}
                  >
                    서버 추가하기
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {isLoading ? "연결 중..." : "서버 입장"}
              </button>
            </form>
          </div>

          {/* 오른쪽: 사용자 정보 및 서버 선택 */}
        </div>
      </motion.div>

      {/* 모달 렌더링 */}
      <AddServerModal />
    </>
  );
};

export default ServerConnectPage;
