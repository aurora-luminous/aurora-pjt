"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useModal } from "../hooks/useModal";
import AddServerModal from "../components/AddServerModal";

const ServerConnectPage = () => {
  const router = useRouter();
  const { openServerAddModal, close, isServerAddModal } = useModal();

  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");
  const [selectedServer, setSelectedServer] = useState("SSAFY 연구반");

  // 서버 이름을 서버 ID로 변환하는 함수
  const getProjectIdFromServerName = (serverName: string) => {
    const serverMap: { [key: string]: string } = {
      "SSAFY 연구반": "ssafy-research",
      "테스트 서버": "test-server",
      "개발 서버": "dev-server",
    };
    return (
      serverMap[serverName] || serverName.toLowerCase().replace(/\s+/g, "-")
    );
  };

  const handleServerAdd = (e: React.FormEvent) => {
    e.preventDefault();
    openServerAddModal();
    // 서버 추가 로직 구현
  };

  const handleServerJoin = (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 데이터 검증
    if (!serverUrl || !serverName) {
      alert("서버 URL과 서버 이름을 모두 입력해주세요.");
      return;
    }

    try {
      // 실제로는 여기서 서버 연결 API 호출
      console.log("서버 연결 시도:", { serverUrl, serverName });

      // 서버 연결 성공 시 서버 대시보드로 이동 (프로젝트 목록 표시)
      const serverId = getProjectIdFromServerName(serverName);
      console.log("서버 이름:", serverName, "→ 서버 ID:", serverId);
      router.push(`/${serverId}`);
    } catch (error) {
      console.error("서버 연결 실패:", error);
      alert("서버 연결에 실패했습니다. 다시 시도해주세요.");
    }
  };

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
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="서버 URL"
                  className="w-full px-4 py-3 bg-white border border-white/20 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors"
                  required
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
                />
              </div>
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
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                서버 입장
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
