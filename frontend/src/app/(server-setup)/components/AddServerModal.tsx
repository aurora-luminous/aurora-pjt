"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../hooks/useModal";
import { useServer } from "../hooks/useServer";

const AddServerModal = () => {
  const { isOpen, isServerAddModal, close } = useModal();
  const {
    handleAddServer,
    isAddingServer,
    isAddServerSuccess,
    isAddServerError,
    addServerError,
    resetAddServer,
  } = useServer();
  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // useServer의 통합된 서버 추가 함수 사용
    handleAddServer({
      serverUrl: serverUrl,
      serverName: serverName,
    });
  };

  const handleClose = () => {
    resetAddServer(); // 서버 상태 초기화
    setServerUrl("");
    setServerName("");
    close();
  };

  const handleRetry = () => {
    resetAddServer(); // 에러 상태 초기화
  };

  return (
    <AnimatePresence>
      {isOpen && isServerAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-aurora-form/80 backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl mx-auto bg-aurora-form rounded-xl p-8 border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            {!isAddServerSuccess && !isAddServerError && (
              <div className="flex flex-col">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      disabled={isAddingServer}
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
                      disabled={isAddingServer}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingServer}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {isAddingServer ? "추가 중..." : "서버 추가"}
                  </button>
                </form>
              </div>
            )}

            {isAddServerSuccess && (
              <div className="flex flex-col space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    서버 추가 성공!
                  </h2>
                  <p className="text-white">
                    새로운 서버가 성공적으로 추가되었습니다.
                  </p>
                </div>

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={close}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {isAddServerError && (
              <div className="flex flex-col space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-red-400 mb-2">
                    서버 추가 실패
                  </h2>
                  <p className="text-white/80 mb-4">
                    서버 추가 중 오류가 발생했습니다.
                  </p>
                  {addServerError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                      <p className="text-red-300 text-sm">
                        {addServerError instanceof Error
                          ? addServerError.message
                          : "알 수 없는 오류가 발생했습니다."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddServerModal;
