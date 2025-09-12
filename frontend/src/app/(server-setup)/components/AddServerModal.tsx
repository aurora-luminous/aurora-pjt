"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../hooks/useModal";
import { useServerFlow } from "../hooks/useServerFlow";
import { useResponsive } from "../../lib/useResponsive";

const AddServerModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isServerAddModal, close } = useModal();
  const {
    handleAddServer,
    isAddingServer,
    isAddServerSuccess,
    addServerError,
    resetAddServer,
  } = useServerFlow();
  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");

  // 에러 상태는 addServerError 존재 여부로 판단
  const isAddServerError = !!addServerError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // useServerFlow의 통합된 서버 추가 함수 사용
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
          className={`
            fixed inset-0 flex items-center justify-center z-50 bg-aurora-form/80 backdrop-blur-md
            ${isMobile ? "p-4" : "p-8"}
          `}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`
              w-full bg-aurora-form rounded-xl border border-black/10
              ${
                isMobile
                  ? "max-w-sm p-6"
                  : isTablet
                  ? "max-w-lg p-7"
                  : "max-w-xl p-8"
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {!isAddServerSuccess && !isAddServerError && (
              <div className="flex flex-col">
                <form
                  onSubmit={handleSubmit}
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
                        ${
                          isMobile
                            ? "px-3 py-2.5 text-sm"
                            : "px-4 py-3 text-base"
                        }
                      `}
                      required
                      disabled={isAddingServer}
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
                        ${
                          isMobile
                            ? "px-3 py-2.5 text-sm"
                            : "px-4 py-3 text-base"
                        }
                      `}
                      required
                      disabled={isAddingServer}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingServer}
                    className={`
                      w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white 
                      font-semibold rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400
                      ${
                        isMobile ? "py-2.5 px-3 text-sm" : "py-3 px-4 text-base"
                      }
                    `}
                  >
                    {isAddingServer ? "추가 중..." : "서버 추가"}
                  </button>
                </form>
              </div>
            )}

            {isAddServerSuccess && (
              <div
                className={`flex flex-col ${
                  isMobile ? "space-y-3" : "space-y-4"
                }`}
              >
                <div className={`text-center ${isMobile ? "mb-4" : "mb-6"}`}>
                  <h2
                    className={`
                    font-bold text-white mb-2
                    ${isMobile ? "text-xl" : isTablet ? "text-xl" : "text-2xl"}
                  `}
                  >
                    서버 추가 성공!
                  </h2>
                  <p
                    className={`
                    text-white
                    ${isMobile ? "text-sm" : "text-base"}
                  `}
                  >
                    새로운 서버가 성공적으로 추가되었습니다.
                  </p>
                </div>

                <div
                  className={`flex justify-center ${
                    isMobile ? "space-x-2" : "space-x-3"
                  }`}
                >
                  <button
                    onClick={close}
                    className={`
                      bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200
                      ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2 text-base"}
                    `}
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      // 새로고침 or 리다이렉트 로직
                      window.location.reload();
                    }}
                    className={`
                      bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition duration-200
                      ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2 text-base"}
                    `}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {isAddServerError && (
              <div
                className={`flex flex-col ${
                  isMobile ? "space-y-3" : "space-y-4"
                }`}
              >
                <div className={`text-center ${isMobile ? "mb-4" : "mb-6"}`}>
                  <h2
                    className={`
                    font-bold text-red-400 mb-2
                    ${isMobile ? "text-xl" : isTablet ? "text-xl" : "text-2xl"}
                  `}
                  >
                    서버 추가 실패
                  </h2>
                  <p
                    className={`
                    text-white mb-4
                    ${isMobile ? "text-sm" : "text-base"}
                  `}
                  >
                    서버 추가 중 문제가 발생했습니다.
                  </p>

                  {addServerError && (
                    <div
                      className={`
                      bg-red-500/20 border border-red-500/30 rounded-lg
                      ${isMobile ? "p-3" : "p-4"}
                    `}
                    >
                      <p
                        className={`
                        text-red-300
                        ${isMobile ? "text-xs" : "text-sm"}
                      `}
                      >
                        {typeof addServerError === "string"
                          ? addServerError
                          : addServerError instanceof Error
                          ? addServerError.message
                          : "알 수 없는 오류가 발생했습니다."}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`flex justify-center ${
                    isMobile ? "space-x-2" : "space-x-3"
                  }`}
                >
                  <button
                    onClick={handleClose}
                    className={`
                      bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200
                      ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2 text-base"}
                    `}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleRetry}
                    className={`
                      bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition duration-200
                      ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2 text-base"}
                    `}
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
